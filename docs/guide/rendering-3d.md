# 3D Rendering

php-vio provides a complete 3D rendering pipeline: meshes, shaders, pipelines, uniform buffers, textures, instancing, render targets, and cubemaps.

## Meshes

A mesh is a GPU-resident collection of vertices and optional indices.

```php
$mesh = vio_mesh($ctx, [
    "vertices" => [
        // position (xyz)    color (rgb)
         0.0,  0.5, 0.0,    1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0,    0.0, 1.0, 0.0,
         0.5, -0.5, 0.0,    0.0, 0.0, 1.0,
    ],
    "layout" => [VIO_FLOAT3, VIO_FLOAT3],
    "topology" => VIO_TRIANGLES,
]);
```

### Vertex Layout

The `layout` array defines the vertex attribute format. Each entry maps to a `location` in the shader:

```php
// Simple: auto-assigned locations 0, 1, 2, ...
"layout" => [VIO_FLOAT3, VIO_FLOAT2, VIO_FLOAT3]
// location 0: vec3 (position)
// location 1: vec2 (texcoord)
// location 2: vec3 (normal)

// Explicit: specify location manually
"layout" => [
    ["location" => 0, "components" => 3],  // vec3
    ["location" => 2, "components" => 2],  // vec2
]
```

Available formats: `VIO_FLOAT1` through `VIO_FLOAT4`, `VIO_INT1` through `VIO_INT4`, `VIO_UINT1` through `VIO_UINT4`.

### Indexed Meshes

```php
$mesh = vio_mesh($ctx, [
    "vertices" => [
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         0.5,  0.5, 0.0,
        -0.5,  0.5, 0.0,
    ],
    "indices" => [0, 1, 2, 2, 3, 0],
    "layout" => [VIO_FLOAT3],
    "topology" => VIO_TRIANGLES,
]);
```

### Topology Types

| Constant | Description |
|---|---|
| `VIO_TRIANGLES` | Default. Every 3 vertices form a triangle. |
| `VIO_TRIANGLE_STRIP` | Each new vertex forms a triangle with the previous two. |
| `VIO_TRIANGLE_FAN` | Triangles share the first vertex. |
| `VIO_LINES` | Every 2 vertices form a line segment. |
| `VIO_LINE_STRIP` | Connected line segments. |
| `VIO_POINTS` | Individual points. |

## Shaders

Shaders define how vertices are transformed and pixels are colored.

```php
$shader = vio_shader($ctx, [
    "vertex" => $glsl_vertex_source,
    "fragment" => $glsl_fragment_source,
]);
```

php-vio compiles GLSL to SPIR-V (via glslang), then cross-compiles to the active backend's format. See the [Shaders Guide](/guide/shaders) for details.

## Pipelines

A pipeline combines a shader with render state:

```php
$pipeline = vio_pipeline($ctx, [
    "shader"     => $shader,
    "topology"   => VIO_TRIANGLES,
    "cull_mode"  => VIO_CULL_BACK,
    "depth_test" => true,
    "blend"      => VIO_BLEND_ALPHA,
]);

// Bind before drawing
vio_bind_pipeline($ctx, $pipeline);
vio_draw($ctx, $mesh);
```

### Pipeline Options

| Option | Type | Default | Values |
|---|---|---|---|
| `shader` | VioShader | required | — |
| `topology` | int | `VIO_TRIANGLES` | Any `VIO_*` topology |
| `cull_mode` | int | `VIO_CULL_NONE` | `NONE`, `BACK`, `FRONT` |
| `depth_test` | bool | `false` | — |
| `blend` | int | `VIO_BLEND_NONE` | `NONE`, `ALPHA`, `ADDITIVE` |

## Drawing

```php
// Basic draw
vio_draw($ctx, $mesh);

// Instanced drawing (N copies with different transforms)
$matrices = []; // 16 floats per instance (4x4 matrix)
for ($i = 0; $i < 100; $i++) {
    array_push($matrices,
        1,0,0,0,  0,1,0,0,  0,0,1,0,  $i*2,0,0,1
    );
}
vio_draw_instanced($ctx, $mesh, $matrices, 100);

// Finalize 3D draw calls
vio_draw_3d($ctx);
```

## Textures

```php
// Load from file
$tex = vio_texture($ctx, ["file" => "texture.png"]);

// Create from raw RGBA data
$tex = vio_texture($ctx, [
    "data"   => $rgba_bytes,
    "width"  => 256,
    "height" => 256,
]);

// Bind to texture unit
vio_bind_texture($ctx, $tex, 0);  // unit 0
```

See [Textures API](/api/textures) for filtering, wrapping, mipmaps, and async loading.

## Uniform Buffers

Pass data to shaders via uniform buffers:

```php
$buf = vio_uniform_buffer($ctx, [
    "size"    => 64,
    "binding" => 0,
]);

// Update with packed binary data
$mvp = pack("f16", ...); // 4x4 matrix
vio_update_buffer($buf, $mvp);
vio_bind_buffer($ctx, $buf);
```

## Viewport

```php
vio_viewport($ctx, 0, 0, 800, 600);
```

## Complete Example

```php
<?php
$ctx = vio_create("opengl", [
    "width" => 800, "height" => 600, "title" => "3D Demo",
]);

$mesh = vio_mesh($ctx, [
    "vertices" => [
         0.0,  0.5, 0.0,  1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0,  0.0, 1.0, 0.0,
         0.5, -0.5, 0.0,  0.0, 0.0, 1.0,
    ],
    "layout" => [VIO_FLOAT3, VIO_FLOAT3],
]);

$shader = vio_shader($ctx, [
    "vertex" => "#version 410 core
        layout(location=0) in vec3 pos;
        layout(location=1) in vec3 col;
        out vec3 vCol;
        void main() { gl_Position = vec4(pos, 1.0); vCol = col; }",
    "fragment" => "#version 410 core
        in vec3 vCol;
        out vec4 frag;
        void main() { frag = vec4(vCol, 1.0); }",
]);

$pipeline = vio_pipeline($ctx, [
    "shader" => $shader,
]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.1, 0.1, 0.15, 1.0);
    vio_bind_pipeline($ctx, $pipeline);
    vio_draw($ctx, $mesh);
    vio_end($ctx);
    vio_poll_events($ctx);
}

vio_destroy($ctx);
```
