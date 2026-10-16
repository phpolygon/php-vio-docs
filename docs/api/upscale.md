# Portable Upscaling

Render at a lower resolution and upscale inside the frame – with portable fragment passes that run
on **every backend with a 3D pipeline** (OpenGL, D3D11, D3D12, Vulkan, Metal). For the vendor
upscalers (AMD FSR 3.1, NVIDIA DLSS) on D3D12 and Vulkan see [Native Upscalers](/api/upscaling).

Two modes:

- **Spatial** (`VIO_UPSCALE_SPATIAL`, default) – edge-adaptive Lanczos-2 plus contrast-adaptive
  sharpening. On Metal, spatial upscaling into a render target uses MetalFX (macOS 13+) unless
  `'native' => false`.
- **Temporal** (`VIO_UPSCALE_TEMPORAL`) – jittered frames accumulated into a history kept per
  context. Its gain is a calm image for static and slow content; under constant sub-pixel motion it
  is roughly on par with spatial.

## vio_upscale

```php
bool vio_upscale(VioContext $context, VioRenderTarget|VioTexture $source, ?VioRenderTarget $target, ?array $options = [])
```

Upscale `$source` (a render target's attachment 0 or a texture) to `$target` (a render target, or
`null` for the swapchain) inside a frame. Returns `false` outside a frame. The target stays bound
afterwards (the swapchain for `null`); the bound pipeline is undefined – bind one before the next
draw.

| Option | Default | Description |
|---|---|---|
| `mode` | `VIO_UPSCALE_SPATIAL` | `VIO_UPSCALE_SPATIAL` or `VIO_UPSCALE_TEMPORAL` |
| `sharpness` | `0.25` | 0–1 contrast-adaptive sharpening, 0 = off |
| `jitter` | – | Temporal: `[x, y]`, the sub-pixel offset this frame's projection was shifted by, in source pixels (NDC directions, y up) – e.g. `vio_upscale_jitter($frame)` |
| `motion` | – | Temporal: `VioRenderTarget` or `VioTexture` at source size; per pixel the UV now minus the UV in the previous frame (y up, = half the NDC delta) in `.rg` |
| `reset` | `false` | Temporal: drop the history (camera cut) |
| `native` | `true` | `false` skips the platform scaler (MetalFX) and runs the portable passes |

The temporal output alpha is 1.

```php
$low = vio_render_target($ctx, ['width' => 1280, 'height' => 720]);

vio_begin($ctx);
vio_bind_render_target($ctx, $low);
drawScene($ctx);
vio_unbind_render_target($ctx);
vio_upscale($ctx, $low, null, ['sharpness' => 0.3]);   // to the 1920 × 1080 swapchain
drawUi($ctx);                                           // UI at full resolution
vio_end($ctx);
```

## vio_upscale_jitter

```php
array vio_upscale_jitter(int $frame, int $phases = 8)
```

Sub-pixel jitter for frame `$frame` of a `$phases`-long cycle: `[x, y]` in source pixels
(−0.5 … 0.5), Halton(2, 3). Offset the projection by it
(`clip.xy += 2 * jitter / sourceSize * clip.w`) and pass it as `'jitter'`. The native upscalers use
the same function with their own cycle length (`vio_upscaler_info()['jitter_phases']`).

```php
$j = vio_upscale_jitter($frame);
vio_set_uniform($ctx, 'u_jitter', [2 * $j[0] / 1280, 2 * $j[1] / 720]);
// ... render the scene and its motion vectors into $low / $motion ...
vio_upscale($ctx, $low, $out, ['mode' => VIO_UPSCALE_TEMPORAL, 'jitter' => $j,
                               'motion' => $motion, 'reset' => $cameraCut]);
```

## vio_upscale_info

```php
array vio_upscale_info(VioContext $context)
```

Which implementation each mode uses on this context:
`['spatial' => 'portable' | 'metalfx', 'temporal' => 'portable' | 'metalfx']`.
