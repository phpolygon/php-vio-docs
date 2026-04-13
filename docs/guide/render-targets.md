# Render Targets

Render targets (framebuffer objects / FBOs) let you render to an offscreen texture instead of the screen. This is essential for post-processing, shadow maps, reflections, and minimap rendering.

## Creating a Render Target

```php
$rt = vio_render_target($ctx, [
    "width"  => 512,
    "height" => 512,
]);
```

For depth-only render targets (shadow maps):

```php
$shadowMap = vio_render_target($ctx, [
    "width"      => 1024,
    "height"     => 1024,
    "depth_only" => true,
]);
```

## Rendering to a Target

```php
// Redirect rendering to the FBO
vio_bind_render_target($ctx, $rt);

vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
vio_bind_pipeline($ctx, $pipeline);
vio_draw($ctx, $mesh);

// Restore default framebuffer (screen)
vio_unbind_render_target($ctx);
```

## Using the Result as a Texture

```php
$tex = vio_render_target_texture($rt);

// Use as a regular texture in another pass
vio_bind_texture($ctx, $tex, 0);
```

## Example: Post-Processing

```php
// 1. Render scene to offscreen target
$rt = vio_render_target($ctx, ["width" => 800, "height" => 600]);

while (!vio_should_close($ctx)) {
    // Pass 1: Render to FBO
    vio_bind_render_target($ctx, $rt);
    vio_begin($ctx);
    vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
    vio_bind_pipeline($ctx, $scenePipeline);
    vio_draw($ctx, $sceneMesh);
    vio_end($ctx);
    vio_unbind_render_target($ctx);

    // Pass 2: Draw FBO texture to screen with post-process shader
    $fboTex = vio_render_target_texture($rt);
    vio_begin($ctx);
    vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
    vio_bind_pipeline($ctx, $postProcessPipeline);
    vio_bind_texture($ctx, $fboTex, 0);
    vio_draw($ctx, $fullscreenQuad);
    vio_end($ctx);

    vio_poll_events($ctx);
}
```
