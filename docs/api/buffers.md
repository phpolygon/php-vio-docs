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
