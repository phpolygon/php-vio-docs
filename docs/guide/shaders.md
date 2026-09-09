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
    "vertex" => "#version 450
        layout(location=0) in vec3 aPosition;
        layout(location=1) in vec2 aTexCoord;

        layout(std140, binding=0) uniform Matrices {
            mat4 uProjection;
            mat4 uView;
            mat4 uModel;
        };

        layout(location=0) out vec2 vTexCoord;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
            vTexCoord = aTexCoord;
        }
    ",
    "fragment" => "#version 450
        layout(location=0) in vec2 vTexCoord;
        layout(binding=1) uniform sampler2D uTexture;
        layout(location=0) out vec4 fragColor;

        void main() {
            fragColor = texture(uTexture, vTexCoord);
        }
    ",
]);
```

Conventions that keep one source portable across all backends:

- `#version 450` — the GLSL dialect glslang compiles to SPIR-V; php-vio then emits the backend's native language.
- `layout(location = n)` on vertex inputs, on the varyings between stages and on fragment outputs (`location = i` selects the colour attachment with [multiple render targets](/api/render-targets)).
- Uniforms either in a `layout(std140, binding = 0) uniform Block { … }` block or as plain `uniform mat4 u_mvp;` — both are written with [`vio_set_uniform()`](#setting-uniforms) by member name on every backend (php-vio 2.10.1+ on OpenGL). Binding 0 is the root constant buffer on Direct3D 12. Prefer the block form for large struct arrays (Metal packs them std140 only inside a block).
- Samplers: bind the texture to a unit with `vio_bind_texture($ctx, $tex, n)` and tell the shader which unit with `vio_set_uniform($ctx, 'uTexture', n)` — the classic OpenGL convention, and the one D3D/Metal resolve at draw time. A `layout(binding = n)` qualifier is optional and does **not** select the unit on D3D/Metal; without a `vio_set_uniform()` call a sampler reads unit 0. One unit holds one sampler (2D, 3D or cube).
- Compute shaders declare `layout(local_size_x = …)`; their params block lives at `binding = 2` (see [Compute](/api/compute)).

Missing `location` / `binding` qualifiers are auto-assigned by glslang, so older `#version 330 core` sources compile too — but explicit numbers are what make the reflection, `vio_bind_texture()` slots and MRT outputs predictable.

Feeding that shader from PHP:

```php
vio_bind_pipeline($ctx, $pipeline);
vio_set_uniform($ctx, 'uProjection', $proj);   // block members by name, 16 floats each
vio_set_uniform($ctx, 'uView', $view);
vio_set_uniform($ctx, 'uModel', $model);
vio_bind_texture($ctx, $texture, 1);           // unit 1 …
vio_set_uniform($ctx, 'uTexture', 1);          // … is what the sampler reads
vio_draw($ctx, $mesh);
```

## Compilation Pipeline

When `format` is `VIO_SHADER_GLSL` (the default):

```
GLSL source
  → glslang → SPIR-V binary
    → SPIRV-Cross → Backend-native format
      OpenGL: GLSL matching the context (330 … 460)
      Metal:  MSL
      Vulkan: SPIR-V (passthrough)
      D3D11:  HLSL → D3DCompile → DXBC (SM 5.0)
      D3D12:  HLSL → D3DCompile → DXBC (SM 5.1)
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
Raw GLSL shaders only work with the OpenGL backend. They cannot be cross-compiled to Vulkan, Metal, or DirectX.
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

`vio_set_uniform()` writes a value by name — plain uniforms and members of `uniform Block { … }` blocks alike, in any stage. Arrays are set per element (`uBones[3]`, `u_lights[2].pos`); a `mat4` is 16 floats, column-major.

```php
vio_set_uniform($ctx, "uColor", [1.0, 0.0, 0.0, 1.0]);  // vec4
vio_set_uniform($ctx, "uTime", 3.14);                      // float
vio_set_uniform($ctx, "uEnabled", 1);                      // int
vio_set_uniform($ctx, "uModel", $mat4);                    // 16 floats
vio_set_uniform($ctx, "uBones[2]", $mat4);                 // array element
vio_set_uniforms($ctx, ["uTime" => 3.14, "uColor" => [1, 1, 1, 1]]);
```

Values are staged and pushed right before the draw, so the order of `vio_set_uniform()` / `vio_bind_texture()` / `vio_bind_pipeline()` calls does not matter within a frame.

::: warning Direct UBO binding is not portable yet
`vio_uniform_buffer()` + `vio_bind_buffer()` currently feed a graphics shader's block on D3D11 only: OpenGL flattens blocks into plain uniforms (nothing to bind) and D3D12 overwrites the root constant buffer with the shader's staged uniforms at draw time (Metal uses the same staging model). Use `vio_set_uniform()` for graphics shaders; uniform buffers remain useful as compute params via [`vio_compute_set_uniforms()`](/api/compute).
:::

## Built-in Shaders

php-vio includes built-in shaders for the 2D renderer and a default 3D shader. These are compiled into the extension and used automatically when no custom shader is specified.

- `shaders/default_shaders.h` — Default 3D vertex/fragment shader
- `shaders/shaders_2d.h` — 2D batch renderer shader

## Tips

- Use `layout(std140)` for uniform blocks — it guarantees consistent memory layout across backends
- Avoid `push_constant` (Vulkan-specific) if you want cross-backend shaders
- Use `binding` / `location` qualifiers explicitly — don't rely on auto-assignment
- Render-target textures are row 0 = bottom on OpenGL and row 0 = top on D3D/Metal — flip V when sampling an offscreen target on those backends (see [Render Targets → Orientation](/api/render-targets#orientation))
- A shader can bind up to **8** regular texture samplers (2D, 3D, cubemap) in addition to the dedicated shadow/depth samplers — keep within that budget for cross-backend portability
- Test with `vio_shader_reflect()` to verify your shader's interface matches your vertex data
