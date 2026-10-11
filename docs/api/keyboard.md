# Keyboard

Functions for keyboard input polling, callbacks, and injection.

## vio_key_pressed

```php
bool vio_key_pressed(VioContext $context, int $key)
```

Returns `true` if the key is currently held down.

## vio_key_just_pressed

```php
bool vio_key_just_pressed(VioContext $context, int $key)
```

Returns `true` only on the frame the key was first pressed (edge-triggered).

## vio_key_released

```php
bool vio_key_released(VioContext $context, int $key)
```

Returns `true` only on the frame the key was released.

## vio_chars_typed

```php
string vio_chars_typed(VioContext $context)
```

Returns all characters typed this frame as a UTF-8 string. Empty string if nothing was typed.

## vio_key_name

```php
?string vio_key_name(int $key)
```

The character a printable key types in the current keyboard layout, lower case and without modifiers (`glfwGetKeyName` semantics). `VIO_KEY_*` constants name **physical positions** after the US layout; `vio_key_name()` maps them back to the keycap. On a German layout `vio_key_name(VIO_KEY_Y)` is `"z"` – look the shortcut key up by its character so Ctrl+Z follows the layout:

```php
$undoKey = VIO_KEY_Z;
for ($k = VIO_KEY_A; $k <= VIO_KEY_Z; $k++) {
    if (vio_key_name($k) === 'z') { $undoKey = $k; break; }
}
```

Returns `null` for keys that type nothing printable (modifiers, arrows, dead keys) and on platforms that do not know the layout (`null`, Wayland, iOS). Process-wide, no context needed.

| Platform | Source |
|---|---|
| Win32 | `MapVirtualKeyExW` on the active layout |
| Cocoa | `UCKeyTranslate` (HIToolbox, loaded at run time) |
| X11 | `XkbKeycodeToKeysym` of the active group (Latin-1 and Unicode keysyms) |
| GLFW | `glfwGetKeyName` |

## Clipboard

```php
string vio_clipboard_get()
bool   vio_clipboard_set(string $text)
```

Read and write the clipboard as UTF-8 text. Process-wide, no context needed. On Win32, Cocoa, X11 and GLFW this is the **system clipboard**; the null platform, Wayland and iOS keep a process-local clipboard instead, so set/get still round-trip (also when the system clipboard cannot be reached). `vio_clipboard_get()` returns `""` when the clipboard is empty or holds no text.

- Line endings are not converted: text copied in Windows applications usually carries `"\r\n"`.
- The text ends at the first NUL byte.
- On X11 the copying process serves the clipboard itself: other applications can paste it while the game keeps calling `vio_poll_events()` and until it exits (as with GLFW).

## vio_on_key

```php
void vio_on_key(VioContext $context, callable $callback)
```

Register a key event callback.

**Callback signature:**
```php
function(int $key, int $action, int $mods): void
```

- `$key` — Key constant (`VIO_KEY_*`)
- `$action` — `VIO_PRESS`, `VIO_RELEASE`, or `VIO_REPEAT`
- `$mods` — Bitmask of modifiers (`VIO_MOD_*`)

## vio_on_char

```php
void vio_on_char(VioContext $context, callable $callback)
```

Register a character input callback (Unicode codepoint).

**Callback signature:**
```php
function(int $codepoint): void
```

## vio_inject_key

```php
void vio_inject_key(VioContext $context, int $key, int $action)
```

Simulate a key press/release. Useful for testing.

- `$key` — Key constant (`VIO_KEY_*`)
- `$action` — `VIO_PRESS` or `VIO_RELEASE`

Call `vio_poll_events()` after injection for the state to take effect.
