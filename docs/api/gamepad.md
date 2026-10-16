# Gamepad

Functions for gamepad/controller input.

## vio_gamepads

```php
int[] vio_gamepads()
```

Returns an array of connected gamepad IDs (0-15).

## vio_gamepad_connected

```php
bool vio_gamepad_connected(int $id)
```

Check if a specific gamepad is connected.

## vio_gamepad_name

```php
?string vio_gamepad_name(int $id)
```

Returns the gamepad name or `null` if not connected.

## vio_gamepad_buttons

```php
bool[] vio_gamepad_buttons(int $id)
```

Returns an array of button states indexed by `VIO_GAMEPAD_*` constants.

## vio_gamepad_axes

```php
float[] vio_gamepad_axes(int $id)
```

Returns an array of axis values (`-1.0` to `1.0`) indexed by `VIO_GAMEPAD_AXIS_*` constants.

## vio_gamepad_triggers

```php
array{left: float, right: float} vio_gamepad_triggers(int $id)
```

Returns left and right trigger values (`0.0` to `1.0`).

## Virtual Gamepads

Virtual pads drive every gamepad reader from code – for tests, bots and
[input replays](/api/input-recording). Gamepads are process-wide, like the readers above, so these
functions take no context. They work on every platform (no GPU or window needed).

### vio_virtual_gamepad_connect

```php
void vio_virtual_gamepad_connect(int $id, string $name = "Virtual Gamepad")
```

Connect a virtual gamepad in slot `$id` (0–15), or reset the one already there. While a virtual
pad occupies a slot it replaces the physical joystick with that id for every reader:
`vio_gamepads()`, `vio_gamepad_connected()`, `_name()`, `_buttons()`, `_axes()` and `_triggers()`.
It starts with every button released, the sticks centred and the triggers at `-1.0` (released,
GLFW convention). Virtual pads end with the request.

### vio_virtual_gamepad_disconnect

```php
void vio_virtual_gamepad_disconnect(int $id)
```

Disconnect the virtual gamepad in slot `$id`; a physical pad with that id shows again.

### vio_inject_gamepad_button

```php
void vio_inject_gamepad_button(int $id, int $button, int $action)
```

Press or release a button of a virtual gamepad.

- `$button` – `VIO_GAMEPAD_*` constant
- `$action` – `VIO_PRESS` or `VIO_RELEASE` (`VIO_REPEAT` counts as pressed)

Throws an `Error` when no virtual gamepad is connected in slot `$id`.

### vio_inject_gamepad_axis

```php
void vio_inject_gamepad_axis(int $id, int $axis, float $value)
```

Set an axis of a virtual gamepad. The value is clamped to `[-1.0, 1.0]`; triggers use `-1.0` for
released and `1.0` for fully pressed.

- `$axis` – `VIO_GAMEPAD_AXIS_*` constant (anything else throws a `ValueError`)

Throws an `Error` when no virtual gamepad is connected in slot `$id`.

```php
vio_virtual_gamepad_connect(0, 'Bot Pad');
vio_inject_gamepad_button(0, VIO_GAMEPAD_A, VIO_PRESS);
vio_inject_gamepad_axis(0, VIO_GAMEPAD_AXIS_LEFT_X, 0.5);

var_dump(vio_gamepad_name(0));                                // string(7) "Bot Pad"
var_dump(vio_gamepad_buttons(0)[VIO_GAMEPAD_A]);              // bool(true)
var_dump(vio_gamepad_axes(0)[VIO_GAMEPAD_AXIS_LEFT_X]);       // float(0.5)

vio_virtual_gamepad_disconnect(0);
```