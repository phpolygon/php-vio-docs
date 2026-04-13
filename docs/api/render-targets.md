# Render Targets

Functions for offscreen rendering to framebuffer objects (FBOs).

## vio_render_target

```php
VioRenderTarget|false vio_render_target(VioContext $context, array $config)
```

Create an offscreen render target.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `width` | int | required | Target width in pixels |
| `height` | int | required | Target height in pixels |
| `depth_only` | bool | `false` | Depth-only target (for shadow maps) |

## vio_bind_render_target

```php
void vio_bind_render_target(VioContext $context, VioRenderTarget $target)
```

Redirect all rendering to the given render target. All subsequent draw calls render to this FBO instead of the screen.

## vio_unbind_render_target

```php
void vio_unbind_render_target(VioContext $context)
```

Restore rendering to the default framebuffer (screen).

## vio_render_target_texture

```php
VioTexture|false vio_render_target_texture(VioRenderTarget $target)
```

Get the color (or depth) attachment as a `VioTexture`. This texture can be bound and sampled in subsequent render passes.

## Example

```php
$rt = vio_render_target($ctx, ["width" => 512, "height" => 512]);

// Pass 1: Render to FBO
vio_bind_render_target($ctx, $rt);
vio_begin($ctx);
vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
vio_bind_pipeline($ctx, $scenePipeline);
vio_draw($ctx, $sceneMesh);
vio_end($ctx);
vio_unbind_render_target($ctx);

// Pass 2: Use FBO as texture
$fboTex = vio_render_target_texture($rt);
vio_begin($ctx);
vio_bind_texture($ctx, $fboTex, 0);
vio_sprite($ctx, $fboTex, ["x" => 0, "y" => 0]);
vio_draw_2d($ctx);
vio_end($ctx);
```
