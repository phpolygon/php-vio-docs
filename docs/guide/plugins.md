# Plugins

php-vio has an extensible plugin system for custom output, input, and filter modules.

## Plugin Types

| Constant | Type | Description |
|---|---|---|
| `VIO_PLUGIN_TYPE_GENERIC` | 0 | Generic plugin |
| `VIO_PLUGIN_TYPE_OUTPUT` | 1 | Output plugin (e.g., custom display) |
| `VIO_PLUGIN_TYPE_INPUT` | 2 | Input plugin (e.g., custom controller) |
| `VIO_PLUGIN_TYPE_FILTER` | 4 | Filter plugin (e.g., post-processing) |

Types can be combined as a bitmask.

## Querying Plugins

```php
// List all registered plugin names
$names = vio_plugins();  // e.g. ["my_output", "custom_filter"]

// Get plugin details
$info = vio_plugin_info("my_output");
// [
//     "name"        => "my_output",
//     "description" => "Custom output handler",
//     "version"     => "1.0.0",
//     "api_version" => 1,
//     "type"        => 1,
//     "types"       => ["output"],
// ]
```

## Plugin API Version

The current plugin API version is `VIO_PLUGIN_API_VERSION = 1`. Plugins must match this version to be loaded.

## Internal Architecture

Plugins are registered through the C plugin registry (`vio_plugin_registry.c`). The plugin interface is defined in `include/vio_plugin.h`. Third-party plugins can be built as separate shared objects and registered at extension load time.
