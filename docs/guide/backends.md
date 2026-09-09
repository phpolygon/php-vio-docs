# Backends

php-vio supports multiple GPU backends. Each backend implements the same vtable interface, so your rendering code works unchanged across platforms.

## Selecting a Backend

```php
// Auto-select best available (default)
$ctx = vio_create("auto", ["width" => 800, "height" => 600]);

// Explicit selection
$ctx = vio_create("opengl", [...]);
$ctx = vio_create("vulkan", [...]);
$ctx = vio_create("metal", [...]);
$ctx = vio_create("d3d11", [...]);   // Windows only
$ctx = vio_create("d3d12", [...]);   // Windows only
$ctx = vio_create("null", [...]);    // No-op backend for testing
```

Auto-selection is platform-specific:

| Platform | Priority |
|---|---|
| **macOS** | Metal > OpenGL |
| **Windows** | D3D12 > D3D11 > Vulkan > OpenGL |
| **Linux** | Vulkan > OpenGL |

Since v2.10 `"auto"` skips a backend that reports `VIO_FEATURE_3D_PIPELINE = 0` when a later candidate has one — Vulkan currently has no 3D pipeline, so Linux resolves to **OpenGL** and Windows without D3D falls through to OpenGL as well. `"null"` is never auto-selected. Override globally with the `vio.default_backend` INI setting.

On macOS, Vulkan (via MoltenVK) is supported but opt-in — you must request it explicitly.

## OpenGL (3.3 – 4.6 Core)

The most complete backend: every feature path exists here first.

| Property | Value |
|---|---|
| API | OpenGL Core Profile, negotiated 4.6 → 3.3 (`vio_gl_info()` shows what you got) |
| Loader | GLAD (vendored) |
| Platforms | macOS, Linux, Windows |
| Headless | ✅ via hidden GLFW window |

OpenGL is the fallback on every platform. Compute, storage images and vertex-stage storage need a 4.3+ context (never on macOS, where Apple's GL stops at 4.1); the [feature ladder](https://github.com/phpolygon/php-vio/blob/main/CLAUDE.md#opengl-feature-ladder) lists which flag needs which core version or extension.

::: tip
On macOS, OpenGL is deprecated by Apple but still functional at version 4.1. For production macOS apps, consider Metal.
:::

## Vulkan

Modern, low-overhead GPU API with explicit resource management.

| Property | Value |
|---|---|
| API | Vulkan 1.0+ |
| Memory | Vulkan Memory Allocator (VMA) |
| Platforms | Linux, Windows, macOS (MoltenVK) |
| Headless | ✅ |

::: warning Vulkan is 2D + compute only
The Vulkan backend has the native 2D batch, basic render targets, compute and `vio_read_pixels()`, but **no 3D pipeline** (`vio_mesh`/`vio_shader`/`vio_pipeline`/`vio_draw` return `false`), no cubemaps and no HDR / depth-only / MSAA targets. Since v2.10 its feature flags say so, and `"auto"` prefers OpenGL over it. `vsync => false` selects the IMMEDIATE present mode (MAILBOX → FIFO fallback).
:::

### macOS Setup (MoltenVK)

Vulkan on macOS requires MoltenVK as a translation layer:

```bash
brew install molten-vk

# Set environment variables
export VK_DRIVER_FILES=/usr/local/etc/vulkan/icd.d/MoltenVK_icd.json
export DYLD_LIBRARY_PATH=/usr/local/lib
```

::: warning
macOS System Integrity Protection (SIP) strips `DYLD_LIBRARY_PATH` from child processes. This means Vulkan may not work when PHP is launched from certain contexts (e.g., IDE terminals). Run directly from a terminal session.
:::

## Metal

Apple's native GPU API. Best performance on macOS.

| Property | Value |
|---|---|
| API | Metal |
| Language | Objective-C with ARC |
| Platforms | macOS only |
| Headless | ✅ |

Metal is compiled with Objective-C (`vio_metal.m`) and uses CAMetalLayer for presentation. It is only available when built with `--with-metal`.

### Metal 2D Pipeline

Since v1.4.0, Metal has a complete native 2D rendering pipeline:

- MSL shaders for shapes (color-only) and sprites (textured)
- Font atlas support via R8Unorm textures with swizzle (1,1,1,R)
- Dynamic vertex buffer growth
- Scissor clipping with HiDPI scaling
- Pixel readback via `vio_read_pixels()` and `vio_save_screenshot()`

### Performance: Metal vs OpenGL

Benchmarked on Apple M2 Pro (macOS, 1280x720, VSync off). Measures draw + flush time only (excludes present/VSync wait).

| Scenario | Metal | OpenGL | Delta |
|---|---|---|---|
| 500 rects | 192 us | 179 us | +7% |
| 200 rects + 200 rounded rects + 50 text | 323 us | 313 us | +3% |
| 1000 rects + 100 text | **301 us** | 374 us | **-20%** |

**Tail latency (frame time consistency):**

| Percentile | Metal | OpenGL |
|---|---|---|
| p95 | 306-601 us | 437-754 us |
| p99 | 375-674 us | 907-953 us |

Metal is slightly slower on simple scenes due to command encoding overhead, but **20% faster on heavy scenes** (1000+ draw calls with text). More importantly, Metal delivers **30-40% better tail latency** — fewer frame time spikes and more consistent rendering.

## Direct3D 11

Immediate-mode DirectX backend. Broad hardware compatibility on Windows.

| Property | Value |
|---|---|
| API | Direct3D 11 (Feature Level 11.0 / 11.1) |
| Shader Model | 5.0 |
| Platforms | Windows only |
| Headless | ✅ via WARP software renderer |

D3D11 uses an immediate-mode rendering model — draw commands are executed directly through `ID3D11DeviceContext`. This makes it simpler than D3D12 while still providing good performance. In headless mode, the backend automatically selects the WARP software renderer (Windows Advanced Rasterization Platform).

### Shader Pipeline

GLSL shaders are automatically compiled through a multi-stage pipeline:

```
GLSL → SPIR-V (glslang) → HLSL (SPIRV-Cross) → DXBC (D3DCompile)
```

You write standard GLSL — the backend handles the rest. The transpiled HLSL targets Shader Model 5.0 (`vs_5_0`, `ps_5_0`).

### Build Flags

```cmd
configure --enable-vio --with-glfw=C:\deps\glfw --with-d3d11
```

Required libraries: `d3d11.lib`, `dxgi.lib`, `d3dcompiler.lib`, `dxguid.lib`.

::: tip
D3D11 is a good choice for Windows applications that need to support older hardware or Windows 7/8.
:::

## Direct3D 12

Modern, low-level DirectX backend with explicit resource management.

| Property | Value |
|---|---|
| API | Direct3D 12 |
| Shader Model | 5.1 |
| Platforms | Windows 10+ only |
| Headless | ✅ via WARP software renderer |

D3D12 is the highest-priority backend on Windows. It uses explicit command lists, fence-based GPU synchronization, and a double-buffered swapchain with per-frame command allocators. This gives the driver less overhead and enables better GPU utilization.

### Key Differences from D3D11

| Aspect | D3D11 | D3D12 |
|---|---|---|
| Rendering model | Immediate | Command list recording |
| Synchronization | Implicit | Explicit (fence-based) |
| Buffer alignment | 16-byte (constant buffers) | 256-byte (constant buffers) |
| Pipeline state | Separate state objects | Monolithic PSO |
| Root signature | N/A | Shared across pipelines |
| Min. Windows | 7 | 10 |

### Shader Pipeline

Same multi-stage pipeline as D3D11, but targets Shader Model 5.1:

```
GLSL → SPIR-V (glslang) → HLSL (SPIRV-Cross) → DXBC (D3DCompile)
```

### Build Flags

```cmd
configure --enable-vio --with-glfw=C:\deps\glfw --with-d3d12
```

Required libraries: `d3d12.lib`, `dxgi.lib`, `d3dcompiler.lib`, `dxguid.lib`.

::: tip
D3D12 is auto-selected as the preferred backend on Windows. Use `"d3d11"` explicitly if you need broader hardware support.
:::

## Null Backend

A no-op backend that accepts all calls but produces no output. Useful for:

- Unit testing without GPU access
- CI environments
- Benchmarking PHP-side logic

```php
$ctx = vio_create("null", ["width" => 64, "height" => 64]);
```

## Querying Available Backends

```php
// Number of registered backends
$count = vio_backend_count();

// List all backend names
$names = vio_backends();  // e.g. ["opengl", "vulkan", "metal", "null"]

// Get active backend name
$active = vio_backend_name($ctx);  // e.g. "opengl"
```

## Backend Feature Matrix

Source of truth: each backend's `supports_feature()`; `tests/core/074_backend_capability_matrix.phpt`
pins it. Query at runtime with [`vio_supports_feature()`](/api/backend#vio-supports-feature).

| Feature | OpenGL | D3D11 | D3D12 | Metal | Vulkan | Null |
|---|---|---|---|---|---|---|
| 3D pipeline (`vio_mesh` / `vio_shader` / `vio_pipeline` / `vio_draw`) | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Instanced drawing | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Native 2D batch | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Render targets (basic) | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Render targets HDR / depth-only | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Render targets MSAA (`samples`) | ✅ | ✅ | ❌ | ✅ | ❌ | — |
| Cube render targets + `vio_generate_mipmaps` | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Multiple render targets (`attachments`) | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| `vio_read_render_target` | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Cubemaps | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Compute | ✅ (GL ≥ 4.3) | ✅ | ✅ | ✅ | ✅ | — |
| Storage images | ✅ (GL ≥ 4.3) | ✅ | ✅ | ✅ | ❌ | — |
| Vertex-stage storage buffers | ✅ (GL ≥ 4.3) | ✅ | ✅ | ✅ | ❌ | — |
| Async compute inside the frame | ✅ | ✅ | ✅ | ✅ | sync | — |
| 3D textures | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `vio_texture_update` | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| Anisotropic filtering | ✅ | ✅ | ✅ | ignored | ✅ | — |
| Texture swizzle | ✅ (3.3+) | ❌ (CPU expand) | ✅ | ✅ | ✅ | — |
| Geometry shaders (`vio_shader` `geometry`) | ✅ (GL ≥ 3.2) | ✅ (SPIRV-Cross ≥ 2025-05; varying inputs only) | ✅ (same) | ❌ | ❌ | — |
| Tessellation (`tess_control` + `tess_eval`, `VIO_PATCHES`) | ✅ (GL ≥ 4.0) | ❌ (no HLSL hull/domain in SPIRV-Cross yet; flag stays 0) | ❌ (same) | ❌ | ❌ | — |
| `vio_read_pixels()` / screenshots | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Recording / streaming capture | ✅ | ✅ | ✅ | ✅ | ✅ | — |

Row order of render targets differs (OpenGL row 0 = bottom, D3D/Metal row 0 = top) — see
[Render Targets → Orientation](/api/render-targets#orientation).
