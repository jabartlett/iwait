// src/checkers/http.ts
import { IncomingMessage } from 'http';
import https from 'https';
import http from 'http';
import http2 from 'http2';
import { parseHttpUnixUrl } from '../parser';
import type { WaitOptions } from '../types';

/**
 * Check if an HTTP(S) resource is available
 */
export async function checkHttp(
  url: string,
  method: 'head' | 'get',
  protocol: 'http' | 'https',
  options: WaitOptions
): Promise<boolean> {
  const {
    httpTimeout,
    headers,
    validateStatus,
    followRedirect,
    basicAuth,
    verbose
  } = options;

  // Check if this is an HTTP Unix socket URL
  const unixSocket = parseHttpUnixUrl(url);
  let finalUrl = url;
  let socketPath: string | undefined;

  if (unixSocket) {
    socketPath = unixSocket.socketPath;
    finalUrl = unixSocket.url;
  }

  // Detect HTTP/2 (assume all https urls can use HTTP/2)
  const isHttp2 = protocol === 'https' && url.includes('h2');

  if (isHttp2) {
    return checkHttp2(finalUrl, method, options);
  }

  // Prepare request options
  const requestOptions: http.RequestOptions = {
    method: method.toUpperCase(),
    headers: {
      ...headers
    },
    timeout: httpTimeout,
    socketPath
  };

  // Add basic auth if provided
  if (basicAuth && basicAuth.username) {
    const auth = Buffer.from(`${basicAuth.username}:${basicAuth.password}`).toString('base64');
    requestOptions.headers!['Authorization'] = `Basic ${auth}`;
  }

  return new Promise<boolean>((resolve) => {
    try {
      // Choose the appropriate request function
      const requestFn = protocol === 'https' ? https.request : http.request;

      const req = requestFn(finalUrl, requestOptions, (res: IncomingMessage) => {
        const { statusCode } = res;

        if (verbose) {
          console.debug(`HTTP ${method.toUpperCase()} request to ${finalUrl} returned status ${statusCode}`);
        }

        // Check if we need to follow redirects
        if (followRedirect && (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308)) {
          const location = res.headers.location;

          if (location) {
            if (verbose) {
              console.debug(`Following redirect to ${location}`);
            }

            // Determine the protocol of the redirect URL
            const redirectProtocol = location.startsWith('https:') ? 'https' : 'http';

            // Follow the redirect
            checkHttp(location, method, redirectProtocol, options)
              .then(resolve)
              .catch(() => resolve(false));

            return;
          }
        }

        // Consume the response data to free up memory
        res.on('data', () => { });

        // Validate the status code
        const validStatus = validateStatus ? validateStatus(statusCode ?? 0) : (statusCode !== undefined && statusCode >= 200 && statusCode < 300);
        resolve(validStatus);
      });

      req.on('error', (error) => {
        if (verbose) {
          console.debug(`HTTP request error for ${finalUrl}:`, error);
        }
        resolve(false);
      });

      req.on('timeout', () => {
        if (verbose) {
          console.debug(`HTTP request timeout for ${finalUrl}`);
        }
        req.destroy();
        resolve(false);
      });

      req.end();
    } catch (error) {
      if (verbose) {
        console.debug(`Error setting up HTTP request for ${finalUrl}:`, error);
      }
      resolve(false);
    }
  });
}

/**
 * Check HTTP/2 resource
 */
async function checkHttp2(
  url: string,
  method: 'head' | 'get',
  options: WaitOptions
): Promise<boolean> {
  const { httpTimeout, headers, validateStatus, verbose } = options;

  return new Promise<boolean>((resolve) => {
    try {
      const client = http2.connect(url);

      client.on('error', (err) => {
        if (verbose) {
          console.debug(`HTTP/2 connection error for ${url}:`, err);
        }
        client.close();
        resolve(false);
      });

      client.on('connect', () => {
        const req = client.request({
          ':method': method.toUpperCase(),
          ...headers
        });

        let timeoutId: NodeJS.Timeout | undefined;
        if (httpTimeout) {
          timeoutId = setTimeout(() => {
            if (verbose) {
              console.debug(`HTTP/2 request timeout for ${url}`);
            }
            req.close();
            client.close();
            resolve(false);
          }, httpTimeout);
        }

        req.on('response', (headers) => {
          if (timeoutId) clearTimeout(timeoutId);

          const statusCodeHeader = headers[':status'];
          const statusCode = typeof statusCodeHeader === 'string' ? parseInt(statusCodeHeader, 10) : undefined;

          if (verbose) {
            console.debug(`HTTP/2 ${method.toUpperCase()} request to ${url} returned status ${statusCode}`);
          }

          // Validate the status code
          const validStatus = validateStatus ? validateStatus(statusCode ?? 0) : (statusCode !== undefined && statusCode >= 200 && statusCode < 300);

          req.on('end', () => {
            client.close();
            resolve(validStatus);
          });

          // Consume the response data
          req.on('data', () => { });
          req.end();
        });

        req.end();
      });
    } catch (error) {
      if (verbose) {
        console.debug(`Error setting up HTTP/2 request for ${url}:`, error);
      }
      resolve(false);
    }
  });
}