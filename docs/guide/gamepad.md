# Gamepad

php-vio supports gamepad input via GLFW. Up to 16 gamepads can be connected simultaneously.

## Detecting Gamepads

```php
// Get array of connected gamepad IDs
$pads = vio_gamepads();  // e.g. [0, 1]

// Check specific gamepad
if (vio_gamepad_connected(0)) {
    $name = vio_gamepad_name(0);  // e.g. "Xbox Wireless Controller"
}
```

## Buttons

```php
$buttons = vio_gamepad_buttons(0);

if ($buttons[VIO_GAMEPAD_A]) {
    jump();
}
if ($buttons[VIO_GAMEPAD_START]) {
    pauseMenu();
}
```

### Button Constants

| Constant | Xbox | PlayStation |
|---|---|---|
| `VIO_GAMEPAD_A` | A | Cross |
| `VIO_GAMEPAD_B` | B | Circle |
| `VIO_GAMEPAD_X` | X | Square |
| `VIO_GAMEPAD_Y` | Y | Triangle |
| `VIO_GAMEPAD_LEFT_BUMPER` | LB | L1 |
| `VIO_GAMEPAD_RIGHT_BUMPER` | RB | R1 |
| `VIO_GAMEPAD_BACK` | Back / View | Select |
| `VIO_GAMEPAD_START` | Start / Menu | Start |
| `VIO_GAMEPAD_GUIDE` | Xbox button | PS button |
| `VIO_GAMEPAD_LEFT_THUMB` | LS click | L3 |
| `VIO_GAMEPAD_RIGHT_THUMB` | RS click | R3 |
| `VIO_GAMEPAD_DPAD_UP` | D-pad up | D-pad up |
| `VIO_GAMEPAD_DPAD_RIGHT` | D-pad right | D-pad right |
| `VIO_GAMEPAD_DPAD_DOWN` | D-pad down | D-pad down |
| `VIO_GAMEPAD_DPAD_LEFT` | D-pad left | D-pad left |

## Axes

```php
$axes = vio_gamepad_axes(0);

$moveX = $axes[VIO_GAMEPAD_AXIS_LEFT_X];   // -1.0 to 1.0
$moveY = $axes[VIO_GAMEPAD_AXIS_LEFT_Y];   // -1.0 to 1.0
$lookX = $axes[VIO_GAMEPAD_AXIS_RIGHT_X];  // -1.0 to 1.0
$lookY = $axes[VIO_GAMEPAD_AXIS_RIGHT_Y];  // -1.0 to 1.0
```

### Axis Constants

| Constant | Value | Description |
|---|---|---|
| `VIO_GAMEPAD_AXIS_LEFT_X` | 0 | Left stick horizontal |
| `VIO_GAMEPAD_AXIS_LEFT_Y` | 1 | Left stick vertical |
| `VIO_GAMEPAD_AXIS_RIGHT_X` | 2 | Right stick horizontal |
| `VIO_GAMEPAD_AXIS_RIGHT_Y` | 3 | Right stick vertical |
| `VIO_GAMEPAD_AXIS_LEFT_TRIGGER` | 4 | Left trigger |
| `VIO_GAMEPAD_AXIS_RIGHT_TRIGGER` | 5 | Right trigger |

## Triggers

```php
$triggers = vio_gamepad_triggers(0);

$lt = $triggers["left"];   // 0.0 to 1.0
$rt = $triggers["right"];  // 0.0 to 1.0

if ($rt > 0.5) {
    accelerate();
}
```

## Deadzone Handling

GLFW does not apply deadzones automatically. Apply your own:

```php
function applyDeadzone(float $value, float $deadzone = 0.15): float {
    if (abs($value) < $deadzone) return 0.0;
    return ($value - $deadzone * sign($value)) / (1.0 - $deadzone);
}

$axes = vio_gamepad_axes(0);
$moveX = applyDeadzone($axes[VIO_GAMEPAD_AXIS_LEFT_X]);
```
