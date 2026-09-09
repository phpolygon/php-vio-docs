# Buffers & Uniforms

Functions for GPU buffer management (uniform buffers and storage buffers).

## vio_uniform_buffer

```php
VioBuffer|false vio_uniform_buffer(VioContext $context, array $config)
```

Create a uniform buffer object (UBO).

**Config:**

| Key | Type | Required | Description |
|---|---|---|---|
| `size` | int | Yes | Buffer size in bytes |
| `binding` | int | Yes | Binding point (matches `layout(binding=N)` in GLSL) |
| `data` | string | No | Initial data (binary string) |

```php
$buf = vio_uniform_buffer($ctx, [
    "size"    => 64,   // 4x4 float matrix = 64 bytes
    "binding" => 0,
]);
```

## vio_update_buffer

```php
void vio_update_buffer(VioBuffer $buffer, string $data, int $offset = 0)
```

Update buffer contents with binary data.

```php
// Pack a 4x4 identity matrix
$identity = pack("f16",
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
);
vio_update_buffer($buf, $identity);

// Partial update at offset
$color = pack("f4", 1.0, 0.0, 0.0, 1.0);
vio_update_buffer($buf, $color, 64);  // Write at byte 64
```

## vio_bind_buffer

```php
void vio_bind_buffer(VioContext $context, VioBuffer $buffer, int $binding = -1)
```

Bind a buffer to its binding point. If `$binding` is `-1`, uses the binding specified at creation.

## Vertex-stage storage buffers (readback-free instancing)

A compute-written storage buffer can be bound directly to the **graphics**
pipeline so a vertex shader reads per-instance data via `gl_InstanceIndex` — no
GPU→CPU readback. Gate on `vio_supports_feature($ctx, VIO_FEATURE_VERTEX_STORAGE)`
(true on OpenGL ≥ 4.3, D3D11, D3D12; false on backends without a vertex storage
path, where callers fall back to `vio_storage_buffer_read()` + `vio_draw_instanced()`).

### vio_bind_storage_buffer

```php
void vio_bind_storage_buffer(VioContext $context, VioBuffer $buffer, int $binding, int $access)
```

Bind a storage buffer to the graphics pipeline at storage-buffer `$binding`,
readable from the vertex stage. `$access` is `VIO_COMPUTE_READ`. Call between
`vio_bind_pipeline()` and `vio_draw_instanced_from_buffer()`. No-op when the
backend lacks `VIO_FEATURE_VERTEX_STORAGE`.

### vio_draw_instanced_from_buffer

```php
void vio_draw_instanced_from_buffer(VioContext $context, VioMesh $mesh, int $instanceCount)
```

Instanced draw whose per-instance data comes from the storage buffer bound via
`vio_bind_storage_buffer()`, not a per-instance CPU buffer. The vertex shader
indexes the bound buffer via `gl_InstanceIndex`.

```php
// Compute pass writes N model matrices into an SSBO...
vio_compute_bind_buffer($ctx, $pipe, $matrixBuf, 0, VIO_COMPUTE_WRITE);
vio_compute_dispatch($ctx, $pipe, $groups, 1, 1);

// ...then the graphics pass reads them straight from the buffer — no readback.
vio_bind_pipeline($ctx, $gfxPipe);
vio_bind_storage_buffer($ctx, $matrixBuf, 0, VIO_COMPUTE_READ);
vio_draw_instanced_from_buffer($ctx, $mesh, $n);

// Vertex shader:
//   layout(std430, binding = 0) readonly buffer Instances { mat4 models[]; };
//   void main() { gl_Position = u_vp * models[gl_InstanceIndex] * vec4(aPos, 1.0); }
```

## Buffer Type Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_BUFFER_VERTEX` | 0 | Vertex buffer |
| `VIO_BUFFER_INDEX` | 1 | Index buffer |
| `VIO_BUFFER_UNIFORM` | 2 | Uniform buffer |
| `VIO_BUFFER_STORAGE` | 3 | Storage buffer |

## Example: MVP Matrix

```php
// Create UBO for projection * view * model matrices
$mvpBuffer = vio_uniform_buffer($ctx, [
    "size"    => 192,  // 3 * 64 bytes
    "binding" => 0,
]);

// GLSL side:
// layout(std140, binding=0) uniform MVP {
//     mat4 projection;
//     mat4 view;
//     mat4 model;
// };

// Update each frame
$data = pack("f48",
    // projection (16 floats)
    ...$projectionMatrix,
    // view (16 floats)
    ...$viewMatrix,
    // model (16 floats)
    ...$modelMatrix
);
vio_update_buffer($mvpBuffer, $data);
vio_bind_buffer($ctx, $mvpBuffer);
```
