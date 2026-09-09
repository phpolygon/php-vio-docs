# Cubemaps

Functions for creating and binding cubemap textures (skyboxes, reflections, environment probes).

## vio_cubemap

```php
VioCubemap|false vio_cubemap(VioContext $context, array $config)
```

Create a cubemap from 6 face images or raw pixel data.

**Config (file-based):**

| Key | Type | Description |
|---|---|---|
| `faces` | string[6] | Paths to 6 face images (+X, −X, +Y, −Y, +Z, −Z) |

**Config (raw data):**

| Key | Type | Description |
|---|---|---|
| `pixels` | string[6] | Array of 6 RGBA8 data strings |
| `width` | int | Face width in pixels |
| `height` | int | Face height in pixels |

**Optional (both modes):**

| Key | Type | Default | Description |
|---|---|---|---|
| `mipmaps` | bool | `false` | Upload a full mip chain so `textureLod()` / trilinear sampling work |

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
    "mipmaps" => true,
]);
```

Supported on OpenGL, D3D11, D3D12 and Metal (`VIO_FEATURE_CUBEMAP`); Vulkan has no cubemap path.

## vio_bind_cubemap

```php
void vio_bind_cubemap(VioContext $context, VioCubemap $cubemap, int $slot = 0)
```

Bind a cubemap to a texture unit. Use `samplerCube` in GLSL to sample it. A unit holds one
sampler — do not bind a 2D texture and a cubemap to the same slot.

```glsl
layout(binding = 2) uniform samplerCube u_env;
// ...
vec3 color = textureLod(u_env, direction, roughness * maxLod).rgb;
```

## Rendered cubemaps

A cube [render target](/api/render-targets) (`['cube' => true, 'size' => 256, 'mipmaps' => true]`)
can be rendered face by face with `vio_bind_render_target($ctx, $rt, $face)`, mip-mapped with
[`vio_generate_mipmaps()`](/api/render-targets#vio-generate-mipmaps) and bound through
[`vio_render_target_cubemap()`](/api/render-targets#vio-render-target-cubemap). `vio_generate_mipmaps()`
also accepts a `VioCubemap` uploaded without `mipmaps`.

![Cube render target with roughness mip chain](/gallery/cubemap_environment.png)
