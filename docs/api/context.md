# Context & Frame

The `VioContext` is the central object in php-vio. It represents a GPU context, window, and all associated state.

## vio_create

Create a new rendering context.

```php
VioContext|false vio_create(string $backend = "auto", array $options = [])
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `$backend` | string | `"auto"` | Backend name: `"auto"`, `"opengl"`, `"vulkan"`, `"metal"`, `"d3d11"`, `"d3d12"`, `"null"` |
| `$options` | array | `[]` | Context options (see below) |

**Options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `width` | int | `800` | Window width in screen coordinates |
| `height` | int | `600` | Window height in screen coordinates |
| `title` | string | `"php-vio"` | Window title |
| `vsync` | bool | INI `vio.vsync` (`true`) | Vertical sync. `false` removes any frame cap (D3D FLIP_DISCARD + tearing flag, Vulkan IMMEDIATE/MAILBOX) |
| `samples` | int | `0` | Swapchain MSAA sample count (OpenGL via GLFW hint, Metal via resolve; D3D/Vulkan ignore it – use render targets) |
| `debug` | bool | INI `vio.debug` (`false`) | Validation / debug layers (D3D debug layer, Vulkan validation, Metal API validation, GL debug output) |
| `headless` | bool | `false` | Offscreen context without a visible window; the framebuffer is exactly `width × height` on every backend |
| `hdr_composite` | bool | `false` | **D3D12 only**, with an active HDR10 swapchain: draws to the screen blend in an SDR layer and `vio_end()` PQ-encodes it once, so alpha blends in display light instead of on PQ values. `vio_swapchain_info()['hdr_composite']` reports it |
| `frame_count` | int | `2` | **D3D12 only:** frames in flight (2–3). 3 raises throughput but shrinks the per-frame descriptor/constant heaps – opt in only with headroom |
| `headless_hardware` | bool | `false` | **D3D11 / D3D12:** keep a headless context on the GPU instead of the WARP software adapter |
| `adapter` | int\|string | – | The adapter to open: its position in [`vio_adapters()`](/api/backend#vio-adapters)`[backend]` or part of its name, case-insensitive (`'Intel'`). D3D11, D3D12, Vulkan; Metal takes part of the device name (Macs with two GPUs). No match: `false` with a warning. OpenGL uses the system's device |
| `prefer`, `require`, `benchmark` | – | – | **`"auto"` only:** rank the backends instead of the fixed priority list, see [`vio_rank_backends()`](/api/backend#vio-rank-backends) and [`vio_benchmark_backends()`](/api/backend#vio-benchmark-backends) |
| `shader_cache` | string | – | Directory for the on-disk shader / pipeline cache; a warm start skips the compiles. [`vio_shader_cache_stats()`](/api/backend#vio-shader-cache-stats) reports hits |
| `frame_latency` | int | `0` | Waitable swapchain capping how far the CPU runs ahead; `1` = lowest input latency. D3D11, D3D12, Metal (`VIO_FEATURE_FRAME_LATENCY`); `0` = driver default |
| `hdr_output` | bool\|int | `0` | HDR10 back buffer (RGB10A2, ST 2084) when the display is in HDR mode; `2` forces it. `VIO_FEATURE_HDR_OUTPUT`; [`vio_swapchain_info()`](/api/backend#vio-swapchain-info) reports the result |
| `hdr_paper_white` | float | `200` | Nits that display white maps to with HDR10 output |
| `shader_model` | int | – | **D3D12:** `6` compiles shaders with DXC to DXIL at the highest 6.x the device and DXC accept, `60`–`69` pins the profile. Needs `dxcompiler.dll` + `dxil.dll`; falls back to FXC 5.1 |
| `dxc_dir` | string | – | **D3D12:** directory holding `dxcompiler.dll` / `dxil.dll` |
| `agility_sdk`, `agility_sdk_version` | string, int | – | **D3D12:** directory holding the Agility SDK's `D3D12Core.dll` (absolute, or relative to the directory of `php.exe`) and the SDK version it exports (default: read from the DLL). Falls back to the OS runtime with a warning |
| `msl_version` | int | `0` | **Metal:** pin the Metal Shading Language version, `major * 10 + minor` (`21` = 2.1); `0` = the OS maximum |

When `$backend` is `"auto"`, the best available backend is selected for the platform – Metal > OpenGL on macOS, D3D12 > D3D11 > Vulkan > OpenGL on Windows, Vulkan > OpenGL on Linux – **skipping backends that report no 3D pipeline** when a later candidate has one. On Linux that is Vulkan when the driver offers Vulkan 1.3 (or 1.2 with dynamic rendering and synchronization2), otherwise OpenGL. When the chosen backend cannot open a device, the next candidate is tried. `"null"` is never chosen automatically. See the [Backends guide](/guide/backends) for details.

**Returns:** `VioContext` on success, `false` on failure.

```php
$ctx = vio_create("opengl", [
    "width"  => 1280,
    "height" => 720,
    "title"  => "My App",
    "vsync"  => true,
]);
```

## vio_destroy

Destroy a context and free all associated GPU resources.

```php
void vio_destroy(VioContext $context)
```

All meshes, shaders, textures, and other resources created with this context are also freed.

## vio_begin

Start a new frame. Must be paired with `vio_end()`.

```php
void vio_begin(VioContext $context, array $options = [])
```

| Option | Type | Description |
|---|---|---|
| `present` | bool | `true`: `vio_end()` puts the frame on the screen, also when a render target was bound before `vio_begin()` or is still bound at the end. `false`: no swapchain image is acquired, nothing is presented and [`vio_read_pixels()`](/api/headless#vio-read-pixels) keeps returning the last presented frame – for frames that only render into targets (warm-up, probes). Every backend (`VIO_FEATURE_EXPLICIT_PRESENT`, since v2.40.0) |
| `window` | VioWindow | Render this frame into a further window of the context ([`vio_window()`](/api/window#vio-window)); `vio_end()` presents it, the main window is untouched |

Without `present` each backend keeps its older rule: a target still bound at `vio_end()` skips the
present, and on Vulkan a target bound before `vio_begin()` does too (deprecated, raises
`E_DEPRECATED` once).

```php
vio_begin($ctx, ['present' => false]);      // render into targets only
vio_bind_render_target($ctx, $shadowMap);
// ... draw ...
vio_unbind_render_target($ctx);
vio_end($ctx);
```
## vio_end

End the current frame and present to screen.

```php
void vio_end(VioContext $context)
```

## vio_gpu_flush

Block until the GPU has finished all submitted work.

```php
void vio_gpu_flush(VioContext $context)
```

Meant for benchmarks and tests that time a frame on the CPU side, or that must be sure the GPU is
idle before they read something back or tear resources down. Call it after `vio_end()`; it is not
needed in a normal frame loop and costs the CPU–GPU overlap.

| Backend | What it waits for |
|---|---|
| OpenGL | `glFinish()` |
| D3D11 | an event query after a flush (plain `Flush()` if the query cannot be created) |
| D3D12 | the queue fence (all frames in flight) |
| Metal | the last presented command buffer (`waitUntilCompleted`) |
| Vulkan, `null` | nothing – the call returns at once |

Warns when the context is not initialized. Declared in `vio.stub.php` since v2.35.0 (the function
itself has been registered much longer).

## vio_clear

Clear the framebuffer with a solid color.

```php
void vio_clear(VioContext $context, float $r, float $g, float $b, float $a = 1.0)
```

Color components are in the range `0.0` to `1.0`.

## vio_should_close

Check if the window should close (user clicked close button or `vio_close()` was called).

```php
bool vio_should_close(VioContext|VioWindow $context)
```

## vio_close

Request the window to close. The next call to `vio_should_close()` will return `true`.

```php
void vio_close(VioContext|VioWindow $context)
```

## vio_poll_events

Process pending window and input events. Must be called every frame.

```php
void vio_poll_events(VioContext $context)
```

## vio_wait_events

```php
void vio_wait_events(VioContext $context, float $timeout = -1.0)
```

Like `vio_poll_events()`, but first blocks until an event arrives, `$timeout` seconds pass
(`< 0`: no timeout) or [`vio_wake()`](#vio-wake) is called. An idle desktop application loops on this
instead of `vio_poll_events()` and renders only when something changed, so it uses no CPU while
nothing happens. The wait may end early on OS events php-vio ignores. During an
[input replay](/api/input-recording) it does not block. Since v2.41.0.

```php
$dirty = true;
vio_on_refresh($ctx, function () use (&$dirty) { $dirty = true; });
vio_on_key($ctx, function () use (&$dirty) { $dirty = true; });

while (!vio_should_close($ctx)) {
    vio_wait_events($ctx, 0.5);
    if ($dirty) {
        vio_begin($ctx);
        vio_clear($ctx, 0.1, 0.1, 0.1);
        // ... render ...
        vio_end($ctx);
        $dirty = false;
    }
}
```

## vio_wake

```php
void vio_wake()
```

Wake a `vio_wait_events()`, from any thread. A wake while nobody waits makes the next
`vio_wait_events()` return at once; `vio_poll_events()` leaves it pending.
## Frame Loop Pattern

```php
$ctx = vio_create("opengl", ["width" => 800, "height" => 600]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);

    // ... render ...

    vio_end($ctx);
    vio_poll_events($ctx);
}

vio_destroy($ctx);
```
