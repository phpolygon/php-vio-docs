# Backend

Functions for querying the active rendering backend.

## vio_backend_name

```php
string vio_backend_name(VioContext $context)
```

Returns the name of the active backend: `"opengl"`, `"vulkan"`, `"metal"`, `"d3d11"`, `"d3d12"` or `"null"`. Use it to resolve what `"auto"` picked, e.g. for backend-specific conventions (render-target row order).

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
// macOS: ["metal", "vulkan", "opengl", "null"] — Windows: ["d3d12", "d3d11", "vulkan", "opengl", "null"]
```

## vio_gpu_info

```php
array|false vio_gpu_info()
```

Adapter name, vendor and memory of the GPU the active backend uses (Metal reports `recommendedMaxWorkingSetSize` as `vram_bytes`).

## vio_gl_info

```php
array|false vio_gl_info(VioContext $context)
```

OpenGL only: negotiated core version, GLSL version, renderer/vendor strings and the resolved capability flags of this context (which features the 3.3 → 4.6 ladder actually delivered).
