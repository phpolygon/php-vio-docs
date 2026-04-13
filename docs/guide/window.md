# Window Management

php-vio uses GLFW for window creation and management. A window is implicitly created when you call `vio_create()`.

## Window Options

```php
$ctx = vio_create("opengl", [
    "width"    => 1280,
    "height"   => 720,
    "title"    => "My Application",
    "vsync"    => true,    // V-Sync (default: true)
    "samples"  => 4,       // MSAA samples (0 = disabled)
    "debug"    => false,   // Debug output
    "headless" => false,   // No visible window
]);
```

## Title

```php
vio_set_title($ctx, "New Title - FPS: 60");
```

## Size

```php
// Window size (screen coordinates)
[$w, $h] = vio_window_size($ctx);

// Framebuffer size (pixels — may differ on HiDPI)
[$fbW, $fbH] = vio_framebuffer_size($ctx);

// Resize the window
vio_set_window_size($ctx, 1920, 1080);
```

## HiDPI / Retina

```php
// Content scale factor
[$scaleX, $scaleY] = vio_content_scale($ctx);

// Pixel ratio (framebuffer pixels / window pixels)
$ratio = vio_pixel_ratio($ctx);
```

On a Retina display, `vio_pixel_ratio()` returns `2.0` — the framebuffer is twice the window size in each dimension.

## Fullscreen Modes

```php
// Toggle between windowed and fullscreen
vio_toggle_fullscreen($ctx);

// Explicit modes
vio_set_fullscreen($ctx);   // Exclusive fullscreen
vio_set_borderless($ctx);   // Borderless windowed (maximized)
vio_set_windowed($ctx);     // Restore windowed mode
```

## Closing

```php
// Check if the user clicked the close button
if (vio_should_close($ctx)) {
    break;
}

// Programmatically request close
vio_close($ctx);

// Destroy context and free all resources
vio_destroy($ctx);
```

## Event Loop

Every frame must call `vio_poll_events()` to process window and input events:

```php
while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    // ... render ...
    vio_end($ctx);
    vio_poll_events($ctx);
}
```

## Resize Callback

```php
vio_on_resize($ctx, function(int $width, int $height) {
    vio_viewport($ctx, 0, 0, $width, $height);
});
```
