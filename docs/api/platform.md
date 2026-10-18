# Platform & Clipboard

Process-wide queries about the window system and the host, and the clipboard. None of these
functions needs a context.

## vio_platform

```php
string vio_platform()
```

The window system php-vio runs on:

| Value | Window system |
|---|---|
| `"glfw"` | GLFW |
| `"win32"` | php-vio's native Win32 layer |
| `"cocoa"` | php-vio's native Cocoa layer (macOS) |
| `"x11"` | php-vio's native X11 layer |
| `"wayland"` | php-vio's native Wayland layer (xdg-shell; OpenGL through EGL, Vulkan) |
| `"null"` | No window system: headless / offscreen only |

The environment variable `VIO_PLATFORM=<name>` picks one of the platforms built into the
extension. The platform decides what window-system services can do – the clipboard, layout key
names ([`vio_key_name()`](/api/keyboard#vio-key-name)) and the monitor list
([`vio_monitors()`](/api/window#vio-monitors)).

Without `VIO_PLATFORM` the native layer of the OS wins when it is built in (on Linux Wayland
before X11, Wayland only inside a Wayland session), then GLFW, then `null`.

```php
if (vio_platform() === 'null') {
    // no window system: render headless only
}
```

### Start-up without a display

The active platform is started when the extension loads (`MINIT`), before any PHP code runs – every
`php` process that loads php-vio does this, also CLI scripts that never open a window. When that
platform is GLFW and there is no display (CI, SSH session, build container), `glfwInit()` fails and
PHP prints two warnings at start-up: `GLFW error …` and `Failed to initialize GLFW`. They are
harmless for processes that never need the window system – module start-up still succeeds; only
what needs it (a window, an OpenGL context) fails later.
Set `VIO_PLATFORM=null` for such processes to skip the window system and the warnings. The
native X11 layer fails silently without a display.

## vio_thermal_state

```php
string vio_thermal_state()
```

The host's thermal pressure level. On macOS / iOS it maps `NSProcessInfo.thermalState` to
`"nominal"`, `"fair"`, `"serious"` or `"critical"`; every other platform returns `"unknown"`, so
callers can fall back to their own metric.

```php
if (in_array(vio_thermal_state(), ['serious', 'critical'], true)) {
    $renderScale = 0.75;   // back off before the OS throttles
}
```

## vio_clipboard_get

```php
string vio_clipboard_get()
```

Read the clipboard as UTF-8 text; `""` when it is empty or holds no text.

The active platform's system clipboard is used (Win32, Cocoa, X11, GLFW). Platforms without one
(`null`, Wayland, iOS) – and a system clipboard that cannot be reached – use a process-local
clipboard that `vio_clipboard_set()` writes to. Line endings are not converted: text copied in
Windows applications usually carries `"\r\n"`.

## vio_clipboard_set

```php
bool vio_clipboard_set(string $text)
```

Write UTF-8 text to the clipboard: the system clipboard where the platform has one, and always the
process-local fallback. An empty string clears the text. C-string semantics apply – the text ends
at the first NUL byte.

On X11 the clipboard is served by this process: other clients can paste the text while the
application keeps polling events (`vio_poll_events()`) and until it exits.

```php
vio_clipboard_set("function f() {\n    return 'ä€😀 漢字';\n}\n");
$text = str_replace("\r\n", "\n", vio_clipboard_get());
```
