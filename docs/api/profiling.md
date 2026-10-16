# GPU Profiling

GPU time per frame and per named section of a frame, measured with the backend's timestamp
queries: D3D11 / D3D12 timestamp queries, `GL_TIMESTAMP` (OpenGL ≥ 3.3), `vkCmdWriteTimestamp`
(Vulkan) and the command buffers' `GPUStartTime` / `GPUEndTime` (Metal). Gate:
`VIO_FEATURE_GPU_TIMESTAMP`.

Results trail the CPU by one to two frames – the GPU has to finish a frame before its times can
be read.

For CPU-side diagnostics of the presentation path and the shader cache see
[`vio_swapchain_info()`](/api/backend#vio-swapchain-info) and
[`vio_shader_cache_stats()`](/api/backend#vio-shader-cache-stats).

## vio_gpu_frame_time

```php
float vio_gpu_frame_time(VioContext $context)
```

GPU time of the most recently completed frame in milliseconds – the span between the frame's
first and last GPU command. `-1.0` when the backend has no timestamps or no frame has finished yet.

## vio_gpu_timestamp

```php
bool vio_gpu_timestamp(VioContext $context, string $name)
```

Place a named GPU timestamp inside the open frame. It closes a section that began at the previous
`vio_gpu_timestamp()` of the frame, or at `vio_begin()`.

- `$name` – 1 to 47 bytes (`ValueError` otherwise). A name used twice in one frame adds up.

Up to 32 marks per frame. Returns `false` outside a frame, past the limit, or when the backend has
no GPU timestamps.

On Metal a mark closes the command buffer of the section and continues on a new one (with load
actions).

## vio_gpu_timings

```php
array|false vio_gpu_timings(VioContext $context)
```

GPU milliseconds of each named section of the most recently completed frame, in mark order, e.g.
`['shadows' => 1.8, 'main' => 4.2]`. `[]` until such a frame has completed, `false` when the
backend has no GPU timestamps.

## Example

```php
while (!vio_should_close($ctx)) {
    vio_poll_events($ctx);
    vio_begin($ctx);
    renderShadows($ctx);   vio_gpu_timestamp($ctx, 'shadows');
    renderScene($ctx);     vio_gpu_timestamp($ctx, 'main');
    renderPost($ctx);      vio_gpu_timestamp($ctx, 'post');
    vio_end($ctx);

    $frame   = vio_gpu_frame_time($ctx);        // -1.0 for the first frames
    $timings = vio_gpu_timings($ctx) ?: [];     // ['shadows' => …, 'main' => …, 'post' => …]
}
```
