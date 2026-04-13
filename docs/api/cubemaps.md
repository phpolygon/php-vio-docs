# Cubemaps

Functions for creating and binding cubemap textures (skyboxes, reflections).

## vio_cubemap

```php
VioCubemap|false vio_cubemap(VioContext $context, array $config)
```

Create a cubemap from 6 face images or raw pixel data.

**Config (file-based):**

| Key | Type | Description |
|---|---|---|
| `faces` | string[6] | Paths to 6 face images (+X, -X, +Y, -Y, +Z, -Z) |

**Config (raw data):**

| Key | Type | Description |
|---|---|---|
| `pixels` | array[6] | Array of 6 RGBA data strings |
| `width` | int | Face width in pixels |
| `height` | int | Face height in pixels |

```php
$skybox = vio_cubemap($ctx, [
    "faces" => [
        "right.png",   // +X
        "left.png",    // -X
        "top.png",     // +Y
        "bottom.png",  // -Y
        "front.png",   // +Z
        "back.png",    // -Z
    ],
]);
```

## vio_bind_cubemap

```php
void vio_bind_cubemap(VioContext $context, VioCubemap $cubemap, int $slot = 0)
```

Bind a cubemap to a texture unit. Use `samplerCube` in GLSL to sample it.

```glsl
uniform samplerCube uSkybox;
// ...
vec3 color = texture(uSkybox, direction).rgb;
```
