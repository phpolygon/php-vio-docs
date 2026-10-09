# Native Upscalers

Temporal upscaling through a vendor SDK that runs inside php-vio: **AMD FidelityFX FSR 3.1**
on D3D12 and Vulkan. A game renders at a lower resolution with a sub-pixel jitter, hands the
colour, depth and motion vectors to the upscaler and gets a display-resolution image back.

::: tip Availability
`VIO_UPSCALER_FSR3` needs the FidelityFX runtime library (`amd_fidelityfx_dx12.dll` /
`amd_fidelityfx_vk.dll`, from `PrebuiltSignedDLL/` of the FidelityFX SDK v1.1.4) – php-vio
does not ship it, the game does. Without it, on OpenGL / D3D11 / Metal, and on WARP,
[`vio_upscaler_supported()`](#vio-upscaler-supported) returns `false` – never a warning -
and [`vio_upscaler_info()`](#vio-upscaler-info) says why. `VIO_FEATURE_UPSCALER_NATIVE` is set
when a provider runs on the device. `VIO_UPSCALER_DLSS` and `VIO_UPSCALER_XESS` are reserved
for further providers.
:::

## Finding the runtime

The library matching the context's API is loaded on first use, never linked:

1. `vio.ffx_path` (ini) or `VIO_FFX_PATH` (environment) – a directory or the file itself.
   When set, this is the **only** place searched.
2. Otherwise: the directory of the PHP executable (or the game's executable), the directory
   of `php_vio`, then `PATH`.

```ini
; php.ini
vio.ffx_path = "C:\Games\MyGame\redist"
```

## Conventions

The same for every provider:

| Input | Convention |
|---|---|
| `jitter` | The sub-pixel offset applied to the projection this frame, in **render pixels**, x right / y down (row 0 = top). Geometry moves by +jitter, so a pixel samples the scene at its centre − jitter. Projection offset: `clip.x += 2 * jx / renderWidth * clip.w`, `clip.y -= 2 * jy / renderHeight * clip.w` on a y-up NDC. |
| `motion` | Per render pixel: previous position − current position, in render pixels (x right, y down), multiplied by `mv_scale` (default `[1, 1]`). Store it in an `RG16F` attachment. |
| `depth` | The device depth of the colour target (`VIO_RT_DEPTH`); `depth_inverted` / `depth_infinite` at creation. |

`vio_upscale_jitter($frame, $info['jitter_phases'])` produces FSR's Halton(2, 3) sequence
(-0.5..0.5 render pixels).

## vio_upscaler_supported

```php
bool vio_upscaler_supported(VioContext $context, int $provider = VIO_UPSCALER_FSR3)
```

Whether the provider runs on this context's device. Never warns.

## vio_upscaler_info

```php
array vio_upscaler_info(VioContext $context, VioUpscaler|int $which = VIO_UPSCALER_FSR3)
```

| Key | Description |
|---|---|
| `provider` | `'fsr3'`, `'dlss'`, `'xess'` |
| `backend` | The context's backend |
| `supported` | As `vio_upscaler_supported()` |
| `reason` | Why not (empty when supported), e.g. `amd_fidelityfx_dx12.dll not found (…)` |
| `version` | The provider version, e.g. `3.1.4` |
| `library` | Path of the loaded runtime |
| `device` | Vulkan: device features enabled for the provider at context creation |
| `live` | Upscalers alive on the backend |
| `host_bytes` | CPU memory the providers hold |

With a `VioUpscaler` additionally `valid`, `quality`, `render_width`, `render_height`,
`display_width`, `display_height`, `jitter_phases` and `gpu_memory` (bytes).

## vio_upscaler_create

```php
VioUpscaler|false vio_upscaler_create(VioContext $context, array $options)
```

| Option | Default | Description |
|---|---|---|
| `display_width`, `display_height` | required | Output size |
| `provider` | `VIO_UPSCALER_FSR3` | |
| `quality` | `VIO_UPSCALE_QUALITY` | `NATIVE_AA` (1.0), `QUALITY` (1.5), `BALANCED` (1.7), `PERFORMANCE` (2.0), `ULTRA_PERFORMANCE` (3.0) – display ÷ render per axis |
| `render_width`, `render_height` | from `quality` | Largest render size dispatched |
| `hdr` | `false` | Colour is linear HDR |
| `depth_inverted`, `depth_infinite` | `false` | Depth configuration |
| `auto_exposure` | `false` | The provider computes the exposure |
| `dynamic_resolution` | `false` | The render size changes between dispatches |
| `jittered_motion` | `false` | Motion vectors include the jitter |
| `debug` | `false` | The provider checks the API use and reports to stderr |

Returns `false` with a warning when the provider is not supported. An upscaler is destroyed by
`unset()`, [`vio_upscaler_destroy()`](#vio-upscaler-destroy) or `vio_destroy()` of its context
(which waits for the GPU work that uses it).

## vio_upscaler_dispatch

```php
bool vio_upscaler_dispatch(VioContext $context, VioUpscaler $upscaler, array $inputs)
```

Between `vio_begin()` and `vio_end()`; recorded on the frame. The bound render target and
pipeline stay bound. Images are single-sample 2D render targets: a `VioRenderTarget`
(attachment 0) or `[VioRenderTarget, attachment | VIO_RT_DEPTH]`.

| Input | Description |
|---|---|
| `color` | Render-resolution colour (jittered) |
| `depth` | Render-resolution depth (default: the colour target's depth) |
| `motion` | Motion vectors, see [Conventions](#conventions) |
| `output` | Display-size target created with `'storage' => true` |
| `reactive`, `transparency` | Optional R8 masks |
| `exposure` | Optional 1×1 R32F |
| `jitter` | `[x, y]` render pixels |
| `mv_scale` | `[x, y]`, default `[1, 1]` |
| `reset` | `true` on a camera cut |
| `sharpness` | 0..1, 0 = no sharpening pass |
| `frame_time_ms`, `near`, `far`, `fov_y` (radians), `pre_exposure`, `view_to_meters` | Camera / frame data |
| `render_width`, `render_height` | Rendered part of the inputs (dynamic resolution) |

```php
$up   = vio_upscaler_create($ctx, ['display_width' => 1920, 'display_height' => 1080,
                                   'quality' => VIO_UPSCALE_QUALITY]);
$info = vio_upscaler_info($ctx, $up);
$gbuf = vio_render_target($ctx, ['width' => $info['render_width'], 'height' => $info['render_height'],
                                 'attachments' => [VIO_FORMAT_RGBA16F, VIO_FORMAT_RG16F]]);
$out  = vio_render_target($ctx, ['width' => 1920, 'height' => 1080,
                                 'attachments' => [VIO_FORMAT_RGBA16F], 'storage' => true]);

$j = vio_upscale_jitter($frame, $info['jitter_phases']);
vio_begin($ctx);
vio_bind_render_target($ctx, $gbuf);
// ... draw with the projection offset by $j, motion into attachment 1 ...
vio_upscaler_dispatch($ctx, $up, ['color' => $gbuf, 'motion' => [$gbuf, 1], 'output' => $out,
                                  'jitter' => $j, 'reset' => $cameraCut, 'frame_time_ms' => $dt]);
vio_unbind_render_target($ctx);
// ... present $out ...
vio_end($ctx);
```

## vio_upscaler_destroy

```php
void vio_upscaler_destroy(VioUpscaler $upscaler)
```

Destroys the upscaler now; inside a frame the work recorded so far is finished first.

## Backend notes

- **D3D12** – the resources are handed over in `PIXEL_SHADER_RESOURCE`; afterwards the graphics
  state is restored. WARP accepts the context but faults in FSR's passes, so a software adapter
  reports *needs a hardware GPU*; headless contexts use the GPU with `'headless_hardware' => true`.
- **Vulkan** – the open pass is closed and resumed; before the device is created php-vio enables
  what the FidelityFX runtime picks from the device's offer (subgroup size control, int16, 16-bit
  storage, separate depth/stencil layouts, `VK_KHR_get_memory_requirements2`), listed in
  `vio_upscaler_info()['device']`.
- **Build** – `--with-ffx` (Windows: on by default, no link dependency; Linux/macOS: opt-in, the
  FidelityFX runtime ships for Windows only).
