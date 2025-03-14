# iwait

`iwait` is a lightweight, flexible library for waiting on resources to become available or unavailable. It supports various strategies and configurations to meet the needs of modern asynchronous applications.

## Features

- Wait for resources using customizable strategies: `all`, `any`, `race`, or `threshold`.
- Support for timeouts, delays, and intervals.
- Verbose logging and debugging options.
- Abortable operations with `AbortSignal`.
- Compatible with both ESM and CommonJS environments.

## Installation

Install `iwait` via npm:

```bash
npm install @stormcrow/iwait
```

## Import

```javascript
// Using CommonJS
const iwait = require('@stormcrow/iwait');
```

```typescript
// Using ES modules
import iwait from '@stormcrow/iwait';
```

## Usage

### Basic Usage

```typescript
import { iwait } from '@stormcrow/iwait';

const options = {
  resources: ['http://example.com', 'tcp://127.0.0.1:8080'],
  strategy: 'all',
  timeout: 5000,
};

iwait(options)
  .then((result) => {
    console.log('Resources are ready:', result.ready);
  })
  .catch((error) => {
    console.error('Error waiting for resources:', error);
  });
```

### Configuration Options

The `iwait` function accepts the following configuration options:

| Option          | Type            | Default      | Description                                                                 |
|------------------|-----------------|--------------|-----------------------------------------------------------------------------|
| `resources`      | `string[]`      | `[]`         | List of resources to wait for (e.g., URLs, TCP addresses, file paths).      |
| `delay`          | `number`        | `0`          | Delay before starting the checks (in ms).                                   |
| `interval`       | `number`        | `250`        | Interval between resource checks (in ms).                                   |
| `timeout`        | `number`        | `Infinity`   | Maximum time to wait for resources (in ms).                                 |
| `strategy`       | `'all' | 'any' | 'race' | 'threshold'` | `'all'` | Strategy for determining success.                     |
| `log`            | `boolean`       | `false`      | Enable basic logging to the console.                                        |
| `verbose`        | `boolean`       | `false`      | Enable verbose debugging logs.                                              |
| `reverse`        | `boolean`       | `false`      | Reverse the readiness condition (e.g., wait for resources to become unavailable). |
| `signal`         | `AbortSignal`   | `undefined`  | Abort signal for canceling the wait.                                        |

### Advanced Options

For more advanced configurations like thresholding, authentication, and custom headers, refer to the source code and examples.

## Error Handling

`iwait` can throw the following errors:

- **`TimeoutError`**: Thrown when the operation times out before resources are ready.
- **`AbortError`**: Thrown when the operation is aborted via an `AbortSignal`.

## Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This package is licensed under the [MIT License](./LICENSE).

---

Happy waiting! 🎉