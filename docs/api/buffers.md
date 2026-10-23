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

Calling it every frame is cheap on every backend: Vulkan and Metal write host-visible memory directly, D3D12 (since v2.36.1) stages the bytes in a persistently mapped upload ring and copies them in one batch per frame instead of creating and submitting a staging buffer per call (RTX 2080: ~0.45 ms → ~3 µs per call). The new contents are visible to every draw and dispatch submitted after the call; several updates of one buffer land in call order.

::: tip
On Vulkan and Metal the write lands immediately. Do not rewrite a buffer that an earlier, still in-flight frame reads – use one buffer per frame in flight (or per frame) for data that changes every frame.
:::

## vio_bind_buffer


```php
void vio_bind_buffer(VioContext $context, VioBuffer $buffer, int $binding = -1)
```

Bind a buffer to a binding point (0–15). If `$binding` is `-1`, the binding given at creation is used.

A uniform buffer feeds the named uniform block declared at that binding (`layout(std140, binding = N) uniform Block { ... }`) in every stage of the bound graphics shader, on every backend. Each draw reads the contents as of that draw, so `vio_update_buffer()` between two draws gives them different values.

## Vertex-stage storage buffers (readback-free instancing)

A compute-written storage buffer can be bound directly to the **graphics**
pipeline so a vertex shader reads per-instance data via `gl_InstanceIndex` – no
GPU→CPU readback. Gate on `vio_supports_feature($ctx, VIO_FEATURE_VERTEX_STORAGE)`
(OpenGL ≥ 4.3, D3D11, D3D12, Vulkan and Metal; where it is false, callers fall back to
`vio_storage_buffer_read()` + `vio_draw_instanced()`).

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

// ...then the graphics pass reads them straight from the buffer – no readback.
vio_bind_pipeline($ctx, $gfxPipe);
vio_bind_storage_buffer($ctx, $matrixBuf, 0, VIO_COMPUTE_READ);
vio_draw_instanced_from_buffer($ctx, $mesh, $n);

// Vertex shader:
//   layout(std430, binding = 0) readonly buffer Instances { mat4 models[]; };
//   void main() { gl_Position = u_vp * models[gl_InstanceIndex] * vec4(aPos, 1.0); }
```

## vio_bind_fragment_storage_buffer

```php
bool vio_bind_fragment_storage_buffer(VioContext $context, ?VioBuffer $buffer, int $binding)
```

A writable storage buffer for the **fragment** stage: `$buffer` (from `vio_storage_buffer()`) at the
fragment shader's `layout(std430, binding = $binding) buffer` block (0–3; writes and atomics), for
every following draw until changed; `null` unbinds. `vio_storage_buffer_read()` waits for the draws
that wrote it (mid-frame: the frame so far). The context keeps a reference. On D3D the block is a
`RWByteAddressBuffer` at `u($binding + 4)`.

Returns `false` with a warning without `VIO_FEATURE_FRAGMENT_STORAGE` (OpenGL ≥ 4.3, D3D11, D3D12,
Vulkan with `fragmentStoresAndAtomics`, Metal).

```php
$fs = "#version 450\nlayout(location = 0) out vec4 o;\n"
    . "layout(std430, binding = 0) buffer Counter { uint covered; };\n"
    . "void main() { atomicAdd(covered, 1u); o = vec4(1.0); }";
$counter = vio_storage_buffer($ctx, ['size' => 4]);

vio_begin($ctx);
vio_bind_pipeline($ctx, $pipe);
vio_bind_fragment_storage_buffer($ctx, $counter, 0);
vio_draw($ctx, $mesh);
vio_bind_fragment_storage_buffer($ctx, null, 0);
vio_end($ctx);

$pixels = unpack('V', vio_storage_buffer_read($ctx, $counter))[1];   // fragments shaded
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
