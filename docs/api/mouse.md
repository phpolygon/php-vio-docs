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

Simulate cursor movement to position `($x, $y)`.

## vio_inject_mouse_button

```php
void vio_inject_mouse_button(VioContext $context, int $button, int $action)
```

Simulate a mouse button press/release.

- `$button` — `VIO_MOUSE_LEFT`, `VIO_MOUSE_RIGHT`, or `VIO_MOUSE_MIDDLE`
- `$action` — `VIO_PRESS` or `VIO_RELEASE`

## vio_on_resize

```php
void vio_on_resize(VioContext $context, callable $callback)
```

Register a window resize callback.

**Callback signature:**
```php
function(int $width, int $height): void
```
