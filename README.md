# AirConsole TypeScript Declarations

TypeScript definitions for the AirConsole JavaScript API, automatically generated from JSDoc comments.

## Installation

### From npm (when published)

```bash
npm install @airconsole/types
```

### From GitHub

```bash
npm install github:dreamora/airconsole-api
```

## Usage

### Global Script Tag Usage

If you're including AirConsole via a script tag from airconsole.com/api:

```html
<script src="https://www.airconsole.com/api/airconsole-1.9.0.js"></script>
```

Create a `types.d.ts` file in your project:

```typescript
/// <reference types="@airconsole/types" />
```

Then use AirConsole in your TypeScript code:

```typescript
const airconsole = new AirConsole({
  orientation: AirConsole.ORIENTATION_LANDSCAPE
});

airconsole.onReady = function(code: string) {
  console.log("AirConsole ready with code:", code);
};

airconsole.onMessage = function(device_id: number, data: any) {
  console.log("Message from device", device_id, ":", data);
};
```

### Module Usage

If you're using a bundler or module system:

```typescript
import * as AirConsole from '@airconsole/types';

// Your code here
```

## API Coverage

This package provides TypeScript definitions for:

- ✅ AirConsole constructor and configuration options
- ✅ All event handlers (onReady, onConnect, onMessage, etc.)
- ✅ Core messaging methods (message, broadcast)
- ✅ Device management methods
- ✅ Player management (active players, device states)
- ✅ Premium features
- ✅ Ads integration
- ✅ Persistent data storage
- ✅ High scores
- ✅ Navigation methods
- ✅ Device motion and vibration
- ✅ All constants and enums

## Version Compatibility

This package is automatically generated from the latest AirConsole API version. The package version matches the AirConsole API version it was generated from.

- `1.9.0` - Generated from `airconsole-1.9.0.js`
- `1.10.0` - Generated from `airconsole-1.10.0.js` (when available)

## Automatic Generation

These TypeScript declarations are automatically generated when new AirConsole API versions are released. The generation process:

1. Detects the latest `airconsole-X.Y.Z.js` file
2. Extracts type information from JSDoc comments
3. Generates comprehensive TypeScript declarations
4. Updates the package version to match the API version
5. Commits the generated files back to the repository

## Contributing

The TypeScript declarations are automatically generated. To improve the generation process or report issues with the generated types, please open an issue or pull request in the [main repository](https://github.com/dreamora/airconsole-api).

## License

Same as the AirConsole API - check the main repository for license information.

## Related Links

- [AirConsole Developer Documentation](https://developers.airconsole.com/)
- [AirConsole API Repository](https://github.com/dreamora/airconsole-api)
- [AirConsole Website](https://www.airconsole.com/)