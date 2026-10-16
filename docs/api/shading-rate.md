# Variable Rate Shading

Variable rate shading (VRS) runs the fragment shader once per block of pixels instead of once per
pixel, while geometry, depth and the resolution stay untouched. Three levels:

| Level | Flag | D3D12 | Vulkan | OpenGL, D3D11, Metal |
|---|---|---|---|---|
| One rate for the following draws (`vio_set_shading_rate()`) | `VIO_FEATURE_SHADING_RATE` | ✅ VRS Tier 1+ | ✅ `VK_KHR_fragment_shading_rate` | ❌ |
| Per primitive (`gl_PrimitiveShadingRateEXT` in the vertex stage) | `VIO_FEATURE_SHADING_RATE_PRIMITIVE` | ✅ Tier 2 + SM 6.4 | ✅ `primitiveFragmentShadingRate` | ❌ |
| Per screen tile (`vio_set_shading_rate_image()`) | `VIO_FEATURE_SHADING_RATE_IMAGE` | ✅ Tier 2 | ✅ `attachmentFragmentShadingRate` | ❌ |

Metal has rasterization rate maps instead – a different model, exposed as the `'rate_map'` option
of render targets ([`vio_render_target_size()`](/api/render-targets#vio-render-target-size)).

Rates are the `VIO_SHADING_RATE_*` constants: `1X1` (full rate, default), `1X2`, `2X1`, `2X2` and
`4X4` ([Constants](/api/constants#variable-rate-shading)).

## vio_set_shading_rate

```php
bool vio_set_shading_rate(VioContext $context, int $rate)
```

Set the shading rate for every following draw. Sticky until changed (re-armed every frame) – set
`VIO_SHADING_RATE_1X1` before UI and post-processing. Returns `false` when the backend has no VRS or
the rate is not offered (`VIO_SHADING_RATE_4X4` needs the device's additional-rates capability).

```php
vio_begin($ctx);
vio_set_shading_rate($ctx, VIO_SHADING_RATE_2X2);   // world at a quarter of the fragment work
drawWorld($ctx);
vio_set_shading_rate($ctx, VIO_SHADING_RATE_1X1);   // UI at full rate
drawUi($ctx);
vio_end($ctx);
```

## vio_set_shading_rate_image

```php
bool vio_set_shading_rate_image(VioContext $context, ?string $rates, int $tilesX = 0, int $tilesY = 0)
```

A shading-rate image: one `VIO_SHADING_RATE_*` byte per screen tile, row by row
(`$tilesX * $tilesY` bytes; the tile edge is `vio_shading_rate_tile_size()`). Each tile shades at the
coarser of its own rate and the set / per-primitive rate (combiner MAX). Sticky across frames like
`vio_set_shading_rate()`; `null` clears it. Returns `false` where the feature is 0 or the bytes do
not match the tile count.

## vio_shading_rate_tile_size

```php
int vio_shading_rate_tile_size(VioContext $context)
```

Edge of one shading-rate image tile in pixels (D3D12: 8, 16 or 32; Vulkan: the device's
minimum attachment texel size); `0` without `VIO_FEATURE_SHADING_RATE_IMAGE`.

```php
$tile = vio_shading_rate_tile_size($ctx);
if ($tile > 0) {
    [$w, $h] = vio_framebuffer_size($ctx);
    $tx = intdiv($w + $tile - 1, $tile);
    $ty = intdiv($h + $tile - 1, $tile);
    $rates = '';
    for ($y = 0; $y < $ty; $y++) {
        for ($x = 0; $x < $tx; $x++) {
            $edge = $x < $tx / 4 || $x >= $tx * 3 / 4;          // coarse at the left and right edges
            $rates .= chr($edge ? VIO_SHADING_RATE_2X2 : VIO_SHADING_RATE_1X1);
        }
    }
    vio_set_shading_rate_image($ctx, $rates, $tx, $ty);
}
```
