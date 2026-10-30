# What's New

This documentation describes **php-vio v2.38.1** (2026-10-30). The full commit-level history is in
[`CHANGELOG.md`](https://github.com/phpolygon/php-vio/blob/main/CHANGELOG.md); every release ships
binaries for Linux x86_64/arm64, macOS x86_64/arm64 and Windows x64 (ts + nts) on the
[Releases](https://github.com/phpolygon/php-vio/releases) page.

## 2.38.1

- **Objects released inside a frame** – a render target, texture, cubemap, buffer or compute pipeline that
  loses its last PHP reference while the frame still uses it no longer takes the device down on D3D12. A
  texture or cubemap from [`vio_render_target_texture()`](/api/render-targets#vio-render-target-texture)
  now keeps its target alive, on every backend. Vulkan returns to the swapchain when the bound target
  is destroyed.

## 2.38.0

- **Opacity micromap baker** – [`vio_opacity_micromap_bake()`](/api/ray-tracing#vio-opacity-micromap-bake)
  turns an alpha texture and uvs into a map for `'opacity_micromap'`, without a GPU. At subdivision 6
  rays through 40 stacked leaf cards skip 90 % of the any-hit calls on an RTX 2080.
- **Agility SDK 1.620** – php-vio builds against its headers and uses them only where the runtime has
  them. [`vio_backend_info()`](/api/backend#vio-backend-info) reports the caps `async_commands`,
  `fence_barriers` and `dump_file`; the device-removed report names the driver's error code; feature
  queries go through `CheckFeatureSupport1`. Ray queries below Shader Model 6.9 opt into micromaps.

## 2.37.0

- **HDR composite** – [`vio_create(['hdr_composite' => true])`](/api/context) on D3D12: with an active
  HDR10 swapchain, draws to the screen blend in an SDR layer and `vio_end()` PQ-encodes once, so 50 %
  white over black no longer blends on PQ values.

## 2.36.1

- **Faster `vio_update_buffer()` on D3D12** – buffer updates go through an upload ring and one batch per
  frame instead of a committed buffer and a command list per call: 8 × 4 KiB per frame fell from
  2.9–3.9 ms to 0.02 ms on an RTX 2080.

## 2.36.0

- **Live spatial audio** – pitch and pan while a sound plays, 2D/3D switch, attenuation models, Doppler,
  cones, a listener up vector and an offline render ([Audio](/api/audio)).

## 2.35.0

- **Keypad constants** – `VIO_KEY_KP_0` – `VIO_KEY_KP_9` and `VIO_KEY_KP_DECIMAL` –
  `VIO_KEY_KP_EQUAL` (320–336) are registered as PHP constants ([Numpad Keys](/api/constants#numpad-keys));
  the codes themselves were already reported on every platform.
- **Stub** – `vio.stub.php` now declares [`vio_gpu_flush()`](/api/context#vio-gpu-flush), so IDEs and
  static analysers see it; stub and registered functions match one to one (test 247).
- `VIO_UINT1` – `VIO_UINT4` and `VIO_SHADER_HLSL` stay internal on purpose – the reasons are under
  [Vertex Formats](/api/constants#vertex-formats) and [Shader Formats](/api/constants#shader-formats).

## 2.34.1

- **Audio symbols** – php-vio's bundled miniaudio now uses its own symbol names (`vio_ma_*`). Static
  builds that link another extension's miniaudio into the same binary used to bind php-vio's calls to
  that other (older) implementation; both now stay apart.

## 2.34.0

- **Ogg Opus and Ogg Vorbis** – playback ([`vio_audio_load()`](/api/audio#vio-audio-load),
  [`vio_audio_load_data()`](/api/audio#vio-audio-load-data)), decoding and encoding without an audio
  device ([`vio_audio_info()`](/api/audio#vio-audio-info), [`vio_audio_decode()`](/api/audio#vio-audio-decode),
  [`vio_audio_encode()`](/api/audio#vio-audio-encode)), explicit engine start with a backend list
  ([`vio_audio_init()`](/api/audio#vio-audio-init), `VIO_AUDIO_BACKEND`, the `null` device for
  headless servers and CI) and [`vio_audio_formats()`](/api/audio#vio-audio-formats). See the
  [Audio guide](/guide/audio).

## 2.33.0

- **System clipboard** – [`vio_clipboard_get()` / `vio_clipboard_set()`](/api/platform#vio-clipboard-get)
  on Win32, Cocoa, X11 and GLFW, process-local where the platform has none.
- **Layout key names** – [`vio_key_name()`](/api/keyboard#vio-key-name) maps a physical
  `VIO_KEY_*` position to the character it types in the current keyboard layout.

## 2.32.1 / 2.32.2

- **D3D12** – compute and mip-generation descriptor blocks are no longer reused while the GPU
  still needs them (many dispatches or `vio_generate_mipmaps()` calls per frame).

## API reference catch-up

The API reference now covers every function of the extension. Pages added for functions that
shipped in earlier releases: [Touch](/api/touch), [Input Recording & Replay](/api/input-recording),
[Platform & Clipboard](/api/platform), [GPU Profiling](/api/profiling),
[Batches, Bundles & Indirect Draws](/api/draw-submission), [Portable Upscaling](/api/upscale),
[Ray Tracing](/api/ray-tracing), [Mesh Shaders & Work Graphs](/api/mesh-shaders),
[Variable Rate Shading](/api/shading-rate) and [Bindless & Sampler Feedback](/api/bindless); backend
selection and adapters ([`vio_rank_backends()`](/api/backend#vio-rank-backends),
[`vio_adapters()`](/api/backend#vio-adapters), [`vio_feature_info()`](/api/backend#vio-feature-info)),
monitors and video modes ([`vio_monitors()`](/api/window#vio-monitors)), virtual gamepads, KTX2
textures, font faces and CPU text bitmaps, and the [constants](/api/constants) were completed.
Later corrections: [`vio_gpu_flush()`](/api/context#vio-gpu-flush) (registered by the extension;
in `vio.stub.php` since 2.35.0) is documented, the keypad keys `VIO_KEY_KP_*` (PHP constants since
2.35.0) are listed, and the [start-up warnings without a
display](/api/platform#start-up-without-a-display) are explained.
## 2.32.0

- **8 colour attachments** – `VIO_MAX_COLOR_ATTACHMENTS` = 8 (was 4) on every backend, enough for a
  temporal G-buffer (colour planes, motion vectors, reactive mask).
- **Depth of a colour target** – [`vio_render_target_texture($rt, VIO_RT_DEPTH)`](/api/render-targets#vio-render-target-texture)
  samples the depth of plain and MRT targets (`VIO_FEATURE_RENDER_TARGET_DEPTH_SAMPLE`).
- **Raw readback** – [`vio_read_render_target(…, ['raw' => true])`](/api/render-targets#vio-read-render-target)
  returns float / half / packed texels bit-exact instead of clamped RGBA8.
- **Render targets as storage images** – `'storage' => true` lets a compute kernel read and write
  the attachments ([details](/api/render-targets#render-targets-as-storage-images);
  `VIO_FEATURE_RENDER_TARGET_STORAGE`, D3D12 and Vulkan).
- **FSR 3.1** – [`vio_upscaler_create()` / `vio_upscaler_dispatch()`](/api/upscaling) run AMD FidelityFX FSR 3.1 on
  D3D12 and Vulkan through the FidelityFX runtime, loaded at run time (`vio.ffx_path`, next to the PHP
  executable or php_vio); without it `vio_upscaler_supported()` is `false` with a reason and no warning.
  One provider interface for FSR, DLSS and XeSS: jitter and motion vectors in render pixels.
  `--with-ffx` (on by default on Windows), `VIO_FEATURE_UPSCALER_NATIVE`, `VIO_UPSCALER_*`, `VIO_UPSCALE_*`.
- **DLSS Super Resolution / DLAA** – `VIO_UPSCALER_DLSS` through NVIDIA NGX on D3D12 and Vulkan, served by a
  plugin (`vio_dlss.dll`) behind the new versioned [upscaler plugin ABI](/api/upscaling#upscaler-plugins) –
  php-vio itself contains no NVIDIA code (the SDK is NVIDIA-licensed). Same
  inputs and conventions as FSR; quality modes use NGX's optimal render size, `VIO_UPSCALE_NATIVE_AA` is DLAA.
  Plugin via `vio.dlss_plugin_path`, runtime `nvngx_dlss.dll` via `vio.dlss_path`, NGX project id via
  `vio.dlss_project_id`; `vio_upscaler_info()['plugin']` names the plugin loaded.
- **Provider render sizes** – [`vio_upscaler_render_size()`](/api/upscaling#vio-upscaler-render-size) tells
  the render size of a quality mode before creating an upscaler; `vio_upscaler_info()` gains `driver`.

## 2.10.0

- **Honest capability flags** – `vio_supports_feature()` now reports exactly what a backend can do:
  Vulkan no longer claims a 3D pipeline, instancing, depth bias, tessellation or geometry shaders;
  D3D11/D3D12 drop tessellation/geometry; D3D12 reports no render-target MSAA. `'auto'` skips
  backends without a 3D pipeline when a later candidate has one (Linux: OpenGL before Vulkan).
- **Anisotropic filtering** – `vio_texture()` / `vio_texture_3d()` option `'anisotropy' => 1..16`
  on OpenGL, D3D11, D3D12 and Vulkan.
- **D3D12** – real sampler states (`filter` × `wrap` × `anisotropy`, previously always
  linear/repeat), an asynchronous upload queue, static meshes in GPU-local memory, mip chains for
  `mipmaps => true`, cube render targets + `vio_generate_mipmaps()`, `vio_texture_update()`,
  cube-face readback.
- **D3D11** – cube render targets with per-face mips, `vio_generate_mipmaps()`, cube-face readback,
  **MSAA render targets** (`samples`), mip chains for cubemaps.
- **OpenGL** – MSAA render targets are now implemented (they were advertised but ignored).
- **Vulkan** – `vsync => false` selects IMMEDIATE (fallback MAILBOX → FIFO), `samplerAnisotropy`,
  persistent upload command pool.
- **Headless** – every backend renders exactly `width × height` (a Win32 minimum-width quirk made
  small headless D3D surfaces 348 px wide); headless mouse injection ignores display scaling.
- **Fixes** – the 2D batch keeps its textures/fonts alive until flushed; `mat4` vertex inputs work
  on D3D; `vio_draw_instanced_from_buffer()` binds uniforms like `vio_draw()`; a second OpenGL
  context in one process no longer renders black when objects of the first are freed late.
- **Feature Gallery** – [`examples/gallery.php`](/guide/gallery) renders every feature path headless.

## 2.9.0

- **Metal 3D pipeline** with D3D11/D3D12 parity (meshes, uniforms, textures, instancing,
  render-target sampling, cubemaps, MSAA, depth-only passes).
- **Multiple render targets** (`attachments`, up to 4 colour attachments, 8 pixel formats) and
  **cube render targets** with per-face binds and `vio_generate_mipmaps()`.
- `vio_read_render_target()`, `vio_texture_update()`, eager `vio_clear()` inside a frame, defined
  initial render-target contents, pipeline destructor, 1:1 headless metrics.
- **Compute:** storage images (`image2D`/`image3D`), dispatch geometry from the shader's
  `local_size`, `['async' => true]` dispatch inside the frame + `vio_compute_wait()`.
- **Pipeline state:** `depth_write`, `color_mask`, blend modes premultiplied / multiply / screen /
  min / max.
- D3D: textures resolved at draw time, D3D12 cubemap upload and render-target readback.

## 2.8.0

- **Vertex-stage storage buffers** – `vio_bind_storage_buffer()` +
  `vio_draw_instanced_from_buffer()`: a compute-written buffer feeds the vertex shader directly
  (`gl_InstanceIndex`), no readback. Gate: `VIO_FEATURE_VERTEX_STORAGE`.

## Earlier

2.7.x: headless 1:1 on Metal, fullscreen windows no longer auto-minimise on focus loss,
`vio_get_auto_iconify()`. See the changelog for the complete list.
