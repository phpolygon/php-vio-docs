# Plugins

Functions for querying the plugin system.

## vio_plugins

```php
string[] vio_plugins()
```

Returns an array of all registered plugin names.

## vio_plugin_info

```php
array|false vio_plugin_info(string $name)
```

Get details about a registered plugin. Returns `false` if not found.

**Returns:**

```php
[
    "name"        => "my_plugin",
    "description" => "Example plugin",
    "version"     => "1.0.0",
    "api_version" => 1,
    "type"        => 1,           // Bitmask of VIO_PLUGIN_TYPE_*
    "types"       => ["output"],  // Human-readable type names
]
```

## Plugin Type Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_PLUGIN_TYPE_GENERIC` | 0 | Generic plugin |
| `VIO_PLUGIN_TYPE_OUTPUT` | 1 | Output plugin |
| `VIO_PLUGIN_TYPE_INPUT` | 2 | Input plugin |
| `VIO_PLUGIN_TYPE_FILTER` | 4 | Filter plugin |
| `VIO_PLUGIN_API_VERSION` | 1 | Current plugin API version |

Types can be combined as a bitmask (e.g., `VIO_PLUGIN_TYPE_OUTPUT | VIO_PLUGIN_TYPE_FILTER`).
