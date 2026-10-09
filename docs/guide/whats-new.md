# What's New

This documentation describes **php-vio v2.10.0** (2026-09-09). The full commit-level history is in
[`CHANGELOG.md`](https://github.com/phpolygon/php-vio/blob/main/CHANGELOG.md); every release ships
binaries for Linux x86_64/arm64, macOS x86_64/arm64 and Windows x64 (ts + nts) on the
[Releases](https://github.com/phpolygon/php-vio/releases) page.

## Unreleased (temporal-upscaling groundwork)

- **8 colour attachments** — `VIO_MAX_COLOR_ATTACHMENTS` = 8 (was 4) on every backend, enough for a
  temporal G-buffer (colour planes, motion vectors, reactive mask).
- **Depth of a colour target** — [`vio_render_target_texture($rt, VIO_RT_DEPTH)`](/api/render-targets#vio-render-target-texture)
  samples the depth of plain and MRT targets (`VIO_FEATURE_RENDER_TARGET_DEPTH_SAMPLE`).
- **Raw readback** — [`vio_read_render_target(…, ['raw' => true])`](/api/render-targets#vio-read-render-target)
  returns float / half / packed texels bit-exact instead of clamped RGBA8.
- **Render targets as storage images** — `'storage' => true` lets a compute kernel read and write
  the attachments ([details](/api/render-targets#render-targets-as-storage-images);
  `VIO_FEATURE_RENDER_TARGET_STORAGE`, D3D12 and Vulkan).

## Unreleased (native upscalers)

- **FSR 3.1** – [`vio_upscaler_create()` / `vio_upscaler_dispatch()`](/api/upscaling) run AMD FidelityFX FSR 3.1 on
  D3D12 and Vulkan through the FidelityFX runtime, loaded at run time (`vio.ffx_path`, next to the PHP
  executable or php_vio); without it `vio_upscaler_supported()` is `false` with a reason and no warning.
  One provider interface for FSR, DLSS and XeSS: jitter and motion vectors in render pixels.
  `--with-ffx` (on by default on Windows), `VIO_FEATURE_UPSCALER_NATIVE`, `VIO_UPSCALER_*`, `VIO_UPSCALE_*`.
- **DLSS Super Resolution / DLAA** – `VIO_UPSCALER_DLSS` through NVIDIA NGX on D3D12 and Vulkan, in builds
  configured `--with-dlss=DIR` (off by default; the SDK is NVIDIA-licensed and not part of php-vio). Same
  inputs and conventions as FSR; quality modes use NGX's optimal render size, `VIO_UPSCALE_NATIVE_AA` is DLAA.
  Runtime `nvngx_dlss.dll` via `vio.dlss_path`, NGX project id via `vio.dlss_project_id`.
- **Provider render sizes** – [`vio_upscaler_render_size()`](/api/upscaling#vio-upscaler-render-size) tells
  the render size of a quality mode before creating an upscaler; `vio_upscaler_info()` gains `driver`.

## 2.10.0

- **Honest capability flags** — `vio_supports_feature()` now reports exactly what a backend can do:
  Vulkan no longer claims a 3D pipeline, instancing, depth bias, tessellation or geometry shaders;
  D3D11/D3D12 drop tessellation/geometry; D3D12 reports no render-target MSAA. `'auto'` skips
  backends without a 3D pipeline when a later candidate has one (Linux: OpenGL before Vulkan).
- **Anisotropic filtering** — `vio_texture()` / `vio_texture_3d()` option `'anisotropy' => 1..16`
  on OpenGL, D3D11, D3D12 and Vulkan.
- **D3D12** — real sampler states (`filter` × `wrap` × `anisotropy`, previously always
  linear/repeat), an asynchronous upload queue, static meshes in GPU-local memory, mip chains for
  `mipmaps => true`, cube render targets + `vio_generate_mipmaps()`, `vio_texture_update()`,
  cube-face readback.
- **D3D11** — cube render targets with per-face mips, `vio_generate_mipmaps()`, cube-face readback,
  **MSAA render targets** (`samples`), mip chains for cubemaps.
- **OpenGL** — MSAA render targets are now implemented (they were advertised but ignored).
- **Vulkan** — `vsync => false` selects IMMEDIATE (fallback MAILBOX → FIFO), `samplerAnisotropy`,
  persistent upload command pool.
- **Headless** — every backend renders exactly `width × height` (a Win32 minimum-width quirk made
  small headless D3D surfaces 348 px wide); headless mouse injection ignores display scaling.
- **Fixes** — the 2D batch keeps its textures/fonts alive until flushed; `mat4` vertex inputs work
  on D3D; `vio_draw_instanced_from_buffer()` binds uniforms like `vio_draw()`; a second OpenGL
  context in one process no longer renders black when objects of the first are freed late.
- **Feature Gallery** — [`examples/gallery.php`](/guide/gallery) renders every feature path headless.

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

- **Vertex-stage storage buffers** — `vio_bind_storage_buffer()` +
  `vio_draw_instanced_from_buffer()`: a compute-written buffer feeds the vertex shader directly
  (`gl_InstanceIndex`), no readback. Gate: `VIO_FEATURE_VERTEX_STORAGE`.

## Earlier

2.7.x: headless 1:1 on Metal, fullscreen windows no longer auto-minimise on focus loss,
`vio_get_auto_iconify()`. See the changelog for the complete list.
