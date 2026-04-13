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
