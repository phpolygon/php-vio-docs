# Keyboard & Mouse

php-vio provides comprehensive input handling via GLFW. You can poll state per-frame or register event callbacks.

## Keyboard

### Polling

```php
// Is the key currently held down?
if (vio_key_pressed($ctx, VIO_KEY_W)) {
    $y -= $speed;
}

// Was the key just pressed this frame? (edge-triggered)
if (vio_key_just_pressed($ctx, VIO_KEY_SPACE)) {
    jump();
}

// Was the key just released this frame?
if (vio_key_released($ctx, VIO_KEY_SHIFT)) {
    stopSprinting();
}
```

### Text Input

```php
// Get all characters typed this frame as UTF-8
$chars = vio_chars_typed($ctx);
if ($chars !== "") {
    $inputBuffer .= $chars;
}
```

### Key Callbacks

```php
vio_on_key($ctx, function(int $key, int $action, int $mods) {
    if ($key === VIO_KEY_F11 && $action === VIO_PRESS) {
        // Toggle fullscreen
    }

    // Check modifiers
    if ($mods & VIO_MOD_CONTROL) {
        // Ctrl is held
    }
});
```

### Character Callback

```php
vio_on_char($ctx, function(int $codepoint) {
    $char = mb_chr($codepoint);
    echo "Typed: $char\n";
});
```

### Input Injection (Testing)

Simulate key presses without a real keyboard:

```php
vio_inject_key($ctx, VIO_KEY_W, VIO_PRESS);
vio_poll_events($ctx);

assert(vio_key_pressed($ctx, VIO_KEY_W) === true);

vio_inject_key($ctx, VIO_KEY_W, VIO_RELEASE);
```

## Mouse

### Position

```php
[$x, $y] = vio_mouse_position($ctx);

// Movement since last frame
[$dx, $dy] = vio_mouse_delta($ctx);
```

### Buttons

```php
if (vio_mouse_button($ctx, VIO_MOUSE_LEFT)) {
    // Left button held
}
```

| Constant | Button |
|---|---|
| `VIO_MOUSE_LEFT` | Left click |
| `VIO_MOUSE_RIGHT` | Right click |
| `VIO_MOUSE_MIDDLE` | Middle click / wheel |

### Scroll

```php
[$scrollX, $scrollY] = vio_mouse_scroll($ctx);
// scrollY > 0 = scroll up, scrollY < 0 = scroll down
```

### Mouse Injection (Testing)

```php
vio_inject_mouse_move($ctx, 400.0, 300.0);
vio_inject_mouse_button($ctx, VIO_MOUSE_LEFT, VIO_PRESS);
```

## Resize Callback

```php
vio_on_resize($ctx, function(int $width, int $height) {
    vio_viewport($ctx, 0, 0, $width, $height);
    // Update projection matrix...
});
```

## Key Constants

All key constants follow GLFW naming with a `VIO_KEY_` prefix:

```php
VIO_KEY_A ... VIO_KEY_Z
VIO_KEY_0 ... VIO_KEY_9
VIO_KEY_F1 ... VIO_KEY_F12
VIO_KEY_SPACE, VIO_KEY_ENTER, VIO_KEY_TAB, VIO_KEY_BACKSPACE
VIO_KEY_ESCAPE, VIO_KEY_DELETE, VIO_KEY_INSERT
VIO_KEY_UP, VIO_KEY_DOWN, VIO_KEY_LEFT, VIO_KEY_RIGHT
VIO_KEY_LEFT_SHIFT, VIO_KEY_LEFT_CONTROL, VIO_KEY_LEFT_ALT
// ... and many more
```

See [Constants Reference](/api/constants) for the complete list.

## Modifier Bitmask

| Constant | Value |
|---|---|
| `VIO_MOD_SHIFT` | `0x0001` |
| `VIO_MOD_CONTROL` | `0x0002` |
| `VIO_MOD_ALT` | `0x0004` |
| `VIO_MOD_SUPER` | `0x0008` |
| `VIO_MOD_CAPS_LOCK` | `0x0010` |
| `VIO_MOD_NUM_LOCK` | `0x0020` |

## Actions

| Constant | Meaning |
|---|---|
| `VIO_RELEASE` | Key/button was released |
| `VIO_PRESS` | Key/button was pressed |
| `VIO_REPEAT` | Key is being held (auto-repeat) |
