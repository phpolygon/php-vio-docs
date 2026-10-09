# Native Upscalers

Temporal upscaling through a vendor SDK that runs inside php-vio: **AMD FidelityFX FSR 3.1**
and **NVIDIA DLSS Super Resolution** (including DLAA) on D3D12 and Vulkan. A game renders at a lower resolution with a sub-pixel jitter, hands the
colour, depth and motion vectors to the upscaler and gets a display-resolution image back.

::: tip Availability
`VIO_UPSCALER_FSR3` needs the FidelityFX runtime library (`amd_fidelityfx_dx12.dll` /
`amd_fidelityfx_vk.dll`, from `PrebuiltSignedDLL/` of the FidelityFX SDK v1.1.4) – php-vio
does not ship it, the game does. Without it, on OpenGL / D3D11 / Metal, and on WARP,
[`vio_upscaler_supported()`](#vio-upscaler-supported) returns `false` – never a warning -
and [`vio_upscaler_info()`](#vio-upscaler-info) says why. `VIO_FEATURE_UPSCALER_NATIVE` is set
when a provider runs on the device. `VIO_UPSCALER_XESS` is reserved.
:::

::: tip DLSS availability
php-vio contains no DLSS code: `VIO_UPSCALER_DLSS` is served by a **plugin** – `vio_dlss.dll`
(Windows) / `libvio_dlss.so` (Linux) – that php-vio loads at run time through its
[upscaler plugin ABI](#upscaler-plugins). Without the plugin, DLSS reports
*vio_dlss.dll not found (…)*. With it, DLSS needs an NVIDIA RTX GPU, a current driver and the DLSS
runtime `nvngx_dlss.dll` / `libnvidia-ngx-dlss.so.<version>` from the DLSS SDK (`lib/…/rel/`).
Without one of them `vio_upscaler_supported($ctx, VIO_UPSCALER_DLSS)` is `false` and `reason`
says which (missing plugin or a plugin of another ABI, missing runtime, not an RTX GPU, driver too
old – with the version it needs).
:::

::: warning DLSS licence and branding
DLSS is licensed by NVIDIA under the NVIDIA RTX SDK licence, which allows its parts to be passed on
only as object code inside an application – never under an open-source licence. That is why the
DLSS adapter is a separate, privately distributed plugin and not part of php-vio. A game that ships
DLSS:

- ships the plugin and `nvngx_dlss.dll` **with the game only** (next to its executable or
  `php_vio`), never as part of php-vio;
- shows the DLSS / NVIDIA RTX attribution (splash screen or credits, per the licence and the
  *RTX UI Developer Guidelines*);
- notifies NVIDIA before its release;
- uses its own NGX project id (`vio.dlss_project_id`, a random GUID – see below).
:::

## Finding the runtime

The runtime matching the context's API is looked for on first use, never linked:

1. `vio.ffx_path` / `VIO_FFX_PATH` (FSR), `vio.dlss_plugin_path` / `VIO_DLSS_PLUGIN` (the DLSS
   plugin), `vio.dlss_path` / `VIO_DLSS_PATH` (the DLSS runtime) – a directory or the file itself.
   When set, this is the **only** place searched.
2. Otherwise: the directory of the PHP executable (or the game's executable), the directory
   of `php_vio` (DLSS runtime: also the plugin's directory), then `PATH` (Linux: `LD_LIBRARY_PATH`
   for DLSS).

FSR's library and the DLSS plugin are loaded by php-vio; the DLSS runtime is loaded by NGX inside
the plugin, which only checks it is there and hands its directory to NGX. A loaded plugin stays for
the process; a missing or refused one is looked for again on the next call.

```ini
; php.ini
vio.ffx_path = "C:\Games\MyGame\redist"
vio.dlss_plugin_path = "C:\Games\MyGame\redist\vio_dlss.dll"
vio.dlss_path = "C:\Games\MyGame\redist"
; DLSS: how NGX identifies the application (NVSDK_NGX_*_Init_with_ProjectID, engine type CUSTOM).
; Must look like a random GUID - the driver rejects others with "invalid parameter".
vio.dlss_project_id = "0f8c2d6e-…"        ; default (empty): the plugin's own id
vio.dlss_engine_version = "1.4.0"         ; default: the php-vio version
```

## Conventions

The same for every provider:

| Input | Convention |
|---|---|
| `jitter` | The sub-pixel offset applied to the projection this frame, in **render pixels**, x right / y down (row 0 = top). Geometry moves by +jitter, so a pixel samples the scene at its centre − jitter. Projection offset: `clip.x += 2 * jx / renderWidth * clip.w`, `clip.y -= 2 * jy / renderHeight * clip.w` on a y-up NDC. |
| `motion` | Per render pixel: previous position − current position, in render pixels (x right, y down), multiplied by `mv_scale` (default `[1, 1]`). Store it in an `RG16F` attachment. |
| `depth` | The device depth of the colour target (`VIO_RT_DEPTH`); `depth_inverted` / `depth_infinite` at creation. |

`vio_upscale_jitter($frame, $info['jitter_phases'])` produces a Halton(2, 3) sequence
(-0.5..0.5 render pixels) of `8 × (display / render)²` phases – what FSR and DLSS ask for.
DLSS uses the same jitter sign and motion direction as FSR, so a game switches providers without
touching its renderer.

## vio_upscaler_supported

```php
bool vio_upscaler_supported(VioContext $context, int $provider = VIO_UPSCALER_FSR3)
```

Whether the provider runs on this context's device. Never warns.

## vio_upscaler_render_size

```php
array|false vio_upscaler_render_size(VioContext $context, int $provider, int $quality,
                                     int $display_width, int $display_height)
```

The render size the provider wants for a quality mode at a display size on this device, before
an upscaler exists – to size the G-buffer or to show the modes in a menu: `['width' => , 'height' => ]`.
DLSS asks NGX for its *optimal settings*; FSR uses its fixed ratios. `false` when the provider is
not usable here or does not offer the mode at that size – never a warning.

| Mode | FSR 3.1 (1920×1080) | DLSS (1920×1080, RTX 2080, DLSS 310.9.1) |
|---|---|---|
| `VIO_UPSCALE_NATIVE_AA` | 1920×1080 | 1920×1080 (DLAA) |
| `VIO_UPSCALE_QUALITY` | 1280×720 | 1280×720 |
| `VIO_UPSCALE_BALANCED` | 1129×635 | 1114×626 |
| `VIO_UPSCALE_PERFORMANCE` | 960×540 | 960×540 |
| `VIO_UPSCALE_ULTRA_PERFORMANCE` | 640×360 | 640×360 |

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
| `version` | The provider version, e.g. `3.1.4` (FSR), `310.9.1` (DLSS) |
| `driver` | The graphics driver version the provider checked, e.g. `617.42` (DLSS; also when unsupported) |
| `library` | Path of the loaded runtime |
| `plugin` | The plugin library the provider came from (`vio_dlss.dll`), empty when built in or not loaded |
| `device` | Vulkan: device features / extensions enabled for native upscalers at context creation |
| `live` | Upscalers alive on the backend |
| `host_bytes` | CPU memory the providers hold |

With a `VioUpscaler` additionally `valid`, `quality`, `render_width`, `render_height` (the size
the provider chose), `display_width`, `display_height`, `jitter_phases` and `gpu_memory` (bytes; DLSS:
all of its VRAM on the device).

## vio_upscaler_create

```php
VioUpscaler|false vio_upscaler_create(VioContext $context, array $options)
```

| Option | Default | Description |
|---|---|---|
| `display_width`, `display_height` | required | Output size |
| `provider` | `VIO_UPSCALER_FSR3` | `VIO_UPSCALER_FSR3`, `VIO_UPSCALER_DLSS` |
| `quality` | `VIO_UPSCALE_QUALITY` | `NATIVE_AA` (1.0; DLSS: DLAA), `QUALITY` (1.5), `BALANCED` (1.7), `PERFORMANCE` (2.0), `ULTRA_PERFORMANCE` (3.0) – display ÷ render per axis for FSR; DLSS takes NGX's optimal size |
| `render_width`, `render_height` | [`vio_upscaler_render_size()`](#vio-upscaler-render-size) | Largest render size dispatched |
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
| `reactive`, `transparency` | Optional R8 masks (DLSS: `reactive` is its *bias current colour* mask, `transparency` is unused) |
| `exposure` | Optional 1×1 R32F |
| `jitter` | `[x, y]` render pixels |
| `mv_scale` | `[x, y]`, default `[1, 1]` |
| `reset` | `true` on a camera cut |
| `sharpness` | 0..1, 0 = no sharpening pass (FSR; DLSS has none) |
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
  state is restored. Whether a software adapter is enough is the provider's call: WARP accepts
  FSR's context but faults in its passes, so FSR and DLSS report *needs a hardware GPU*; headless
  contexts use the GPU with `'headless_hardware' => true`.
- **Vulkan** – the open pass is closed and resumed; before the device is created php-vio enables
  what the FidelityFX runtime picks from the device's offer (subgroup size control, int16, 16-bit
  storage, separate depth/stencil layouts, `VK_KHR_get_memory_requirements2`), listed in
  `vio_upscaler_info()['device']`.
- **Build** – `--with-ffx` (Windows: on by default, no link dependency; Linux/macOS: opt-in, the
  FidelityFX runtime ships for Windows only). DLSS needs no build option: it is the plugin.
- **DLSS** – the plugin talks to NGX directly (no Streamline). NGX is initialised once per device on first use and shut
  down before the device goes; creating an upscaler records NGX's setup on its own command list,
  also inside a frame. D3D12: inputs go to `NON_PIXEL_SHADER_RESOURCE`, the output to
  `UNORDERED_ACCESS` and back. Vulkan: php-vio enables NGX's instance and device extensions
  (`VK_NVX_binary_import`, `VK_NVX_image_view_handle`, `VK_KHR_push_descriptor`, buffer device
  addresses) when the runtime is present. Clean under the D3D12 debug layer and Vulkan validation;
  Vulkan *synchronisation* validation reports hazards inside NGX's own evaluation on reset frames.

## Upscaler plugins

A provider can live outside php-vio. `include/vio_upscale_plugin.h` (installed with the
extension's headers) is the whole contract – plain C, versioned with `VIO_UPSCALE_PLUGIN_ABI`
(currently `1`), no php-vio internals; graphics objects are native handles behind `void *`.

```c
#include "vio_upscale_plugin.h"

VIO_UPSCALE_PLUGIN_EXPORT const vio_upscale_provider *
vio_upscale_plugin_get(uint32_t abi, const vio_upscale_host_api *host);
```

php-vio calls the export once with its ABI and a **host table** – `log` (errors and warnings
become PHP warnings), counted `alloc` / `free` (`host_bytes`), `ini`, `find_file`,
`load_library`, `symbol`, `host_version`, `plugin_path`. The plugin returns its **provider
table**: `abi`, `size`, `id` (`VIO_UPSCALER_*`), `name`, `version`, `flags`, and `supported`,
`create`, `dispatch`, `query`, `destroy` – optionally `vk_device_needs`, `render_size`,
`device_release`, `vk_extensions`.

| Handed to the provider | D3D12 | Vulkan |
|---|---|---|
| Device | `ID3D12Device *`, `software_adapter` | `VkInstance`, `VkPhysicalDevice`, `VkDevice`, `vkGetInstanceProcAddr`, `vkGetDeviceProcAddr` |
| Creation (`VIO_UPSCALE_PROVIDER_CREATE_COMMANDS`) | an open `ID3D12GraphicsCommandList *`, executed and waited for after `create()` – also inside a frame | an open `VkCommandBuffer`, likewise |
| Dispatch | the frame's command list | the frame's command buffer, outside any render pass |
| Images | `ID3D12Resource *`, `DXGI_FORMAT`, size, resting in `PIXEL_SHADER_RESOURCE` (`STATE_SHADER_READ`) or `UNORDERED_ACCESS` (`STATE_GENERAL`) | `VkImage` + `VkImageView`, `VkFormat`, size, resting in `SHADER_READ_ONLY_OPTIMAL` or `GENERAL` |
| Before device creation | – | instance / device extensions (`vk_extensions`) and features (`vk_device_needs`) the provider wants |

The provider may change pipeline, descriptor-heap and root-signature state – php-vio restores its
own and handles render-pass boundaries and the memory barriers around a dispatch – but it must leave
every image in the state / layout it was handed over in. php-vio refuses a library without the
export, a `NULL` provider (ABI not offered), another `abi`, a smaller `size`, another `id` or
missing required slots: `supported` is `false`, `reason` says why, no warning.
