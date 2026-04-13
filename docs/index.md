---
layout: home

hero:
  name: php-vio
  text: GPU Rendering for PHP
  tagline: OpenGL, Vulkan, Metal, Audio, Video Recording & Input — as a native PHP extension.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/context
    - theme: alt
      text: View on GitHub
      link: https://github.com/phpgl/php-vio

features:
  - title: Multi-Backend GPU
    details: OpenGL 4.1, Vulkan, Metal, D3D11/D3D12. Auto-selects the best backend or choose explicitly. One API for all platforms.
  - title: 2D & 3D Rendering
    details: Z-sorted 2D batch renderer (rects, circles, sprites, text) and full 3D pipeline with meshes, shaders, pipelines, and instancing.
  - title: Shader Pipeline
    details: Write GLSL, compile to SPIR-V via glslang, reflect with SPIRV-Cross. Cross-compile to Metal/HLSL automatically.
  - title: Audio Engine
    details: miniaudio-powered playback of MP3, WAV, FLAC, OGG. 3D positional audio, volume, pitch, pan, and looping.
  - title: Video & Streaming
    details: Record gameplay to H.264/MP4 with hardware acceleration. Stream live via RTMP or SRT using FFmpeg.
  - title: Headless & Testing
    details: Offscreen rendering without a window. Pixel-perfect visual regression testing with image comparison and diff output.
---
