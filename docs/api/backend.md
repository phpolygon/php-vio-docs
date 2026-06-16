# Backend

Functions for querying the active rendering backend.

## vio_backend_name

```php
string vio_backend_name(VioContext $context)
```

Returns the name of the active backend (e.g., `"opengl"`, `"vulkan"`, `"metal"`, `"null"`).

## vio_backend_count

```php
int vio_backend_count()
```

Returns the number of registered backends.

## vio_supports_feature

```php
bool vio_supports_feature(VioContext $context, int $feature)
```

Query whether the active backend supports a `VIO_FEATURE_*` capability (see [Constants → Features](/api/constants#features)). Returns `false` for unsupported features and unrecognized constants, so it doubles as a safe capability gate before using an optional code path.

```php
if (vio_supports_feature($ctx, VIO_FEATURE_TEXTURE_3D)) {
    $volume = vio_texture_3d($ctx, $config);
} else {
    // fall back to a 2D approximation
}
```

## vio_backends

```php
string[] vio_backends()
```

Returns an array of all registered backend names.

```php
$backends = vio_backends();
// ["opengl", "vulkan", "metal", "null"]
```
