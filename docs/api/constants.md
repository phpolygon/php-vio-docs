# Constants

Complete reference of all `VIO_*` constants.

## Vertex Formats

| Constant | Components | Type |
|---|---|---|
| `VIO_FLOAT1` | 1 | float |
| `VIO_FLOAT2` | 2 | float |
| `VIO_FLOAT3` | 3 | float |
| `VIO_FLOAT4` | 4 | float |
| `VIO_INT1` | 1 | int |
| `VIO_INT2` | 2 | int |
| `VIO_INT3` | 3 | int |
| `VIO_INT4` | 4 | int |

::: info
`vio_mesh()` stores every vertex as 32-bit floats, and its layout parser reads the component
count only from `VIO_FLOAT1` – `VIO_FLOAT4`: in a flat layout any other value (the `VIO_INT*`
constants included) counts as 3 floats. Use `VIO_FLOAT1` – `VIO_FLOAT4` or the dict layout with
`'components'`.

The C headers also define `VIO_UINT1` – `VIO_UINT4`. They are deliberately not registered as PHP
constants: there is no integer vertex path yet (the backend input layouts come from SPIR-V
reflection as `FLOAT1` – `FLOAT4`), so a UINT layout would only upload floats under another name.
:::

## Index Types

[`vio_mesh(['index_type' => …])`](/api/meshes#vio-mesh); [`vio_mesh_index_bytes()`](/api/meshes#vio-mesh-index-bytes) reports the width in use.

| Constant | Value | Description |
|---|---|---|
| `VIO_INDEX_UINT16` | 2 | 16-bit indices (chosen automatically when every index is < 65536) |
| `VIO_INDEX_UINT32` | 4 | Force 32-bit indices |

## Topology

| Constant | Value |
|---|---|
| `VIO_TRIANGLES` | 0 |
| `VIO_TRIANGLE_STRIP` | 1 |
| `VIO_TRIANGLE_FAN` | 2 |
| `VIO_LINES` | 3 |
| `VIO_LINE_STRIP` | 4 |
| `VIO_POINTS` | 5 |
| `VIO_PATCHES` | 6 |
| `VIO_LINES_ADJACENCY` | 7 |
| `VIO_LINE_STRIP_ADJACENCY` | 8 |
| `VIO_TRIANGLES_ADJACENCY` | 9 |
| `VIO_TRIANGLE_STRIP_ADJACENCY` | 10 |

`VIO_PATCHES` is drawn by pipelines with tessellation stages (`'patch_vertices'` control points,
`VIO_FEATURE_TESSELLATION`). The adjacency topologies feed geometry shaders;
`vio_mesh(['adjacency' => true])` builds `VIO_TRIANGLES_ADJACENCY` indices.

## Culling

| Constant | Value |
|---|---|
| `VIO_CULL_NONE` | 0 |
| `VIO_CULL_BACK` | 1 |
| `VIO_CULL_FRONT` | 2 |

## Blending

| Constant | Value |
|---|---|
| `VIO_BLEND_NONE` | 0 |
| `VIO_BLEND_ALPHA` | 1 |
| `VIO_BLEND_ADDITIVE` | 2 |
| `VIO_BLEND_PREMULTIPLIED` | 3 |
| `VIO_BLEND_MULTIPLY` | 4 |
| `VIO_BLEND_SCREEN` | 5 |
| `VIO_BLEND_MIN` | 6 |
| `VIO_BLEND_MAX` | 7 |

## Colour Mask

`vio_pipeline(['color_mask' => …, 'attachment_color_mask' => […]])`.

| Constant | Value |
|---|---|
| `VIO_COLOR_R` | 1 |
| `VIO_COLOR_G` | 2 |
| `VIO_COLOR_B` | 4 |
| `VIO_COLOR_A` | 8 |
| `VIO_COLOR_RGB` | 7 |
| `VIO_COLOR_RGBA` | 15 |

## Depth Testing

| Constant | Value |
|---|---|
| `VIO_DEPTH_LESS` | 0 |
| `VIO_DEPTH_LEQUAL` | 1 |

## Depth Reduction

`'depth_reduction'` of depth-only render targets: how MSAA depth is resolved and how a depth mip
chain is reduced (`VIO_FEATURE_DEPTH_MIPMAPS`).

| Constant | Value |
|---|---|
| `VIO_DEPTH_REDUCE_MAX` | 0 |
| `VIO_DEPTH_REDUCE_MIN` | 1 |

## Stencil

`vio_pipeline(['stencil' => ['func' => VIO_CMP_*, 'pass' => VIO_STENCIL_*, 'fail' => …, 'depth_fail' => …]])`,
gated by `VIO_FEATURE_STENCIL`.

| Compare function | Value | Stencil operation | Value |
|---|---|---|---|
| `VIO_CMP_NEVER` | 0 | `VIO_STENCIL_KEEP` | 0 |
| `VIO_CMP_LESS` | 1 | `VIO_STENCIL_ZERO` | 1 |
| `VIO_CMP_EQUAL` | 2 | `VIO_STENCIL_REPLACE` | 2 |
| `VIO_CMP_LEQUAL` | 3 | `VIO_STENCIL_INCR` (clamp at 255) | 3 |
| `VIO_CMP_GREATER` | 4 | `VIO_STENCIL_DECR` (clamp at 0) | 4 |
| `VIO_CMP_NOTEQUAL` | 5 | `VIO_STENCIL_INVERT` | 5 |
| `VIO_CMP_GEQUAL` | 6 | `VIO_STENCIL_INCR_WRAP` | 6 |
| `VIO_CMP_ALWAYS` | 7 | `VIO_STENCIL_DECR_WRAP` | 7 |

## Texture Filtering

| Constant | Value |
|---|---|
| `VIO_FILTER_NEAREST` | 0 |
| `VIO_FILTER_LINEAR` | 1 |

## Texture Wrapping

| Constant | Value |
|---|---|
| `VIO_WRAP_REPEAT` | 0 |
| `VIO_WRAP_CLAMP` | 1 |
| `VIO_WRAP_MIRROR` | 2 |

## Shader Formats

| Constant | Value |
|---|---|
| `VIO_SHADER_AUTO` | 0 |
| `VIO_SHADER_SPIRV` | 1 |
| `VIO_SHADER_GLSL` | 2 |
| `VIO_SHADER_MSL` | 3 |
| `VIO_SHADER_GLSL_RAW` | 4 |

::: info
`VIO_SHADER_HLSL` (5) exists in the C headers only and is deliberately not a PHP constant:
`vio_shader()` always hands the backends SPIR-V, because the D3D input layout, cbuffer layout and
sampler registers come from SPIR-V reflection – a whole shader in HLSL would have none. HLSL reaches the D3D backends through the `'hlsl'` keys of
[`vio_shader()`](/api/shaders#vio-shader), `vio_compute_pipeline()`, [`vio_rt_pipeline()`](/api/ray-tracing#vio-rt-pipeline) and
[`vio_work_graph()`](/api/mesh-shaders#vio-work-graph).
:::

## Vertex Attribute Usage

| Constant | Value |
|---|---|
| `VIO_POSITION` | 0 |
| `VIO_COLOR` | 1 |
| `VIO_TEXCOORD` | 2 |
| `VIO_NORMAL` | 3 |
| `VIO_TANGENT` | 4 |

## Buffer Types

| Constant | Value |
|---|---|
| `VIO_BUFFER_VERTEX` | 0 |
| `VIO_BUFFER_INDEX` | 1 |
| `VIO_BUFFER_UNIFORM` | 2 |
| `VIO_BUFFER_STORAGE` | 3 |

## Features

| Constant | Value |
|---|---|
| `VIO_FEATURE_COMPUTE` | 0 |
| `VIO_FEATURE_RAYTRACING` | 1 |
| `VIO_FEATURE_TESSELLATION` | 2 |
| `VIO_FEATURE_GEOMETRY` | 3 |
| `VIO_FEATURE_MULTIVIEW` | 4 |
| `VIO_FEATURE_3D_PIPELINE` | 5 |
| `VIO_FEATURE_READ_PIXELS` | 6 |
| `VIO_FEATURE_INSTANCED_DRAW` | 7 |
| `VIO_FEATURE_RENDER_TARGET` | 8 |
| `VIO_FEATURE_RENDER_TARGET_HDR` | 9 |
| `VIO_FEATURE_RENDER_TARGET_DEPTH` | 10 |
| `VIO_FEATURE_RENDER_TARGET_MSAA` | 11 |
| `VIO_FEATURE_CUBEMAP` | 12 |
| `VIO_FEATURE_DEPTH_BIAS` | 13 |
| `VIO_FEATURE_SCISSOR` | 14 |
| `VIO_FEATURE_TEXTURE_SWIZZLE` | 15 |
| `VIO_FEATURE_NATIVE_2D_BATCH` | 16 |
| `VIO_FEATURE_DEBUG_OUTPUT` | 17 |
| `VIO_FEATURE_DSA` | 18 |
| `VIO_FEATURE_BUFFER_STORAGE` | 19 |
| `VIO_FEATURE_TEXTURE_STORAGE` | 20 |
| `VIO_FEATURE_SEPARATE_SHADERS` | 21 |
| `VIO_FEATURE_TEXTURE_3D` | 22 |
| `VIO_FEATURE_RENDER_TARGET_CUBE` | 23 |
| `VIO_FEATURE_MIPMAP_GEN` | 24 |
| `VIO_FEATURE_MRT` | 25 |
| `VIO_FEATURE_STORAGE_IMAGE` | 26 |
| `VIO_FEATURE_FRAGMENT_STORAGE` | 27 |
| `VIO_FEATURE_SAMPLER_FEEDBACK_GLSL` | 28 |
| `VIO_FEATURE_VERTEX_STORAGE` | 30 |
| `VIO_FEATURE_STENCIL` | 31 |
| `VIO_FEATURE_GPU_TIMESTAMP` | 32 |
| `VIO_FEATURE_FRAME_LATENCY` | 33 |
| `VIO_FEATURE_HDR_OUTPUT` | 34 |
| `VIO_FEATURE_INDIRECT_DRAW` | 35 |
| `VIO_FEATURE_TEXTURE_ARRAY` | 36 |
| `VIO_FEATURE_TEXTURE_COMPRESSION_BC` | 37 |
| `VIO_FEATURE_SHADING_RATE` | 38 |
| `VIO_FEATURE_RENDER_TARGET_LAYERED` | 39 |
| `VIO_FEATURE_LAYERED_RENDER` | 40 |
| `VIO_FEATURE_VERTEX_LAYER` | 41 |
| `VIO_FEATURE_MULTI_VIEWPORT` | 42 |
| `VIO_FEATURE_GEOMETRY_INSTANCING` | 43 |
| `VIO_FEATURE_HLSL_STAGE_OVERRIDE` | 44 |
| `VIO_FEATURE_SUBGROUP` | 45 |
| `VIO_FEATURE_SUBGROUP_QUAD` | 46 |
| `VIO_FEATURE_BARYCENTRICS` | 47 |
| `VIO_FEATURE_ATOMIC64` | 48 |
| `VIO_FEATURE_SHADER_FLOAT16` | 49 |
| `VIO_FEATURE_BASE_VERTEX` | 50 |
| `VIO_FEATURE_COMPUTE_DERIVATIVES` | 51 |
| `VIO_FEATURE_SHADING_RATE_PRIMITIVE` | 52 |
| `VIO_FEATURE_SHADING_RATE_IMAGE` | 53 |
| `VIO_FEATURE_BINDLESS` | 54 |
| `VIO_FEATURE_MESH_SHADER` | 55 |
| `VIO_FEATURE_RAY_QUERY` | 56 |
| `VIO_FEATURE_SAMPLER_FEEDBACK` | 57 |
| `VIO_FEATURE_WORK_GRAPHS` | 58 |
| `VIO_FEATURE_COOPERATIVE_MATRIX` | 59 |
| `VIO_FEATURE_MULTIVIEW_GEOMETRY` | 60 |
| `VIO_FEATURE_MULTIVIEW_TESSELLATION` | 61 |
| `VIO_FEATURE_TEXTURE_COMPRESSION_ASTC` | 62 |
| `VIO_FEATURE_DEPTH_MIPMAPS` | 63 |
| `VIO_FEATURE_RASTER_RATE_MAP` | 64 |
| `VIO_FEATURE_LONG_VECTOR` | 65 |
| `VIO_FEATURE_SHADER_EXECUTION_REORDER` | 66 |
| `VIO_FEATURE_OPACITY_MICROMAP` | 67 |
| `VIO_FEATURE_RENDER_TARGET_DEPTH_SAMPLE` | 68 |
| `VIO_FEATURE_RENDER_TARGET_STORAGE` | 69 |
| `VIO_FEATURE_UPSCALER_NATIVE` | 70 |

Query support at runtime with [`vio_supports_feature()`](/api/backend#vio-supports-feature) and
how a backend provides it (native or emulated) with [`vio_feature_info()`](/api/backend#vio-feature-info).
[`vio_adapters()`](/api/backend#vio-adapters) lists the flags an adapter supports before a context exists.
The per-backend matrix is in the [Backends guide](/guide/backends#backend-feature-matrix).

## Pixel Formats

Render-target attachments (`attachments`), `vio_pipeline(['attachments' => …])` and the
`'format'` of [`vio_texture()`](/api/textures#vio-texture).

| Constant | Value | Description |
|---|---|---|
| `VIO_FORMAT_RGBA8` | 0 | |
| `VIO_FORMAT_RGBA16F` | 1 | |
| `VIO_FORMAT_RGBA32F` | 2 | |
| `VIO_FORMAT_R11G11B10F` | 3 | |
| `VIO_FORMAT_RG16F` | 4 | |
| `VIO_FORMAT_R16F` | 5 | |
| `VIO_FORMAT_R32F` | 6 | |
| `VIO_FORMAT_R8` | 7 | |
| `VIO_FORMAT_RGB10A2` | 8 | HDR10 backbuffer format; readback expands to RGBA8 |
| `VIO_FORMAT_BC1` | 9 | Block-compressed RGB(A), 1-bit alpha (DXT1) – `VIO_FEATURE_TEXTURE_COMPRESSION_BC` |
| `VIO_FORMAT_BC3` | 10 | Block-compressed RGBA (DXT5) |
| `VIO_FORMAT_BC4` | 11 | Block-compressed single channel (R) |
| `VIO_FORMAT_BC5` | 12 | Block-compressed two channels (RG), normal maps |
| `VIO_FORMAT_BC7` | 13 | High-quality block-compressed RGBA |
| `VIO_FORMAT_ASTC_4x4` | 14 | ASTC LDR – `VIO_FEATURE_TEXTURE_COMPRESSION_ASTC` |
| `VIO_FORMAT_ASTC_5x5` | 15 | |
| `VIO_FORMAT_ASTC_6x6` | 16 | |
| `VIO_FORMAT_ASTC_8x8` | 17 | |

The block-compressed formats are texture formats (`vio_texture(['format' => …])`,
[`vio_texture_ktx2()`](/api/textures#vio-texture-ktx2)), not render-target attachments.

## Render Targets

| Constant | Value | Description |
|---|---|---|
| `VIO_MAX_COLOR_ATTACHMENTS` | 8 | Colour attachments per render target (`attachments`) |
| `VIO_RT_DEPTH` | -1 | [`vio_render_target_texture()`](/api/render-targets#vio-render-target-texture): the depth of a colour target |
| `VIO_RT_ALL_LAYERS` | -2 | [`vio_bind_render_target()`](/api/render-targets#vio-bind-render-target): every face / layer at once |
| `VIO_MAX_VIEWPORTS` | 16 | Viewports per [`vio_viewports()`](/api/window#vio-viewports) call |

## Variable Rate Shading

[`vio_set_shading_rate()`](/api/shading-rate#vio-set-shading-rate) and the bytes of
[`vio_set_shading_rate_image()`](/api/shading-rate#vio-set-shading-rate-image).

| Constant | Value | Description |
|---|---|---|
| `VIO_SHADING_RATE_1X1` | 0 | Full rate (default) |
| `VIO_SHADING_RATE_1X2` | 1 | One fragment invocation per 1 × 2 pixels |
| `VIO_SHADING_RATE_2X1` | 2 | One per 2 × 1 pixels |
| `VIO_SHADING_RATE_2X2` | 3 | A quarter of the fragment invocations |
| `VIO_SHADING_RATE_4X4` | 4 | A sixteenth (needs the device's additional shading rates) |

## Portable Upscaling

`'mode'` of [`vio_upscale()`](/api/upscale#vio-upscale).

| Constant | Value | Description |
|---|---|---|
| `VIO_UPSCALE_SPATIAL` | 0 | Edge-adaptive Lanczos-2 (default) |
| `VIO_UPSCALE_TEMPORAL` | 1 | Jittered frames accumulated into a per-context history |

## Sampler Feedback

| Constant | Type | Description |
|---|---|---|
| `VIO_SAMPLER_FEEDBACK_GLSL` | string | GLSL prelude that declares `vio_write_feedback(sampler, uv)`; prepend it to a fragment shader ([details](/api/bindless#sampler-feedback)) |

## Build Capabilities

| Constant | Value | Description |
|---|---|---|
| `VIO_HAS_SHAPING` | 0 / 1 | 1 when the extension was built with HarfBuzz text shaping (`--with-harfbuzz`) |

## Native Upscalers

[`vio_upscaler_*`](/api/upscaling).

| Constant | Value | Description |
|---|---|---|
| `VIO_UPSCALER_FSR3` | 1 | AMD FidelityFX FSR 3.1 (D3D12, Vulkan) |
| `VIO_UPSCALER_DLSS` | 2 | NVIDIA DLSS Super Resolution / DLAA through NGX (D3D12, Vulkan; with the `vio_dlss` [plugin](/api/upscaling#upscaler-plugins)) |
| `VIO_UPSCALER_XESS` | 3 | Reserved |
| `VIO_UPSCALE_NATIVE_AA` | 0 | Render = display (anti-aliasing only) |
| `VIO_UPSCALE_QUALITY` | 1 | Display ÷ 1.5 per axis |
| `VIO_UPSCALE_BALANCED` | 2 | Display ÷ 1.7 |
| `VIO_UPSCALE_PERFORMANCE` | 3 | Display ÷ 2 |
| `VIO_UPSCALE_ULTRA_PERFORMANCE` | 4 | Display ÷ 3 |

## Compute Access

| Constant | Value |
|---|---|
| `VIO_COMPUTE_READ` | 0 |
| `VIO_COMPUTE_WRITE` | 1 |

## Input Actions

| Constant | Value |
|---|---|
| `VIO_RELEASE` | 0 |
| `VIO_PRESS` | 1 |
| `VIO_REPEAT` | 2 |

## Mouse Buttons

| Constant | Value |
|---|---|
| `VIO_MOUSE_LEFT` | 0 |
| `VIO_MOUSE_RIGHT` | 1 |
| `VIO_MOUSE_MIDDLE` | 2 |

## Cursor Modes

[`vio_set_cursor_mode()`](/api/mouse#vio-set-cursor-mode).

| Constant | Value | Description |
|---|---|---|
| `VIO_CURSOR_NORMAL` | 0 | Visible, free cursor |
| `VIO_CURSOR_DISABLED` | 1 | Hidden, confined, raw mouse motion (first-person controls) |
| `VIO_CURSOR_HIDDEN` | 2 | Cursor hidden, not confined |

## Touch Phases

Used by `vio_touch_get()` and `vio_touch_inject()` for the touch `phase` field.

| Constant | Value |
|---|---|
| `VIO_TOUCH_BEGAN` | 1 |
| `VIO_TOUCH_MOVED` | 2 |
| `VIO_TOUCH_STATIONARY` | 3 |
| `VIO_TOUCH_ENDED` | 4 |
| `VIO_TOUCH_CANCELLED` | 5 |

## Modifier Keys (Bitmask)

| Constant | Value |
|---|---|
| `VIO_MOD_SHIFT` | 0x0001 |
| `VIO_MOD_CONTROL` | 0x0002 |
| `VIO_MOD_ALT` | 0x0004 |
| `VIO_MOD_SUPER` | 0x0008 |
| `VIO_MOD_CAPS_LOCK` | 0x0010 |
| `VIO_MOD_NUM_LOCK` | 0x0020 |

## Keyboard Keys

### Letters
`VIO_KEY_A` (65) through `VIO_KEY_Z` (90)

### Numbers
`VIO_KEY_0` (48) through `VIO_KEY_9` (57)

### Function Keys
`VIO_KEY_F1` (290) through `VIO_KEY_F12` (301)

### Special Keys

| Constant | Value |
|---|---|
| `VIO_KEY_UNKNOWN` | -1 |
| `VIO_KEY_SPACE` | 32 |
| `VIO_KEY_APOSTROPHE` | 39 |
| `VIO_KEY_COMMA` | 44 |
| `VIO_KEY_MINUS` | 45 |
| `VIO_KEY_PERIOD` | 46 |
| `VIO_KEY_SLASH` | 47 |
| `VIO_KEY_SEMICOLON` | 59 |
| `VIO_KEY_EQUAL` | 61 |
| `VIO_KEY_LEFT_BRACKET` | 91 |
| `VIO_KEY_BACKSLASH` | 92 |
| `VIO_KEY_RIGHT_BRACKET` | 93 |
| `VIO_KEY_GRAVE_ACCENT` | 96 |
| `VIO_KEY_ESCAPE` | 256 |
| `VIO_KEY_ENTER` | 257 |
| `VIO_KEY_TAB` | 258 |
| `VIO_KEY_BACKSPACE` | 259 |
| `VIO_KEY_INSERT` | 260 |
| `VIO_KEY_DELETE` | 261 |
| `VIO_KEY_RIGHT` | 262 |
| `VIO_KEY_LEFT` | 263 |
| `VIO_KEY_DOWN` | 264 |
| `VIO_KEY_UP` | 265 |
| `VIO_KEY_PAGE_UP` | 266 |
| `VIO_KEY_PAGE_DOWN` | 267 |
| `VIO_KEY_HOME` | 268 |
| `VIO_KEY_END` | 269 |
| `VIO_KEY_CAPS_LOCK` | 280 |
| `VIO_KEY_SCROLL_LOCK` | 281 |
| `VIO_KEY_NUM_LOCK` | 282 |
| `VIO_KEY_PRINT_SCREEN` | 283 |
| `VIO_KEY_PAUSE` | 284 |
| `VIO_KEY_MENU` | 348 |

### Numpad Keys

The keypad keys are reported with these codes on every platform and are PHP constants since
**v2.35.0** (before that the names existed in the C headers only – on older versions compare
against the integer values):

```php
if (vio_key_just_pressed($ctx, VIO_KEY_ENTER) || vio_key_just_pressed($ctx, VIO_KEY_KP_ENTER)) {
    submit();
}
```

| Constant | Value |
|---|---|
| `VIO_KEY_KP_0` – `VIO_KEY_KP_9` | 320–329 |
| `VIO_KEY_KP_DECIMAL` | 330 |
| `VIO_KEY_KP_DIVIDE` | 331 |
| `VIO_KEY_KP_MULTIPLY` | 332 |
| `VIO_KEY_KP_SUBTRACT` | 333 |
| `VIO_KEY_KP_ADD` | 334 |
| `VIO_KEY_KP_ENTER` | 335 |
| `VIO_KEY_KP_EQUAL` | 336 |

### Modifier Keys

| Constant | Value |
|---|---|
| `VIO_KEY_LEFT_SHIFT` | 340 |
| `VIO_KEY_LEFT_CONTROL` | 341 |
| `VIO_KEY_LEFT_ALT` | 342 |
| `VIO_KEY_LEFT_SUPER` | 343 |
| `VIO_KEY_RIGHT_SHIFT` | 344 |
| `VIO_KEY_RIGHT_CONTROL` | 345 |
| `VIO_KEY_RIGHT_ALT` | 346 |
| `VIO_KEY_RIGHT_SUPER` | 347 |

## Gamepad Buttons

| Constant | Value |
|---|---|
| `VIO_GAMEPAD_A` | 0 |
| `VIO_GAMEPAD_B` | 1 |
| `VIO_GAMEPAD_X` | 2 |
| `VIO_GAMEPAD_Y` | 3 |
| `VIO_GAMEPAD_LEFT_BUMPER` | 4 |
| `VIO_GAMEPAD_RIGHT_BUMPER` | 5 |
| `VIO_GAMEPAD_BACK` | 6 |
| `VIO_GAMEPAD_START` | 7 |
| `VIO_GAMEPAD_GUIDE` | 8 |
| `VIO_GAMEPAD_LEFT_THUMB` | 9 |
| `VIO_GAMEPAD_RIGHT_THUMB` | 10 |
| `VIO_GAMEPAD_DPAD_UP` | 11 |
| `VIO_GAMEPAD_DPAD_RIGHT` | 12 |
| `VIO_GAMEPAD_DPAD_DOWN` | 13 |
| `VIO_GAMEPAD_DPAD_LEFT` | 14 |

## Gamepad Axes

| Constant | Value |
|---|---|
| `VIO_GAMEPAD_AXIS_LEFT_X` | 0 |
| `VIO_GAMEPAD_AXIS_LEFT_Y` | 1 |
| `VIO_GAMEPAD_AXIS_RIGHT_X` | 2 |
| `VIO_GAMEPAD_AXIS_RIGHT_Y` | 3 |
| `VIO_GAMEPAD_AXIS_LEFT_TRIGGER` | 4 |
| `VIO_GAMEPAD_AXIS_RIGHT_TRIGGER` | 5 |

## Plugin Types

| Constant | Value |
|---|---|
| `VIO_PLUGIN_TYPE_GENERIC` | 0 |
| `VIO_PLUGIN_TYPE_OUTPUT` | 1 |
| `VIO_PLUGIN_TYPE_INPUT` | 2 |
| `VIO_PLUGIN_TYPE_FILTER` | 4 |
| `VIO_PLUGIN_API_VERSION` | 1 |
