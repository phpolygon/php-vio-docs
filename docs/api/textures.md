# Textures

Functions for loading, creating, and binding GPU textures.

## vio_texture

```php
VioTexture|false vio_texture(VioContext $context, array $config)
```

Create a texture from a file or raw pixel data.

**Config (file-based):**

| Key | Type | Description |
|---|---|---|
| `file` | string | Path to image file (PNG, JPG, BMP, TGA) |

**Config (raw data):**

| Key | Type | Description |
|---|---|---|
| `data` | string | Raw RGBA pixel data |
| `width` | int | Texture width in pixels |
| `height` | int | Texture height in pixels |

**Optional keys (both modes):**

| Key | Type | Default | Description |
|---|---|---|---|
| `filter` | int | `VIO_FILTER_LINEAR` | Texture filtering |
| `wrap` | int | `VIO_WRAP_REPEAT` | Texture wrapping |
| `mipmaps` | bool | `false` | Upload a full mip chain (trilinear sampling) |
| `anisotropy` | int | `1` | Anisotropic filtering level 1–16 (v2.10; OpenGL, D3D11, D3D12, Vulkan — Metal ignores it) |
| `storage` | bool | `false` | Storage image for compute (`image2D`, see [Compute](/api/compute)); `data` is optional (zero-initialised) |

### Filter Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_FILTER_NEAREST` | 0 | Nearest-neighbor (pixelated) |
| `VIO_FILTER_LINEAR` | 1 | Bilinear filtering (smooth) |

### Wrap Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_WRAP_REPEAT` | 0 | Tile the texture |
| `VIO_WRAP_CLAMP` | 1 | Clamp to edge pixels |
| `VIO_WRAP_MIRROR` | 2 | Mirror at edges |

## vio_texture_3d

```php
VioTexture|false vio_texture_3d(VioContext $context, array $config)
```

Create a 3D / volume texture from raw RGBA8 voxel data. Bind it with `vio_bind_texture()` and sample it in GLSL with a `sampler3D`.

Volume textures back features like Fieldtracing's baked Signed Distance Field and SH-L1 irradiance fields, where each voxel stores per-point data the shader trilinearly interpolates.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `data` | string | — | Raw RGBA8 voxels, `width*height*depth*4` bytes, Z-slices in ascending order |
| `width` | int | — | Volume width in voxels |
| `height` | int | — | Volume height in voxels |
| `depth` | int | — | Volume depth in voxels (number of Z-slices) |
| `filter` | int | `VIO_FILTER_LINEAR` | Texture filtering |
| `wrap` | int | `VIO_WRAP_CLAMP` | Texture wrapping (clamp is the usual choice for volumes) |
| `anisotropy` | int | `1` | Anisotropic filtering level 1–16 |
| `storage` | bool | `false` | Storage image for compute (`image3D`) |

Returns `false` on a backend that has no 3D-texture path, on a size/data mismatch, or on upload failure. Probe support with `vio_supports_feature($ctx, VIO_FEATURE_TEXTURE_3D)` before relying on it — OpenGL, D3D11, D3D12, Metal and Vulkan all report it.

```php
// width*height*depth voxels, 4 bytes each (RGBA8)
$volume = vio_texture_3d($ctx, [
    "data"   => $voxels,            // string of w*h*d*4 bytes
    "width"  => 64,
    "height" => 64,
    "depth"  => 64,
    "filter" => VIO_FILTER_LINEAR,  // trilinear interpolation
    "wrap"   => VIO_WRAP_CLAMP,
]);

vio_bind_texture($ctx, $volume, 3);  // sample with a sampler3D bound to slot 3
```

::: tip Sampler budget
A backend now supports up to **8** regular texture samplers per shader alongside the dedicated shadow/depth samplers (php-vio ≥ v1.21.1). 3D textures, cubemaps and 2D textures all draw from this pool.
:::

## vio_bind_texture

```php
void vio_bind_texture(VioContext $context, VioTexture $texture, int $slot = 0)
```

Bind a texture to a texture unit. Slot corresponds to the `binding` qualifier in GLSL. Works for 2D textures, 3D / volume textures (`vio_texture_3d`) and cubemaps alike.

## vio_texture_size

```php
array{0: int, 1: int} vio_texture_size(VioTexture $texture)
```

Returns `[width, height]` in pixels.

## vio_texture_update

```php
bool vio_texture_update(VioContext $context, VioTexture $texture, string $data, int $x = 0, int $y = 0, int $width = 0, int $height = 0)
```

Upload RGBA8 pixels into an existing texture — a sub-region (`$x`, `$y`, `$width`, `$height`) or, with the size arguments omitted, the whole texture. Meant for streaming content (video frames, dynamic atlases) without recreating the texture. Available on every backend (D3D12 since v2.10).

```php
vio_texture_update($ctx, $tex, $frameRgba);                  // whole texture
vio_texture_update($ctx, $atlas, $glyphRgba, 128, 64, 32, 32); // 32x32 region at (128,64)
```

Mip chains of textures and cubemaps can be (re)built with [`vio_generate_mipmaps()`](/api/render-targets#vio-generate-mipmaps).

## vio_texture_load_async

```php
mixed vio_texture_load_async(string $path)
```

Start loading a texture file asynchronously in a background thread. Returns an opaque handle.

## vio_texture_load_poll

```php
array|null|false vio_texture_load_poll(mixed $handle)
```

Poll the status of an async texture load.

**Returns:**
- `null` — Still loading
- `false` — Load failed
- `array` — Load complete: `["width" => int, "height" => int, "data" => string]`

```php
$handle = vio_texture_load_async("large_texture.png");

// Check later
while (true) {
    $result = vio_texture_load_poll($handle);
    if ($result === null) {
        // Still loading, do other work
        continue;
    }
    if ($result === false) {
        echo "Failed to load texture\n";
        break;
    }
    // Create GPU texture from loaded data
    $tex = vio_texture($ctx, [
        "data"   => $result["data"],
        "width"  => $result["width"],
        "height" => $result["height"],
    ]);
    break;
}
```
