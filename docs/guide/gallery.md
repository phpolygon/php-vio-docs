# Feature Gallery

Every image on this page is rendered **headless** by
[`examples/gallery.php`](https://github.com/phpolygon/php-vio/blob/main/examples/gallery.php)
in the php-vio repository — no window, no manual retouching. The script doubles as a
smoke test of each feature path on a real backend:

```bash
php -d extension=vio examples/gallery.php            # auto backend, all scenes → docs/gallery/
php -d extension=vio examples/gallery.php d3d11      # pick a backend
php -d extension=vio examples/gallery.php opengl out/ shadow_map,hdr_tonemap
```

The scenes below were captured on Direct3D 12 (the MSAA scene on Direct3D 11, the tessellation
scene on OpenGL); the same script produces the same pictures on OpenGL and Metal.

## 2D

| | |
|---|---|
| ![2D shapes](/gallery/2d_shapes.png) | ![Sprites and text](/gallery/2d_sprites_text.png) |
| **Shapes** — `vio_rect`, `vio_rounded_rect`, `vio_circle`, `vio_line`; one z-sorted batch, one draw call. [Guide](/guide/rendering-2d#shapes) | **Sprites & text** — `vio_sprite` + `vio_text` with HarfBuzz shaping (Arabic RTL, Thai clusters) and `max_width` word wrap. [Guide](/guide/rendering-2d#text) |

## 3D pipeline

| | |
|---|---|
| ![Lit meshes](/gallery/3d_lit_meshes.png) | ![Instancing](/gallery/instancing.png) |
| **Meshes, shaders, pipelines** — `vio_mesh` / `vio_shader` / `vio_pipeline` / `vio_draw`; GLSL → SPIR-V → HLSL/MSL/GLSL. [Guide](/guide/rendering-3d) | **Instancing** — `vio_draw_instanced`, 400 cubes with per-instance `mat4` in a single draw. [Guide](/guide/rendering-3d#drawing) |
| ![Sampler filter and wrap](/gallery/sampler_filter_wrap.png) | ![Anisotropy](/gallery/anisotropy.png) |
| **Sampler states** — `filter` × `wrap` grid (`VIO_FILTER_*`, `VIO_WRAP_*`). [API](/api/textures#filter-constants) | **Anisotropic filtering** — `['anisotropy' => 16]` (right) vs. trilinear (left) on a grazing-angle plane. [API](/api/textures#vio-texture) |
| ![3D texture](/gallery/texture_3d_volume.png) | |
| **Volume texture** — `vio_texture_3d` ray-marched through `sampler3D`. [API](/api/textures#vio-texture-3d) | |

## Geometry & tessellation stages

| | |
|---|---|
| ![Geometry shader point sprites](/gallery/geometry_shader.png) | ![Tessellated patches](/gallery/tessellation.png) |
| **Geometry shader** — `vio_shader(['geometry' => …])`: 700 single vertices drawn as `VIO_POINTS`, the GS emits a sprite quad per point, sized and coloured from per-vertex data. [Guide](/guide/shaders#geometry-tessellation-stages) | **Tessellation** — `tess_control` + `tess_eval` on `VIO_PATCHES` (`patch_vertices` 4): the evaluation stage displaces 3×3 quad patches by a height function; `u_level` 2 (left) vs 18 (right). [Guide](/guide/shaders#geometry-tessellation-stages) |

## Render targets

| | |
|---|---|
| ![Post-processing](/gallery/render_target_postprocess.png) | ![Shadow map](/gallery/shadow_map.png) |
| **Post-processing** — scene into `vio_render_target`, second pass samples it as a texture. [Guide](/guide/render-targets#example-post-processing) | **Shadow mapping** — `['depth_only' => true]` target, PCF lookup with a comparison sampler. [Guide](/guide/render-targets#creating-a-render-target) |
| ![MRT G-buffer](/gallery/mrt_gbuffer.png) | ![MSAA render target](/gallery/msaa_render_target.png) |
| **Multiple render targets** — `'attachments' => [RGBA8, RGBA16F, R16F]`, one pass writes albedo / normals / depth. | **MSAA** — `['samples' => 4]` render target, resolved on unbind (D3D11, OpenGL, Metal). |
| ![Cube environment](/gallery/cubemap_environment.png) | ![HDR tone mapping](/gallery/hdr_tonemap.png) |
| **Cube render target** — six faces via `vio_bind_render_target($ctx, $rt, $face)`, `vio_generate_mipmaps`, `textureLod` by roughness. [API](/api/cubemaps) | **HDR** — `['hdr' => true]` RGBA16F target, ACES tone map in the resolve pass. |

## Compute

| | |
|---|---|
| ![Compute storage image](/gallery/compute_storage_image.png) | ![Compute vertex storage](/gallery/compute_vertex_storage.png) |
| **Storage image** — compute shader writes an `image2D` (`['storage' => true]`), the render pass samples it. | **Vertex-stage storage buffer** — compute writes instance matrices, the vertex shader reads them via `gl_InstanceIndex`; no readback. [API](/api/buffers) |

## Backend coverage

| Scene | OpenGL | D3D11 | D3D12 | Metal | Vulkan |
|---|---|---|---|---|---|
| 2D shapes / sprites / text | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3D meshes, instancing, samplers, anisotropy, 3D texture | ✅ | ✅ | ✅ | ✅ | — |
| Post-process, shadow map, MRT, cube RT, HDR | ✅ | ✅ | ✅ | ✅ | — |
| MSAA render target | ✅ | ✅ | — | ✅ | — |
| Compute storage image, vertex storage | ✅ (GL ≥ 4.3) | ✅ | ✅ | ✅ | — |
| Geometry shader | ✅ (GL ≥ 3.2) | ✅ (SPIRV-Cross ≥ 2025-05) | ✅ (same) | — | — |
| Tessellation | ✅ (GL ≥ 4.0) | — | — | — | — |

Vulkan currently has no 3D pipeline (`VIO_FEATURE_3D_PIPELINE == 0`); query
[`vio_supports_feature()`](/api/backend#vio-supports-feature) before relying on a path.
