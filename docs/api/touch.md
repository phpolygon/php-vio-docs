# Touch

Multi-touch input. Touches come from the platform layer on iOS / iPadOS; desktop platforms
(Windows, macOS, Linux) have no touch surface, so the count stays 0 there unless a test injects
touches with [`vio_touch_inject()`](#vio-touch-inject).

Phase values are the `VIO_TOUCH_*` constants ([Constants → Touch Phases](/api/constants#touch-phases)).

## vio_touch_count

```php
int vio_touch_count(VioContext $context)
```

Number of active touches this frame. Always `0` on platforms without a touch surface, unless
touches were injected.

## vio_touch_get

```php
?array vio_touch_get(VioContext $context, int $index)
```

The active touch at compacted index `$index` (`0 .. vio_touch_count() - 1`), or `null` when the
index is out of range.

**Returns** `['id' => int, 'x' => float, 'y' => float, 'phase' => int, 'delta_x' => float, 'delta_y' => float]`.

Active touches are returned in slot order with inactive slots skipped: the index is stable within
one frame but **not** across frames – track a finger by its `id`.

```php
for ($i = 0, $n = vio_touch_count($ctx); $i < $n; $i++) {
    $t = vio_touch_get($ctx, $i);
    if ($t['phase'] === VIO_TOUCH_BEGAN) {
        $fingers[$t['id']] = [$t['x'], $t['y']];
    }
}
```

## vio_touch_inject

```php
bool vio_touch_inject(VioContext $context, int $id, int $phase, float $x = 0.0, float $y = 0.0)
```

Inject a synthetic touch event – for tests and headless replays; real touch events come from
the platform layer.

- `$id` – Touch identifier
- `$phase` – `VIO_TOUCH_BEGAN`, `VIO_TOUCH_MOVED`, `VIO_TOUCH_ENDED` or `VIO_TOUCH_CANCELLED`
- `$x`, `$y` – Position in framebuffer pixels (the same space as the cursor)

Returns `true` on success, `false` when the touch table is full (on `BEGAN`) or the phase is
unknown.

```php
vio_touch_inject($ctx, 7, VIO_TOUCH_BEGAN, 10.0, 20.0);
var_dump(vio_touch_count($ctx));            // int(1)
var_dump(vio_touch_get($ctx, 0)['id']);     // int(7)
vio_touch_inject($ctx, 7, VIO_TOUCH_ENDED);
```

Injected touches are recorded by [input recording](/api/input-recording) like real ones.
