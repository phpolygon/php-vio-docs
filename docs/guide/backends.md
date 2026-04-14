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

On macOS, Vulkan (via MoltenVK) is supported but opt-in — you must request it explicitly.

## OpenGL 4.1 Core

The most stable and widely supported backend.

| Property | Value |
|---|---|
| API | OpenGL 4.1 Core Profile |
| Loader | GLAD (vendored) |
| Platforms | macOS, Linux, Windows |
| Headless | ✅ via hidden GLFW window |

OpenGL is the default fallback when Vulkan and Metal are unavailable. It supports all php-vio features including `vio_read_pixels()` for framebuffer capture.

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

| Feature | OpenGL | Vulkan | Metal | D3D11 | D3D12 | Null |
|---|---|---|---|---|---|---|
| 3D Rendering | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 2D Batch | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Shader Compilation | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `vio_read_pixels()` | ✅ | ⚠️ stub | ✅ | ⚠️ stub | ⚠️ stub | — |
| Instanced Drawing | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Render Targets | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Cubemaps | ✅ | ✅ | ✅ | ✅ | ✅ | — |
