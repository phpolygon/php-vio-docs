# Window

Functions for window management, sizing, and display modes.

## vio_set_title

```php
void vio_set_title(VioContext $context, string $title)
```

Change the window title bar text.

## vio_window_size

```php
array{0: int, 1: int} vio_window_size(VioContext $context)
```

Returns `[width, height]` in screen coordinates.

## vio_framebuffer_size

```php
array{0: int, 1: int} vio_framebuffer_size(VioContext $context)
```

Returns `[width, height]` in pixels. On HiDPI displays, this is larger than `vio_window_size()`.

## vio_set_window_size

```php
void vio_set_window_size(VioContext $context, int $width, int $height)
```

Resize the window to the given screen coordinates.

## vio_content_scale

```php
array{0: float, 1: float} vio_content_scale(VioContext $context)
```

Returns the HiDPI content scale factor `[scaleX, scaleY]`.

## vio_pixel_ratio

```php
float vio_pixel_ratio(VioContext $context)
```

Returns the ratio of framebuffer pixels to window pixels. `2.0` on Retina displays.

## vio_toggle_fullscreen

```php
void vio_toggle_fullscreen(VioContext $context)
```

Toggle between windowed and exclusive fullscreen mode.

## vio_set_fullscreen

```php
void vio_set_fullscreen(VioContext $context)
```

Enter exclusive fullscreen mode.

## vio_set_borderless

```php
void vio_set_borderless(VioContext $context)
```

Enter borderless windowed mode (maximized, no decorations).

## vio_set_windowed

```php
void vio_set_windowed(VioContext $context)
```

Restore windowed mode with decorations.

## vio_viewport

```php
void vio_viewport(VioContext $context, int $x, int $y, int $width, int $height)
```

Set the rendering viewport rectangle in pixels.
