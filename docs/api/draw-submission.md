# Batches, Bundles & Indirect Draws

Three ways to cut the CPU cost of submitting many draws:

- **`vio_submit_batch()`** – an ordered list of draws in a single PHP → C call.
- **Bundles** – record a static draw sequence once and play it every frame; backends with a native
  recording replay the recorded commands.
- **Indirect draws** – the draw arguments live in a GPU buffer, typically written by a compute pass
  (GPU culling, LOD selection).

## vio_submit_batch

```php
void vio_submit_batch(VioContext $context, array $draws)
```

Record an ordered list of draws in one call. Each element is:

```php
[
    'mesh'     => VioMesh,                 // required
    'pipeline' => VioPipeline,             // optional; bound only when it changes
    'textures' => [slot => VioTexture],    // optional
    'uniforms' => ['u_name' => value],     // optional; per-draw uniform deltas
]
```

Records are applied strictly in array order, so the bound shader's uniform state ends up
byte-identical to calling `vio_bind_pipeline()` / `vio_bind_texture()` / `vio_set_uniforms()` /
`vio_draw()` per draw. Must be called between `vio_begin()` and `vio_end()`. Available on every
backend with a 3D pipeline.

```php
$draws = [];
foreach ($objects as $o) {
    $draws[] = ['mesh' => $o->mesh, 'pipeline' => $lit, 'textures' => [0 => $o->albedo],
                'uniforms' => ['u_model' => $o->matrix]];
}
vio_begin($ctx);
vio_submit_batch($ctx, $draws);
vio_end($ctx);
```

## vio_bundle

```php
VioBundle|false vio_bundle(VioContext $context, array $records)
```

Record a static draw sequence once. `$records` use the format of
[`vio_submit_batch()`](#vio-submit-batch) (`'mesh'` required; `'pipeline'`, `'textures'`,
`'uniforms'` optional); the bundle holds references to the objects.

A record must set every uniform it relies on: values no record sets are undefined when the bundle
plays, and uniforms set between recording and `vio_draw_bundle()` do not change it. A malformed
record throws a `ValueError` naming its index.

## vio_draw_bundle

```php
bool vio_draw_bundle(VioContext $context, VioBundle $bundle)
```

Play a bundle inside a frame, into the pass that is open now (swapchain or render target). Returns
`false` outside a frame. The pipeline bound afterwards is undefined – bind one before the next draw.

Backends with a native recording record the bundle for the pass's attachment formats on first use
(a pass with a different attachment signature records again); the others replay the records
through the common draw path:

| Backend | `method` |
|---|---|
| OpenGL, Metal | `'replay'` |
| D3D11 | `'deferred_context'` (deferred context → command list) |
| D3D12 | `'bundle'` (bundle command list) |
| Vulkan | `'secondary_command_buffer'` |

What a native recording cannot carry falls back to replaying (Vulkan: a shading-rate image, a
different view count; D3D12: multiview, per-primitive shading rate, sampler feedback, a
shading-rate image).

## vio_bundle_info

```php
array vio_bundle_info(VioBundle $bundle)
```

`['draws' => int, 'native' => bool, 'method' => string]`. `native` becomes `true` after the first
`vio_draw_bundle()` on a backend that records natively; `method` is one of the values above.

```php
$static = vio_bundle($ctx, $draws);          // once, at load time

vio_begin($ctx);
vio_draw_bundle($ctx, $static);              // every frame
vio_bind_pipeline($ctx, $ui);                // re-bind before further draws
vio_end($ctx);

print_r(vio_bundle_info($static));           // ['draws' => 2000, 'native' => true, 'method' => 'bundle'] on D3D12
```

## vio_draw_indirect

```php
void vio_draw_indirect(VioContext $context, VioMesh $mesh, VioBuffer $args, int $maxDraws = 1, int $offset = 0)
```

Draw `$mesh` with arguments read from a storage buffer. `$maxDraws` consecutive records starting
at `$offset` bytes are issued; a record with `instanceCount` 0 draws nothing.

| Mesh | Record (uint32) | Stride |
|---|---|---|
| Indexed | `{indexCount, instanceCount, firstIndex, baseVertex, firstInstance}` | 20 bytes |
| Not indexed | `{vertexCount, instanceCount, firstVertex, firstInstance}` | 16 bytes |

Create the buffer with `vio_storage_buffer(['indirect' => true, …])` (D3D11 needs the flag).
Per-instance data comes from [`vio_bind_storage_buffer()`](/api/buffers#vio-bind-storage-buffer).

Requires `VIO_FEATURE_INDIRECT_DRAW`: OpenGL ≥ 4.0, D3D11, D3D12 (`ExecuteIndirect`), Vulkan and
Metal.

```php
// two records of a 36-index mesh; a culling kernel writes their instanceCount (word 1)
$args = vio_storage_buffer($ctx, ['data' => pack('V*', 36, 0, 0, 0, 0,   36, 0, 0, 0, 0), 'indirect' => true]);
vio_compute_bind_buffer($ctx, $cull, $args, 0, VIO_COMPUTE_WRITE);
vio_compute_dispatch($ctx, $cull, $groups, 1, 1);

vio_begin($ctx);
vio_bind_pipeline($ctx, $pipe);
vio_bind_storage_buffer($ctx, $instances, 3, VIO_COMPUTE_READ);
vio_draw_indirect($ctx, $mesh, $args, 2);
vio_end($ctx);
```
