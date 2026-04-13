# What is php-vio?

**php-vio** is a native PHP extension that brings GPU rendering, audio playback, video recording, streaming, and input handling directly into PHP. It is the foundation layer for the [PHPolygon](https://phpolygon.github.io) game engine.

## Why a PHP Extension?

PHP has mature tooling for web applications, but lacks native access to GPUs, audio hardware, and low-level input. php-vio bridges this gap by exposing a clean, procedural API that wraps battle-tested C libraries:

| Capability | Powered by |
|---|---|
| Windowing & Input | [GLFW 3.4](https://www.glfw.org/) |
| OpenGL Rendering | [GLAD](https://glad.dav1d.de/) (OpenGL 4.1 Core) |
| Vulkan Rendering | [Vulkan SDK](https://vulkan.lunarg.com/) + [VMA](https://github.com/GPUOpen-LibrariesAndSDKs/VulkanMemoryAllocator) |
| Metal Rendering | Apple Metal Framework (macOS) |
| Shader Compilation | [glslang](https://github.com/KhronosGroup/glslang) (GLSL → SPIR-V) |
| Shader Reflection | [SPIRV-Cross](https://github.com/KhronosGroup/SPIRV-Cross) |
| Audio | [miniaudio](https://miniaud.io/) |
| Video / Streaming | [FFmpeg](https://ffmpeg.org/) (libavcodec, libavformat) |
| Font Rendering | [stb_truetype](https://github.com/nothings/stb) |
| Image I/O | [stb_image](https://github.com/nothings/stb), stb_image_write |

## Key Features

### Multi-Backend Rendering
php-vio abstracts GPU operations behind a vtable-based backend system. You write rendering code once, and it runs on OpenGL, Vulkan, Metal, or D3D11/D3D12. Backends are auto-selected at runtime or can be chosen explicitly.

### 2D + 3D in One Extension
The 2D batch renderer handles rects, circles, lines, rounded rects, sprites, and text — all z-sorted and flushed in a single draw call. The 3D pipeline provides meshes, shaders, pipelines, instanced drawing, render targets, and cubemaps.

### Shader Pipeline
Write your shaders in GLSL. php-vio compiles them to SPIR-V via glslang, then cross-compiles to the active backend's native format (GLSL for OpenGL, MSL for Metal, HLSL for D3D) using SPIRV-Cross. Shader reflection lets you introspect uniforms, textures, and vertex inputs at runtime.

### Audio Engine
Load and play MP3, WAV, FLAC, and OGG files. Control volume, pitch, pan, and looping. Position sounds in 3D space with a listener model.

### Video Recording & Live Streaming
Capture frames to H.264/MP4 with optional hardware acceleration (VideoToolbox on macOS). Stream live to RTMP or SRT endpoints using FFmpeg.

### Headless Mode
Create a rendering context without a window for automated testing, CI pipelines, or server-side rendering. Capture framebuffer contents, save screenshots, and compare images pixel-by-pixel for visual regression testing.

## Platform Support

| Platform | OpenGL | Vulkan | Metal | D3D11/12 |
|---|---|---|---|---|
| macOS | ✅ | ✅ (MoltenVK) | ✅ | — |
| Linux | ✅ | ✅ | — | — |
| Windows | ✅ | ✅ | — | ✅ |

## Requirements

- PHP 8.4 or later
- GLFW 3.4 (for windowing)
- Optional: Vulkan SDK, FFmpeg, glslang, SPIRV-Cross

## Next Steps

- [Getting Started](/guide/getting-started) — Install and run your first window
- [Architecture](/guide/architecture) — Understand the backend dispatch system
- [API Reference](/api/context) — Complete function reference
