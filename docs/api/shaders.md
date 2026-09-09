# Shaders & Pipelines

Functions for shader compilation, pipeline creation, reflection, and uniform management.

## vio_shader

```php
VioShader|false vio_shader(VioContext $context, array $config)
```

Compile a shader program.

**Config:**

| Key | Type | Required | Description |
|---|---|---|---|
| `vertex` | string | Yes | Vertex shader source |
| `fragment` | string | Yes | Fragment shader source |
| `format` | int | No | Shader format (default: `VIO_SHADER_AUTO`) |

### Shader Format Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_SHADER_AUTO` | 0 | Auto-detect (checks for SPIR-V magic number) |
| `VIO_SHADER_SPIRV` | 1 | Raw SPIR-V binary |
| `VIO_SHADER_GLSL` | 2 | GLSL → compile to SPIR-V → cross-compile |
| `VIO_SHADER_MSL` | 3 | Metal Shading Language (Metal backend only) |
| `VIO_SHADER_GLSL_RAW` | 4 | GLSL passed directly (OpenGL only) |
| `VIO_SHADER_HLSL` | 5 | HLSL passed directly (D3D only) |

## vio_pipeline

```php
VioPipeline|false vio_pipeline(VioContext $context, array $config)
```

Create a render pipeline combining shader and render state.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `shader` | VioShader | required | Compiled shader |
| `topology` | int | `VIO_TRIANGLES` | Primitive topology |
| `cull_mode` | int | `VIO_CULL_NONE` | Face culling mode |
| `depth_test` | bool | `false` | Enable depth testing |
| `depth_write` | bool | `true` | Write depth (disable for skies / transparents that still test) |
| `depth_func` | int | `VIO_DEPTH_LESS` | Depth comparison |
| `blend` | int | `VIO_BLEND_NONE` | Blend mode |
| `color_mask` | int | `VIO_COLOR_RGBA` | Colour channels written (`VIO_COLOR_R\|G\|B\|A`, `VIO_COLOR_RGB`) |
| `depth_bias` | float | `0` | Constant depth bias (shadow acne) |
| `slope_scaled_depth_bias` | float | `0` | Slope-scaled depth bias |
| `hdr` | bool | `false` | Pipeline renders into an RGBA16F (`hdr`) target — needed for the D3D12 / Metal PSO format |
| `attachments` | int[] | — | `VIO_FORMAT_*` per colour attachment when rendering into an MRT target (D3D12 PSO) |

### Cull Mode Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_CULL_NONE` | 0 | No culling |
| `VIO_CULL_BACK` | 1 | Cull back faces |
| `VIO_CULL_FRONT` | 2 | Cull front faces |

### Blend Mode Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_BLEND_NONE` | 0 | No blending |
| `VIO_BLEND_ALPHA` | 1 | Standard alpha blending |
| `VIO_BLEND_ADDITIVE` | 2 | Additive blending |
| `VIO_BLEND_PREMULTIPLIED` | 3 | Premultiplied alpha (`1, 1-src.a`) |
| `VIO_BLEND_MULTIPLY` | 4 | `dst.rgb * src.rgb` |
| `VIO_BLEND_SCREEN` | 5 | Screen (`1, 1-src.rgb`) |
| `VIO_BLEND_MIN` | 6 | `min(src, dst)` |
| `VIO_BLEND_MAX` | 7 | `max(src, dst)` |

### Depth Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_DEPTH_LESS` | 0 | Pass if depth < buffer |
| `VIO_DEPTH_LEQUAL` | 1 | Pass if depth <= buffer |

### Colour Mask Constants

| Constant | Value |
|---|---|
| `VIO_COLOR_R` | 1 |
| `VIO_COLOR_G` | 2 |
| `VIO_COLOR_B` | 4 |
| `VIO_COLOR_A` | 8 |
| `VIO_COLOR_RGB` | 7 |
| `VIO_COLOR_RGBA` | 15 |

## vio_bind_pipeline

```php
void vio_bind_pipeline(VioContext $context, VioPipeline $pipeline)
```

Bind a pipeline for subsequent draw calls. Must be called within a frame (`vio_begin` / `vio_end`).

## vio_shader_reflect

```php
array|false vio_shader_reflect(VioShader $shader)
```

Introspect a compiled shader's interface. Requires SPIRV-Cross.

**Returns:**

```php
[
    "vertex" => [
        "inputs" => [
            ["name" => "aPos", "location" => 0, "format" => "vec3"],
        ],
        "ubos" => [
            ["name" => "Matrices", "set" => 0, "binding" => 0, "size" => 192],
        ],
        "textures" => [],
        "uniforms" => [],
        "storage_buffers" => [
            ["name" => "Instances", "set" => 0, "binding" => 0],
        ],
    ],
    "fragment" => [
        "inputs" => [...],
        "ubos" => [],
        "textures" => [
            ["name" => "uTexture", "set" => 0, "binding" => 0],
        ],
        "uniforms" => [],
        "storage_buffers" => [],
    ],
]
```

Each stage also reports `storage_buffers` (SSBO / `StructuredBuffer`) as
`{name, set, binding}`. This lets the engine validate a vertex-stage storage
buffer binding for readback-free instancing (see
[`vio_bind_storage_buffer`](buffers.md#vio_bind_storage_buffer) and
`VIO_FEATURE_VERTEX_STORAGE`).

## vio_set_uniform

```php
void vio_set_uniform(VioContext $context, string $name, int|float|array $value)
```

Set a uniform value by name. For simple uniforms outside of UBOs.

```php
vio_set_uniform($ctx, "uTime", 3.14);                      // float
vio_set_uniform($ctx, "uColor", [1.0, 0.0, 0.0, 1.0]);    // vec4
vio_set_uniform($ctx, "uEnabled", 1);                       // int
```
