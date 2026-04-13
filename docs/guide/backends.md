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
$ctx = vio_create("null", [...]);    // No-op backend for testing
```

Auto-selection priority: **Vulkan > Metal > OpenGL > Null**

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

## D3D11 / D3D12

DirectX backends for Windows.

| Property | Value |
|---|---|
| API | Direct3D 11 / Direct3D 12 |
| Platforms | Windows only |
| Status | Development |

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

| Feature | OpenGL | Vulkan | Metal | D3D11 | Null |
|---|---|---|---|---|---|
| 3D Rendering | ✅ | ✅ | ✅ | ✅ | — |
| 2D Batch | ✅ | ✅ | ✅ | ✅ | — |
| Shader Compilation | ✅ | ✅ | ✅ | ✅ | — |
| `vio_read_pixels()` | ✅ | ⚠️ stub | ⚠️ stub | ⚠️ stub | — |
| Instanced Drawing | ✅ | ✅ | ✅ | ✅ | — |
| Render Targets | ✅ | ✅ | ✅ | ✅ | — |
| Cubemaps | ✅ | ✅ | ✅ | ✅ | — |
