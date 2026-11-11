# Window

Functions for window management, sizing, and display modes.

Since v2.41.0 the window, size and input functions accept a `VioWindow` – a further window opened
with [`vio_window()`](#vio-window) – wherever they take the context; the signatures below show the
context only. Dialogs, menus, notifications and the tray are on
[Desktop Integration](/api/desktop).
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

## vio_on_close

```php
void vio_on_close(VioContext|VioWindow $context, callable $callback)
```

Called when the user asks to close the window (close button, Alt+F4, Cmd+Q). Return `false` to
keep it open; anything else closes it and [`vio_should_close()`](/api/context#vio-should-close)
becomes `true`. Without a callback the window closes.

```php
$unsaved = true;
vio_on_close($ctx, function () use ($ctx, &$unsaved) {
    if (!$unsaved) {
        return true;
    }
    $choice = vio_message_box($ctx, 'Quit', 'Discard unsaved changes?',
                              ['buttons' => ['Discard', 'Cancel'], 'kind' => 'warning']);
    return $choice === 0;
});
```

## vio_on_focus

```php
void vio_on_focus(VioContext|VioWindow $context, callable $callback)
```

Called when the window gains (`true`) or loses (`false`) keyboard focus: `callable(bool $focused)`.

## vio_on_minimize

```php
void vio_on_minimize(VioContext|VioWindow $context, callable $callback)
```

Called when the window is minimized (`true`) or restored (`false`). Wayland reports no minimization.

## vio_on_scale

```php
void vio_on_scale(VioContext|VioWindow $context, callable $callback)
```

Called when the window's content scale changes – it moved to a monitor with another DPI – with the
new [`vio_content_scale()`](#vio-content-scale) values: `callable(float $scale_x, float $scale_y)`.

## vio_on_refresh

```php
void vio_on_refresh(VioContext|VioWindow $context, callable $callback)
```

Called when the OS wants the window's content drawn again: it was exposed, or the user is resizing
it. A live resize blocks the event loop on Windows and macOS – render a frame from the callback to
keep the window filled meanwhile.

```php
$render = function () use ($ctx) {
    vio_begin($ctx);
    vio_clear($ctx, 0.1, 0.1, 0.1);
    vio_end($ctx);
};
vio_on_refresh($ctx, $render);
```

## vio_inject_window_event

```php
bool vio_inject_window_event(VioContext|VioWindow $context, int $event, float $a = 0.0, float $b = 0.0)
```

Inject a window event through the same path as the OS one (tests, headless contexts).

| `$event` | Arguments | Effect |
|---|---|---|
| `VIO_WINDOW_EVENT_CLOSE` | – | Runs `vio_on_close`; returns whether the window closes |
| `VIO_WINDOW_EVENT_FOCUS` | `$a` = 1 or 0 | `vio_on_focus` |
| `VIO_WINDOW_EVENT_MINIMIZE` | `$a` = 1 or 0 | `vio_on_minimize` |
| `VIO_WINDOW_EVENT_SCALE` | `$a`, `$b` = the new scale (> 0) | `vio_on_scale` |
| `VIO_WINDOW_EVENT_REFRESH` | – | `vio_on_refresh` |

Focus, minimize and scale fire their callback only on a change. Any other event throws a `ValueError`.

```php
$ctx = vio_create('auto', ['width' => 64, 'height' => 64, 'headless' => true]);
vio_on_close($ctx, fn () => false);
var_dump(vio_inject_window_event($ctx, VIO_WINDOW_EVENT_CLOSE));   // bool(false): the callback vetoed
var_dump(vio_should_close($ctx));                                  // bool(false)
```

## vio_set_cursor

```php
bool vio_set_cursor(VioContext|VioWindow $context, int $shape)
```

Set the cursor over the window to a standard shape:
`VIO_CURSOR_SHAPE_ARROW`, `_IBEAM`, `_CROSSHAIR`, `_HAND`, `_RESIZE_EW`, `_RESIZE_NS`,
`_RESIZE_NWSE`, `_RESIZE_NESW`, `_RESIZE_ALL`, `_NOT_ALLOWED`. Anything else throws a `ValueError`.
Returns `false` where the platform has no cursor shapes
([`vio_platform_info()`](/api/desktop#vio-platform-info)`['cursor_shapes']`).

Hiding and capturing the cursor is [`vio_set_cursor_mode()`](/api/mouse).

## vio_set_cursor_image

```php
bool vio_set_cursor_image(VioContext|VioWindow $context, string $rgba, int $width, int $height,
                          int $hot_x = 0, int $hot_y = 0)
```

Set the cursor to an RGBA image (top row first, 1 to 256 pixels a side) with its hot spot.
`vio_set_cursor()` goes back to a shape.

## vio_set_window_icon

```php
bool vio_set_window_icon(VioContext|VioWindow $context, array $images)
```

Set the window icon from RGBA images of several sizes,
`[['data' => $rgba, 'width' => 16, 'height' => 16], …]`; the platform picks the best one per use.
`[]` restores the default. On macOS this is the Dock icon (windows have none); Wayland has no icons.

## vio_set_window_size_limits

```php
bool vio_set_window_size_limits(VioContext|VioWindow $context, int $min_width, int $min_height,
                                int $max_width = -1, int $max_height = -1)
```

Limit the window size in logical pixels as in [`vio_window_size()`](#vio-window-size); `-1` = no
limit. The user cannot resize past the limits, and [`vio_set_window_size()`](#vio-set-window-size)
clamps to them on every platform. The return value says whether the platform enforces them for the
user too.

## vio_set_window_aspect_ratio

```php
bool vio_set_window_aspect_ratio(VioContext|VioWindow $context, int $numerator, int $denominator)
```

Keep the window's aspect ratio while the user resizes; `0, 0` frees it.

## vio_set_window_floating

```php
bool vio_set_window_floating(VioContext|VioWindow $context, bool $floating)
```

Keep the window above other windows (tool palettes).

## vio_set_window_opacity

```php
bool vio_set_window_opacity(VioContext|VioWindow $context, float $opacity)
```

Whole-window opacity, `0.0` to `1.0`.

```php
vio_set_cursor($ctx, VIO_CURSOR_SHAPE_IBEAM);
vio_set_window_size_limits($ctx, 640, 480);
vio_set_window_aspect_ratio($ctx, 16, 9);
vio_set_window_floating($ctx, true);
vio_set_window_opacity($ctx, 0.9);
```

Wayland supports cursor shapes and size limits, but no icon, aspect ratio, floating or opacity.

## vio_window

```php
VioWindow|false vio_window(VioContext $context, array $options = [])
```

Open a further window on the context's device. Meshes, textures, shaders and every other resource
of the context work in each of its windows. Needs `VIO_FEATURE_MULTI_WINDOW` (every backend with a
window system; `false` otherwise, for example on the `null` platform).

| Option | Type | Default | Description |
|---|---|---|---|
| `width`, `height` | int | `640`, `480` | Size, 1 to 16384 |
| `title` | string | `""` | Window title |
| `headless` | bool | the context's | No visible window |
| `vsync` | bool | the context's | Sync this window's presents |
| `parent` | VioContext\|VioWindow | – | The context (its main window) or one of its windows: the new window stays above the parent and closes with it |
| `modal` | bool | `false` | With `parent`: block the parent's keys, mouse buttons, text and close requests while the window is open |

Render into the window with [`vio_begin($context, ['window' => $window])`](/api/context#vio-begin).
Window, size and input functions take the `VioWindow` in place of the context:
`vio_window_size($window)`, `vio_key_pressed($window, VIO_KEY_A)`, `vio_should_close($window)`,
`vio_read_pixels($window)`. A window of another context throws a `ValueError`.

```php
$ctx  = vio_create('auto', ['width' => 800, 'height' => 600, 'title' => 'Main']);
$tool = vio_window($ctx, ['width' => 320, 'height' => 600, 'title' => 'Inspector']);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.1, 0.1, 0.1);
    vio_end($ctx);

    if ($tool && !vio_should_close($tool)) {
        vio_begin($ctx, ['window' => $tool]);
        vio_clear($ctx, 0.2, 0.2, 0.25);
        vio_end($ctx);
    } elseif ($tool) {
        vio_destroy_window($tool);
        $tool = null;
    }
    vio_poll_events($ctx);
}
vio_destroy($ctx);
```

## vio_destroy_window

```php
bool vio_destroy_window(VioWindow $window)
```

Close a window now (its swapchain and the platform window). The main window keeps rendering.