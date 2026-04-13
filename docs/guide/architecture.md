# Architecture

php-vio uses a **vtable-based backend dispatch** pattern. All GPU operations are abstracted behind a common interface, and concrete backends (OpenGL, Vulkan, Metal, D3D) implement the same set of function pointers.

## Backend Vtable

The core of the system is `vio_backend` — a struct of ~20 function pointers defined in `include/vio_backend.h`:

```
vio_create("opengl"|"vulkan"|"metal"|"d3d11"|"d3d12"|"null"|"auto", [...])
  → vio_find_backend(name)
    → backend->create_surface()
```

When you call `vio_create()`, the extension:

1. Looks up the requested backend by name (or auto-selects)
2. Calls the backend's `create_surface()` to initialize the GPU context
3. Returns a `VioContext` PHP object wrapping the native state

All subsequent calls (`vio_draw`, `vio_bind_pipeline`, etc.) dispatch through the vtable.

## Auto-Selection Priority

When using `"auto"` (the default):

```
D3D12 > Vulkan > D3D11 > Metal > OpenGL > Null
```

The first available backend in this order wins. On Windows, D3D12 is preferred. On macOS, Vulkan (via MoltenVK) or Metal. On Linux, Vulkan or OpenGL.

## Backend Registration

Backends register themselves during `MINIT` (module initialization). Each backend calls `vio_register_backend()` with its name and vtable struct. This happens at extension load time — before any PHP code runs.

## Zend Object Model

php-vio defines 12 PHP classes, each backed by a C struct:

| Class | C Struct | Macro |
|---|---|---|
| `VioContext` | `vio_context_object` | `Z_VIO_CTX_P()` |
| `VioMesh` | `vio_mesh_object` | `Z_VIO_MESH_P()` |
| `VioShader` | `vio_shader_object` | `Z_VIO_SHADER_P()` |
| `VioPipeline` | `vio_pipeline_object` | `Z_VIO_PIPELINE_P()` |
| `VioTexture` | `vio_texture_object` | `Z_VIO_TEXTURE_P()` |
| `VioBuffer` | `vio_buffer_object` | `Z_VIO_BUFFER_P()` |
| `VioFont` | `vio_font_object` | `Z_VIO_FONT_P()` |
| `VioRenderTarget` | `vio_render_target_object` | `Z_VIO_RT_P()` |
| `VioCubemap` | `vio_cubemap_object` | `Z_VIO_CUBEMAP_P()` |
| `VioSound` | `vio_audio_object` | `Z_VIO_AUDIO_P()` |
| `VioRecorder` | `vio_recorder_object` | `Z_VIO_RECORDER_P()` |
| `VioStream` | `vio_stream_object` | `Z_VIO_STREAM_P()` |

All follow the same pattern: `zend_object std` as the **last** field in the struct, with a `from_obj()` inline helper for pointer arithmetic.

## Conditional Compilation

Every optional feature is behind an `#ifdef` guard:

```c
#ifdef HAVE_GLFW     // Windowing & input
#ifdef HAVE_VULKAN   // Vulkan backend
#ifdef HAVE_METAL    // Metal backend (macOS only)
#ifdef HAVE_D3D11    // Direct3D 11 backend (Windows only)
#ifdef HAVE_D3D12    // Direct3D 12 backend (Windows only)
#ifdef HAVE_FFMPEG   // Video recording & streaming
#ifdef HAVE_GLSLANG  // GLSL → SPIR-V compilation
#ifdef HAVE_SPIRV_CROSS // Shader reflection & transpilation
```

This means the extension compiles cleanly even if you only have GLFW installed — unsupported features simply return `false`.

## Frame Lifecycle

A typical frame follows this sequence:

```
vio_begin($ctx)          ← Prepare frame (swap buffers setup)
  vio_clear($ctx, ...)   ← Clear framebuffer
  vio_bind_pipeline(...)  ← Set render state
  vio_draw(...)           ← Submit 3D draw calls
  vio_rect/circle/...     ← Queue 2D primitives
  vio_draw_2d($ctx)       ← Flush 2D batch (z-sorted)
vio_end($ctx)            ← Present frame to screen
vio_poll_events($ctx)    ← Process input events
```

## 2D Batch Renderer

The 2D system collects up to 4096 draw items per frame. Each item has a z-value for sorting. When `vio_draw_2d()` is called:

1. Items are sorted by z-value
2. Batched by texture (sprites vs. solid shapes)
3. Rendered in a single pass with the built-in 2D shader

## Resource Lifecycle

All GPU resources (meshes, shaders, textures, etc.) are tied to a `VioContext`. When the context is destroyed, all associated resources are cleaned up automatically. You can also destroy individual resources early by letting PHP garbage-collect them.

## Module Globals

```ini
vio.default_backend = "auto"   ; Default backend selection
vio.debug = 0                  ; Enable debug output
vio.vsync = 1                  ; V-Sync enabled by default
```

These can be set in `php.ini` or at runtime via `ini_set()`.

## Directory Structure

```
php_vio.c                    # All PHP function implementations
php_vio.h                    # Module globals, INI entries
include/
  vio_backend.h              # Backend vtable interface
  vio_types.h                # Enums, structs, descriptors
  vio_constants.h            # Input constants (GLFW-compatible)
  vio_plugin.h               # Plugin system interface
src/
  vio_context.c              # Context object management
  vio_backend_registry.c     # Backend registry & auto-selection
  vio_backend_null.c         # No-op backend for testing
  vio_2d.c                   # 2D batch renderer
  vio_mesh.c / vio_shader.c  # 3D resources
  vio_audio.c                # miniaudio integration
  vio_recorder.c             # FFmpeg recording
  vio_stream.c               # FFmpeg streaming
  backends/
    opengl/vio_opengl.c      # OpenGL 4.1 Core
    vulkan/vio_vulkan.c      # Vulkan + VMA
    metal/vio_metal.m         # Metal (Objective-C)
    d3d11/vio_d3d11.c        # Direct3D 11 (Windows)
    d3d12/vio_d3d12.c        # Direct3D 12 (Windows)
vendor/
  glad/ stb/ vma/ miniaudio/ # Vendored dependencies
```
