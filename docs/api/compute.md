# Compute

GPU compute: storage buffers, storage images, dispatch (synchronous or recorded into the
frame) and the readback-free path from a compute-written buffer into the vertex stage.

Gate with `vio_supports_feature($ctx, VIO_FEATURE_COMPUTE)` — OpenGL ≥ 4.3 (never on macOS),
D3D11, D3D12, Vulkan and Metal report it. Storage images additionally need
`VIO_FEATURE_STORAGE_IMAGE`, the vertex-stage path `VIO_FEATURE_VERTEX_STORAGE`.

## vio_compute_pipeline

```php
VioComputePipeline|false vio_compute_pipeline(VioContext $context, array $config)
```

| Key | Type | Description |
|---|---|---|
| `source` | string | GLSL compute shader (`#version 450`). `local_size_*` is read from the reflection and defines the dispatch geometry |

```php
$cp = vio_compute_pipeline($ctx, ["source" => <<<'GLSL'
#version 450
layout(local_size_x = 64) in;
layout(std430, binding = 0) readonly  buffer In  { float a[]; };
layout(std430, binding = 1) writeonly buffer Out { float b[]; };
layout(std140, binding = 2) uniform Params { int count; float scale; int p0; int p1; };
void main() {
    uint i = gl_GlobalInvocationID.x;
    if (i >= uint(count)) return;
    b[i] = a[i] * scale;
}
GLSL]);
```

The params uniform block is always `binding = 2`; storage buffers and images use their GLSL
`binding` as the slot number.

## vio_storage_buffer

```php
VioBuffer|false vio_storage_buffer(VioContext $context, array $config)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `size` | int | required | Size in bytes |
| `data` | string | — | Initial contents (input buffers); omitted = zero-filled (output buffers) |
| `stride` | int | `4` | Element stride. Use `4` for raw `float[]`/`int[]` arrays — D3D12 maps other strides to structured buffers |

## vio_compute_bind_buffer

```php
void vio_compute_bind_buffer(VioContext $context, VioComputePipeline $pipeline, VioBuffer $buffer, int $slot, int $access)
```

Bind a storage buffer to SSBO `$slot` with `VIO_COMPUTE_READ` or `VIO_COMPUTE_WRITE`.

## vio_compute_bind_image

```php
void vio_compute_bind_image(VioContext $context, VioComputePipeline $pipeline, VioTexture $texture, int $slot, int $access)
```

Bind a storage image (`vio_texture(['storage' => true, …])` or `vio_texture_3d`) to
`layout(binding = $slot, rgba8) uniform image2D` / `image3D`. After the dispatch the texture is
sampled like any other with `vio_bind_texture()`.

## vio_compute_set_uniforms

```php
void vio_compute_set_uniforms(VioContext $context, VioComputePipeline $pipeline, string $data)
```

Raw bytes for the params block (`binding = 2`), e.g. `pack('l', $n) . pack('f', 0.5) . pack('l2', 0, 0)`.
Respect std140 layout (16-byte alignment for `vec4`/`mat4`).

## vio_compute_dispatch

```php
void vio_compute_dispatch(VioContext $context, VioComputePipeline $pipeline, int $gx, int $gy, int $gz, ?array $options = null)
```

Dispatch `$gx × $gy × $gz` work groups. Synchronous by default (the CPU waits). With
`['async' => true]` inside `vio_begin()`/`vio_end()` the dispatch is recorded into the frame:
no CPU stall, and later draws of the same frame see the result.

```php
vio_begin($ctx);
vio_compute_dispatch($ctx, $cp, intdiv($w + 7, 8), intdiv($h + 7, 8), 1, ['async' => true]);
vio_bind_texture($ctx, $img, 0);   // samples what the kernel just wrote
vio_draw($ctx, $quad);
vio_end($ctx);
```

## vio_compute_wait

```php
void vio_compute_wait(VioContext $context)
```

Explicitly fence pending async dispatches. `vio_storage_buffer_read()` waits implicitly.

## vio_storage_buffer_read

```php
string|false vio_storage_buffer_read(VioContext $context, VioBuffer $buffer)
```

GPU → CPU readback of a storage buffer (`unpack('f*', …)` for floats).

## vio_bind_storage_buffer / vio_draw_instanced_from_buffer

```php
void vio_bind_storage_buffer(VioContext $context, VioBuffer $buffer, int $binding, int $access)
void vio_draw_instanced_from_buffer(VioContext $context, VioMesh $mesh, int $instanceCount)
```

Readback-free instancing: bind a compute-written buffer to the **graphics** pipeline and let the
vertex shader index it with `gl_InstanceIndex`. Call between `vio_bind_pipeline()` and the draw.
Gate on `VIO_FEATURE_VERTEX_STORAGE` (OpenGL ≥ 4.3, D3D11, D3D12, Metal); fall back to
`vio_storage_buffer_read()` + `vio_draw_instanced()` elsewhere.

```glsl
// vertex shader
layout(location = 0) in vec3 aPos;
layout(std430, binding = 0) readonly buffer Instances { mat4 models[]; };
layout(std140, binding = 0) uniform VP { mat4 u_vp; };
void main() { gl_Position = u_vp * models[gl_InstanceIndex] * vec4(aPos, 1.0); }
```

```php
vio_bind_pipeline($ctx, $pipe);
vio_set_uniform($ctx, 'u_vp', $vp);
vio_bind_storage_buffer($ctx, $matrices, 0, VIO_COMPUTE_READ);
vio_draw_instanced_from_buffer($ctx, $mesh, $n);
```

| | |
|---|---|
| ![Compute storage image](/gallery/compute_storage_image.png) | ![Compute vertex storage](/gallery/compute_vertex_storage.png) |
| Kernel writes an `image2D`, the render pass samples it | Kernel writes instance matrices, the vertex stage reads them |
