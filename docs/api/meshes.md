# Meshes

Functions for creating and drawing 3D geometry.

## vio_mesh

```php
VioMesh|false vio_mesh(VioContext $context, array $config)
```

Create a mesh from vertex data.

**Config:**

| Key | Type | Required | Description |
|---|---|---|---|
| `vertices` | float[] | Yes | Flat array of vertex data |
| `layout` | array | Yes | Vertex attribute layout |
| `indices` | int[] | No | Index buffer data |
| `topology` | int | No | Primitive topology (default: `VIO_TRIANGLES`) |

### Layout Format

**Simple** — auto-assigned locations starting at 0:

```php
"layout" => [VIO_FLOAT3, VIO_FLOAT2, VIO_FLOAT3]
// location 0: vec3 (12 bytes)
// location 1: vec2 (8 bytes)
// location 2: vec3 (12 bytes)
```

**Explicit** — specify locations manually:

```php
"layout" => [
    ["location" => 0, "components" => 3],
    ["location" => 2, "components" => 2],
]
```

### Vertex Format Constants

| Constant | Components | Size |
|---|---|---|
| `VIO_FLOAT1` | 1 float | 4 bytes |
| `VIO_FLOAT2` | 2 floats | 8 bytes |
| `VIO_FLOAT3` | 3 floats | 12 bytes |
| `VIO_FLOAT4` | 4 floats | 16 bytes |
| `VIO_INT1` | 1 int | 4 bytes |
| `VIO_INT2` | 2 ints | 8 bytes |
| `VIO_INT3` | 3 ints | 12 bytes |
| `VIO_INT4` | 4 ints | 16 bytes |
| `VIO_UINT1` | 1 uint | 4 bytes |
| `VIO_UINT2` | 2 uints | 8 bytes |
| `VIO_UINT3` | 3 uints | 12 bytes |
| `VIO_UINT4` | 4 uints | 16 bytes |

### Topology Constants

| Constant | Description |
|---|---|
| `VIO_TRIANGLES` | Every 3 vertices form a triangle |
| `VIO_TRIANGLE_STRIP` | Each new vertex forms a triangle with previous two |
| `VIO_TRIANGLE_FAN` | Triangles share the first vertex |
| `VIO_LINES` | Every 2 vertices form a line |
| `VIO_LINE_STRIP` | Connected line segments |
| `VIO_POINTS` | Individual points |

## vio_draw

```php
void vio_draw(VioContext $context, VioMesh $mesh)
```

Draw a mesh using the currently bound pipeline.

## vio_draw_instanced

```php
void vio_draw_instanced(VioContext $context, VioMesh $mesh, float[] $matrices, int $instanceCount)
```

Draw a mesh multiple times with per-instance model matrices.

- `$matrices` — Flat array of `4x4` matrices (16 floats per instance)
- `$instanceCount` — Number of instances to draw

```php
$matrices = [];
for ($i = 0; $i < 100; $i++) {
    // Identity matrix translated by ($i * 2, 0, 0)
    array_push($matrices,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        $i * 2, 0, 0, 1
    );
}
vio_draw_instanced($ctx, $mesh, $matrices, 100);
```

## vio_draw_3d

```php
void vio_draw_3d(VioContext $context)
```

Flush/finalize 3D draw calls for the current frame.
