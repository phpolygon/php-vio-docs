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

Returns `[width, height]` in logical coordinates (framebuffer size ÷ content scale): DPI-independent,
so layout constants keep their meaning on a scaled monitor while rendering stays at the native
resolution. [`vio_set_window_size()`](#vio-set-window-size) takes the same space.

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
void vio_set_fullscreen(VioContext $context, int $monitor = -1, int $width = 0, int $height = 0, int $refresh = 0)
```

Enter exclusive fullscreen mode.

- `$monitor` – Monitor index from [`vio_monitors()`](#vio-monitors); `-1` = primary monitor
- `$width`, `$height` – Fullscreen resolution in pixels; `0` = the monitor's native mode. Should be
  a mode listed by [`vio_video_modes()`](#vio-video-modes); GLFW falls back to the closest supported
  mode otherwise
- `$refresh` – Refresh rate in Hz; `0` = let the mode decide

```php
vio_set_fullscreen($ctx);                        // primary monitor, native mode
vio_set_fullscreen($ctx, 1, 1920, 1080, 144);    // second monitor, 1080p at 144 Hz
```

## vio_get_auto_iconify

```php
bool vio_get_auto_iconify(VioContext $context)
```

Whether a fullscreen window auto-minimizes when it loses focus. php-vio switches this **off** at
window creation, so Print Screen, the snipping tool or Alt+Tab no longer drop fullscreen players to
the desktop. Returns the GLFW default (`true`) when there is no window (`null` backend).
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

## vio_viewports

```php
bool vio_viewports(VioContext $context, array $viewports)
```

Set several viewports at once: `[[x, y, width, height], ...]`, up to `VIO_MAX_VIEWPORTS` (16), in
the same coordinate convention as `vio_viewport()`. `gl_ViewportIndex` written in the geometry stage
– or in the vertex stage where `VIO_FEATURE_VERTEX_LAYER` is set – picks the viewport per
primitive; primitives that do not write it use viewport 0. `vio_viewport()` returns to a single
viewport. Typical use: every shadow cascade into one atlas in a single pass.

Requires `VIO_FEATURE_MULTI_VIEWPORT`: OpenGL 4.1 / `ARB_viewport_array`, D3D11, D3D12, Vulkan
(`multiViewport`) and Metal (Mac2 / Apple5 GPU families).

```php
if (vio_supports_feature($ctx, VIO_FEATURE_MULTI_VIEWPORT)) {
    vio_viewports($ctx, [[0, 0, 1024, 1024], [1024, 0, 1024, 1024]]);
    vio_draw($ctx, $casters);   // the geometry shader writes gl_ViewportIndex
    vio_viewport($ctx, 0, 0, 2048, 1024);
}
```

## vio_native_window_handle

```php
int vio_native_window_handle(VioContext $context)
```

The platform-native window handle as an integer – for handing the window to another native
renderer or OS API:

| Platform | Handle |
|---|---|
| macOS | `NSWindow*` |
| Windows | `HWND` |
| Linux (X11) | X11 `Window` XID |
| Linux (Wayland) | `wl_surface` |

Returns `0` if no window exists or the platform is unsupported.

## vio_monitor_info

```php
array vio_monitor_info(VioContext $context)
```

The primary monitor: native video mode (physical pixels), work area (excludes the taskbar), content
scale and name.

```php
[
    'width' => 2560, 'height' => 1440, 'refresh_rate' => 144,
    'work_x' => 0, 'work_y' => 0, 'work_width' => 2560, 'work_height' => 1392,
    'scale_x' => 1.0, 'scale_y' => 1.0, 'name' => '…',
]
```

## vio_monitors

```php
array vio_monitors(VioContext $context)
```

Every connected monitor, the primary one first. Each entry has `index` (usable with
`vio_set_fullscreen()` and `vio_video_modes()`), `name`, `primary` (bool), the virtual-desktop
position `x` / `y`, the native mode `width` / `height` / `refresh_rate` (physical pixels), the work
area `work_x` / `work_y` / `work_width` / `work_height` and the content scale `scale_x` / `scale_y`.

The list comes from the window system (GLFW, Win32, Cocoa, X11 or Wayland – see
[`vio_platform()`](/api/platform#vio-platform)); without a display it can be empty.

## vio_video_modes

```php
array vio_video_modes(VioContext $context, int $monitor = -1)
```

The video modes (resolution + refresh rate) a monitor supports, for a fullscreen resolution picker:
`[['width' => int, 'height' => int, 'refresh_rate' => int], ...]`. Duplicate combinations are
collapsed and the modes are returned in ascending order. `$monitor` is an index from
`vio_monitors()`; `-1` = primary monitor. Without a display the list is empty.

```php
$modes = vio_video_modes($ctx);
foreach ($modes as $m) {
    $labels[] = "{$m['width']} × {$m['height']} @ {$m['refresh_rate']} Hz";
}
$pick = end($modes);   // the largest mode
vio_set_fullscreen($ctx, -1, $pick['width'], $pick['height'], $pick['refresh_rate']);
```
