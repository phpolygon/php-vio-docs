# Mouse

Functions for mouse input: position, buttons, scroll, and injection.

## vio_mouse_position

```php
array{0: float, 1: float} vio_mouse_position(VioContext $context)
```

Returns `[x, y]` cursor position in window coordinates.

## vio_mouse_delta

```php
array{0: float, 1: float} vio_mouse_delta(VioContext $context)
```

Returns `[dx, dy]` cursor movement since the last frame.

## vio_mouse_button

```php
bool vio_mouse_button(VioContext $context, int $button)
```

Returns `true` if the mouse button is currently pressed.

**Button constants:**

| Constant | Button |
|---|---|
| `VIO_MOUSE_LEFT` | Left click (0) |
| `VIO_MOUSE_RIGHT` | Right click (1) |
| `VIO_MOUSE_MIDDLE` | Middle click / wheel (2) |

## vio_mouse_scroll

```php
array{0: float, 1: float} vio_mouse_scroll(VioContext $context)
```

Returns `[scrollX, scrollY]` scroll delta since last frame. Positive Y = scroll up.

## vio_inject_mouse_move

```php
void vio_inject_mouse_move(VioContext $context, float $x, float $y)
```

Simulate cursor movement to position `($x, $y)`. Coordinates are raw cursor coordinates as the OS
reports them and go through the same conversion as a real pointer: headless that conversion is
1:1, so `vio_mouse_position()` returns exactly what was injected; on a windowed context on a scaled
desktop `vio_mouse_position()` divides by the scale (see `vio_content_scale()`).
`vio_mouse_delta()` is measured against the position at the last `vio_begin()`.

## vio_inject_mouse_button

```php
void vio_inject_mouse_button(VioContext $context, int $button, int $action)
```

Simulate a mouse button press/release.

- `$button` – `VIO_MOUSE_LEFT`, `VIO_MOUSE_RIGHT`, or `VIO_MOUSE_MIDDLE`
- `$action` – `VIO_PRESS` or `VIO_RELEASE` (`VIO_REPEAT` counts as held; anything else throws a `ValueError`)

## vio_inject_scroll

```php
void vio_inject_scroll(VioContext $context, float $dx, float $dy)
```

Inject a simulated scroll-wheel event. It accumulates into `vio_mouse_scroll()` the way wheel
events do; `vio_begin()` resets the scroll to zero, so inject before the game reads scroll for the
frame.

```php
vio_inject_scroll($ctx, 0.0, -1.0);    // one notch down
[$sx, $sy] = vio_mouse_scroll($ctx);   // [0.0, -1.0] until the next vio_begin()
```

## vio_set_cursor_mode

```php
void vio_set_cursor_mode(VioContext $context, int $mode)
```

Set the cursor mode of the context's window.

| Mode | Value | Effect |
|---|---|---|
| `VIO_CURSOR_NORMAL` | 0 | Visible, free cursor |
| `VIO_CURSOR_DISABLED` | 1 | Hides the cursor, confines it and enables raw mouse motion – for first-person controls (read `vio_mouse_delta()`) |
| `VIO_CURSOR_HIDDEN` | 2 | Hides the cursor |

```php
vio_set_cursor_mode($ctx, VIO_CURSOR_DISABLED);   // mouse look
[$dx, $dy] = vio_mouse_delta($ctx);
```

## vio_on_resize

```php
void vio_on_resize(VioContext $context, callable $callback)
```

Register a window resize callback.

**Callback signature:**
```php
function(int $width, int $height): void
```
