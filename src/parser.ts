// src/parser.ts
import type { ResourceDescriptor, ResourceType } from './types';

const PREFIX_REGEX = /^((https?-get|https?|tcp|socket|file|ping|dir):)(.+)$/;
const HTTP_UNIX_REGEX = /^http:\/\/unix:([^:]+):(.+)$/;

/**
 * Parse resources into their descriptors
 */
export function parseResources(resources: string[]): ResourceDescriptor[] {
  return resources.map(parseResource);
}

/**
 * Parse a single resource string into a descriptor
 */
export function parseResource(resource: string): ResourceDescriptor {
  // Check for a prefix
  const prefixMatch = PREFIX_REGEX.exec(resource);
  
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const path = prefixMatch[3];
    
    // Extract type from prefix
    let type: ResourceType;
    if (prefix === 'http:' || prefix === 'https:') {
      type = prefix.slice(0, -1) as ResourceType;
    } else if (prefix === 'http-get:' || prefix === 'https-get:') {
      type = prefix.slice(0, -1) as ResourceType;
    } else if (prefix === 'tcp:' || prefix === 'socket:' || prefix === 'file:' || prefix === 'ping:' || prefix === 'dir:') {
      type = prefix.slice(0, -1) as ResourceType;
    } else {
      throw new Error(`Invalid resource prefix: ${prefix}`);
    }
    
    return {
      type,
      uri: path,
      originalUri: resource
    };
  }
  
  // No prefix, assume file
  return {
    type: 'file',
    uri: resource,
    originalUri: resource
  };
}

/**
 * Extracts information from an HTTP Unix socket URL
 */
export function parseHttpUnixUrl(url: string): { socketPath: string, url: string } | null {
  const match = HTTP_UNIX_REGEX.exec(url);
  if (match) {
    return {
      socketPath: match[1],
      url: match[2]
    };
  }
  return null;
}

/**
 * Parse a TCP host:port string
 */
export function parseTcpHostPort(tcpPath: string): { host: string, port: number } {
  const HOST_PORT_REGEX = /^(([^:]*):)?(\d+)$/;
  const match = HOST_PORT_REGEX.exec(tcpPath);
  
  if (!match) {
    throw new Error(`Invalid TCP resource format: ${tcpPath}. Expected format: [host:]port`);
  }
  
  const [, , hostMatched, portStr] = match;
  const host = hostMatched || 'localhost';
  const port = parseInt(portStr, 10);
  
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${portStr}. Port must be between 1 and 65535.`);
  }
  
  return { host, port };
}