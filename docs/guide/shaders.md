# Shaders

php-vio provides a complete shader pipeline: write GLSL, compile to SPIR-V, cross-compile to the active backend, and introspect at runtime.

## Shader Formats

| Constant | Description |
|---|---|
| `VIO_SHADER_AUTO` | Auto-detect from SPIR-V magic number |
| `VIO_SHADER_GLSL` | GLSL → SPIR-V → cross-compile to backend |
| `VIO_SHADER_SPIRV` | Raw SPIR-V binary |
| `VIO_SHADER_MSL` | Metal Shading Language (Metal only) |
| `VIO_SHADER_GLSL_RAW` | GLSL passed directly (OpenGL only) |
| `VIO_SHADER_HLSL` | HLSL passed directly (D3D only) |

## Writing GLSL Shaders

The recommended approach is to write GLSL and let php-vio handle the rest:

```php
$shader = vio_shader($ctx, [
    "vertex" => "#version 410 core
        layout(location=0) in vec3 aPosition;
        layout(location=1) in vec2 aTexCoord;

        layout(std140, binding=0) uniform Matrices {
            mat4 uProjection;
            mat4 uView;
            mat4 uModel;
        };

        out vec2 vTexCoord;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
            vTexCoord = aTexCoord;
        }
    ",
    "fragment" => "#version 410 core
        in vec2 vTexCoord;
        uniform sampler2D uTexture;
        out vec4 fragColor;

        void main() {
            fragColor = texture(uTexture, vTexCoord);
        }
    ",
]);
```

## Compilation Pipeline

When `format` is `VIO_SHADER_GLSL` (the default):

```
GLSL source
  → glslang → SPIR-V binary
    → SPIRV-Cross → Backend-native format
      OpenGL: GLSL 4.10
      Metal:  MSL
      Vulkan: SPIR-V (passthrough)
      D3D:    HLSL
```

This requires `--with-glslang` and `--with-spirv-cross` at build time.

## Raw GLSL (OpenGL Only)

Skip the SPIR-V pipeline for maximum compatibility:

```php
$shader = vio_shader($ctx, [
    "vertex"   => $glsl_source,
    "fragment" => $glsl_source,
    "format"   => VIO_SHADER_GLSL_RAW,
]);
```

::: warning
Raw GLSL shaders only work with the OpenGL backend. They cannot be cross-compiled to Vulkan/Metal.
:::

## Shader Reflection

Introspect compiled shaders at runtime:

```php
$info = vio_shader_reflect($shader);
```

Returns:

```php
[
    "vertex" => [
        "inputs" => [
            ["name" => "aPosition", "location" => 0, "format" => "vec3"],
            ["name" => "aTexCoord", "location" => 1, "format" => "vec2"],
        ],
        "ubos" => [
            ["name" => "Matrices", "set" => 0, "binding" => 0, "size" => 192],
        ],
        "textures" => [],
        "uniforms" => [],
    ],
    "fragment" => [
        "inputs" => [...],
        "ubos" => [],
        "textures" => [
            ["name" => "uTexture", "set" => 0, "binding" => 0],
        ],
        "uniforms" => [],
    ],
]
```

Reflection requires `--with-spirv-cross` at build time.

## Setting Uniforms

For simple uniforms (outside of UBOs):

```php
vio_set_uniform($ctx, "uColor", [1.0, 0.0, 0.0, 1.0]);  // vec4
vio_set_uniform($ctx, "uTime", 3.14);                      // float
vio_set_uniform($ctx, "uEnabled", 1);                      // int
```

For uniform buffer objects (UBOs), use `vio_uniform_buffer()` — see [Buffers](/api/buffers).

## Built-in Shaders

php-vio includes built-in shaders for the 2D renderer and a default 3D shader. These are compiled into the extension and used automatically when no custom shader is specified.

- `shaders/default_shaders.h` — Default 3D vertex/fragment shader
- `shaders/shaders_2d.h` — 2D batch renderer shader

## Tips

- Use `layout(std140)` for uniform blocks — it guarantees consistent memory layout across backends
- Avoid `push_constant` (Vulkan-specific) if you want cross-backend shaders
- Use `binding` qualifiers explicitly — don't rely on auto-assignment
- Test with `vio_shader_reflect()` to verify your shader's interface matches your vertex data
