# Render Targets

Functions for offscreen rendering: colour / HDR / depth-only / multisampled targets, cube
targets with mip chains, multiple render targets, readback and mipmap generation.

::: tip Which backend can do what?
Gate optional variants with [`vio_supports_feature()`](/api/backend#vio-supports-feature):
`VIO_FEATURE_RENDER_TARGET` (basic), `_HDR`, `_DEPTH`, `_MSAA`, `_CUBE`, `VIO_FEATURE_MRT`,
`VIO_FEATURE_MIPMAP_GEN`. As of v2.10 OpenGL, D3D11, D3D12 and Metal support every variant
except MSAA on D3D12; Vulkan only has basic colour targets. See the
[Feature Gallery](/guide/gallery) for rendered examples.
:::

## vio_render_target

```php
VioRenderTarget|false vio_render_target(VioContext $context, array $config)
```

Create an offscreen render target. New targets start defined: colour cleared to 0, depth to 1.0.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `width` | int | required* | Target width in pixels |
| `height` | int | required* | Target height in pixels |
| `depth_only` | bool | `false` | Depth-only target (shadow maps); sample it with `sampler2DShadow` or as a grey depth texture |
| `hdr` | bool | `false` | RGBA16F colour attachment instead of RGBA8 — values above 1.0 survive |
| `samples` | int | `0` | MSAA sample count (2/4/8). Resolved to a single-sample texture on unbind / readback. Colour targets only |
| `cube` | bool | `false` | Cube render target with six faces; use `size` instead of `width`/`height` |
| `size` | int | — | Face size of a cube target (*required with `cube`) |
| `mipmaps` | bool | `false` | Allocate a full mip chain so [`vio_generate_mipmaps()`](#vio-generate-mipmaps) / `textureLod` work |
| `attachments` | int[] | `[VIO_FORMAT_RGBA8]` | Multiple render targets: one `VIO_FORMAT_*` per colour attachment (up to 4). Overrides `hdr` |

```php
$scene  = vio_render_target($ctx, ["width" => 1280, "height" => 720]);
$hdr    = vio_render_target($ctx, ["width" => 1280, "height" => 720, "hdr" => true]);
$shadow = vio_render_target($ctx, ["width" => 2048, "height" => 2048, "depth_only" => true]);
$aa     = vio_render_target($ctx, ["width" => 512,  "height" => 512, "samples" => 4]);
$env    = vio_render_target($ctx, ["cube" => true, "size" => 256, "mipmaps" => true]);
$gbuf   = vio_render_target($ctx, ["width" => 1280, "height" => 720,
            "attachments" => [VIO_FORMAT_RGBA8, VIO_FORMAT_RGBA16F, VIO_FORMAT_R16F]]);
```

Formats: `VIO_FORMAT_RGBA8`, `RGBA16F`, `RGBA32F`, `R11G11B10F`, `RG16F`, `R16F`, `R32F`, `R8`
(see [Constants → Pixel Formats](/api/constants#pixel-formats)). With MRT the fragment shader
writes `layout(location = i) out vec4` per attachment; on D3D12 pass the same `attachments`
list to [`vio_pipeline()`](/api/shaders#vio-pipeline) so the PSO knows the formats.

## vio_create_render_target

```php
VioRenderTarget|false vio_create_render_target(VioContext $context, int $width, int $height, array $options = [])
```

Positional variant of `vio_render_target()`; `$options` takes the same keys.

## vio_bind_render_target

```php
void vio_bind_render_target(VioContext $context, VioRenderTarget $target, int $face = -1, int $level = 0)
```

Redirect all rendering to the target. For cube targets pass `$face` (0–5 = +X, −X, +Y, −Y, +Z, −Z)
and optionally the mip `$level` to render into. Binding outside a frame is remembered and applied
by the next `vio_begin()`.

```php
for ($face = 0; $face < 6; $face++) {
    vio_bind_render_target($ctx, $env, $face);
    vio_clear($ctx, 0, 0, 0, 1);
    // ... render the environment as seen from this face
}
vio_unbind_render_target($ctx);
```

## vio_unbind_render_target

```php
void vio_unbind_render_target(VioContext $context)
```

Restore rendering to the default framebuffer. Resolves an MSAA target into its sampleable texture.

## vio_push_render_target / vio_pop_render_target

```php
void vio_push_render_target(VioContext $context, VioRenderTarget $target)
void vio_pop_render_target(VioContext $context)
```

Stack variant: push binds the target and remembers the previous one, pop restores it. Use this in
helper code that must not disturb the caller's current target.

## vio_set_render_target

```php
void vio_set_render_target(VioContext $context, ?VioRenderTarget $target)
```

Bind `$target`, or `null` to return to the default framebuffer.

## vio_render_target_texture

```php
VioTexture|false vio_render_target_texture(VioRenderTarget $target, int $attachment = 0)
```

The colour attachment (`$attachment` indexes the MRT list) — or the depth texture of a depth-only
target — as a `VioTexture` for sampling in later passes. The texture is owned by the render
target; keep the target alive while you use it.

## vio_render_target_cubemap

```php
VioCubemap|false vio_render_target_cubemap(VioRenderTarget $target)
```

A cube target as a `VioCubemap` (bind with `vio_bind_cubemap`, sample with `samplerCube` /
`textureLod`). Together with `mipmaps => true` and `vio_generate_mipmaps()` this is the standard
environment-probe path: roughness selects the mip level.

## vio_read_render_target

```php
string|false vio_read_render_target(VioRenderTarget $target, int $face = -1, int $attachment = 0)
```

Read a target back as RGBA8 bytes (`width * height * 4`), also mid-frame. HDR targets are
converted to 8 bit, depth-only targets come back as a grey depth ramp, cube targets need `$face`.

## vio_generate_mipmaps

```php
bool vio_generate_mipmaps(VioContext $context, VioRenderTarget|VioTexture|VioCubemap $object)
```

Build the mip chain of a render target created with `mipmaps => true`, a texture or a cubemap.
Requires `VIO_FEATURE_MIPMAP_GEN` (OpenGL, D3D11, D3D12, Metal).

## vio_destroy_render_target

```php
void vio_destroy_render_target(VioRenderTarget $target)
```

Release the GPU resources early (they are also released when the object is garbage-collected).

## Orientation

Row 0 of a render target is the **bottom** row on OpenGL and the **top** row on D3D11, D3D12 and
Metal. Shaders that sample a target with GL-style UVs must flip V on the D3D/Metal backends
(`$flip = vio_backend_name($ctx) !== 'opengl'`); `vio_read_pixels()` and
`vio_read_render_target()` always return row 0 at the top. `examples/gallery.php` in the
repository shows the pattern (`rt_quad()`).

## Example

```php
$rt = vio_render_target($ctx, ["width" => 512, "height" => 512]);

// Pass 1: render the scene into the target
vio_begin($ctx);
vio_bind_render_target($ctx, $rt);
vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
vio_bind_pipeline($ctx, $scenePipeline);
vio_draw($ctx, $sceneMesh);
vio_unbind_render_target($ctx);

// Pass 2: post-process it onto the screen
vio_bind_pipeline($ctx, $postPipeline);
vio_bind_texture($ctx, vio_render_target_texture($rt), 0);
vio_draw($ctx, $fullscreenQuad);
vio_end($ctx);
```

![Post-processing through a render target](/gallery/render_target_postprocess.png)
