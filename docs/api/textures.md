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
| `mipmaps` | bool | `false` | Generate mipmaps |

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

## vio_bind_texture

```php
void vio_bind_texture(VioContext $context, VioTexture $texture, int $slot = 0)
```

Bind a texture to a texture unit. Slot corresponds to the `binding` qualifier in GLSL.

## vio_texture_size

```php
array{0: int, 1: int} vio_texture_size(VioTexture $texture)
```

Returns `[width, height]` in pixels.

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
