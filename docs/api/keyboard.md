# Keyboard

Functions for keyboard input polling, callbacks, layout key names, the on-screen keyboard and injection. The clipboard is on [Platform & Clipboard](/api/platform#vio-clipboard-get).

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

## vio_on_key

```php
void vio_on_key(VioContext $context, callable $callback)
```

Register a key event callback.

**Callback signature:**
```php
function(int $key, int $action, int $mods): void
```

- `$key` – Key constant (`VIO_KEY_*`)
- `$action` – `VIO_PRESS`, `VIO_RELEASE`, or `VIO_REPEAT`
- `$mods` – Bitmask of modifiers (`VIO_MOD_*`)

## vio_on_char

```php
void vio_on_char(VioContext $context, callable $callback)
```

Register a character input callback (Unicode codepoint).

**Callback signature:**
```php
function(int $codepoint): void
```

## vio_key_name

```php
?string vio_key_name(int $key)
```

The character a printable key types in the current keyboard layout, lower case and without
modifiers (`glfwGetKeyName` semantics). Process-wide, no context needed.

`VIO_KEY_*` constants name physical key positions after the US layout; this maps them back to the
keycap – `VIO_KEY_Y` is `"z"` on a German layout – so shortcuts such as Ctrl+Z can follow the
user's layout. Returns `null` for keys that type nothing printable (Shift, arrows, Enter, dead
keys, unknown key codes) and on platforms that do not know the layout (`null`, Wayland, iOS).

```php
$undo = vio_key_name(VIO_KEY_Z) ?? 'z';                // label for the menu
if ($ctrl && vio_key_just_pressed($ctx, VIO_KEY_Z)) {  // physical position
    undo();
}
```

## vio_ime_backspaces

```php
int vio_ime_backspaces(VioContext $context)
```

Number of on-screen-keyboard backspaces since the last call (read-and-clear). Non-zero only on
iOS; `0` on desktop, where the physical Backspace key goes through the key API.

## vio_keyboard_show

```php
void vio_keyboard_show(VioContext $context)
```

Show the on-screen keyboard (iOS). Call it when a text field gains focus. No-op on desktop.

## vio_keyboard_hide

```php
void vio_keyboard_hide(VioContext $context)
```

Hide the on-screen keyboard (iOS). Call it when a text field loses focus. No-op on desktop.

## vio_on_preedit

```php
void vio_on_preedit(VioContext|VioWindow $context, callable $callback)
```

Called while an input method composes text (Japanese, Chinese, Korean, dead keys):
`callable(string $text, int $start, int $end)` – the composition and the selected range in
codepoints (`$start == $end`: the caret). `''` means the composition was committed or cancelled;
the committed text arrives through [`vio_on_char()`](#vio-on-char) /
[`vio_chars_typed()`](#vio-chars-typed) as usual. Draw the composition at the text cursor.
[`vio_platform_info()`](/api/desktop#vio-platform-info)`['ime_preedit']` says whether the platform
reports it (Win32, Cocoa, X11, Wayland; not GLFW). Since v2.41.0.

```php
$composition = '';
vio_on_preedit($ctx, function (string $text, int $start, int $end) use (&$composition) {
    $composition = $text;            // underline it after the committed text
});
vio_ime_rect($ctx, 120, 200, 2, 24); // where the caret is, so the candidate window sits next to it
```

## vio_ime_rect

```php
bool vio_ime_rect(VioContext|VioWindow $context, int $x, int $y, int $width, int $height)
```

Tell the input method where the text being composed is (window coordinates as
[`vio_mouse_position()`](/api/mouse#vio-mouse-position)), so it puts its candidate window next to it.

## vio_ime_enable

```php
bool vio_ime_enable(VioContext|VioWindow $context, bool $enabled)
```

Turn the input method on (text fields) or off (game controls: keys go straight through).

## vio_inject_preedit

```php
void vio_inject_preedit(VioContext|VioWindow $context, string $text, int $start = -1, int $end = -1)
```

A composition through the same path as the platform's (tests). `-1` = after the text;
`$start <= $end <=` the text's length in codepoints, anything else throws a `ValueError`.
## vio_inject_key

```php
void vio_inject_key(VioContext $context, int $key, int $action, int $mods = 0)
```

Inject a simulated key event. It takes the same path as a key event from the OS: it updates the key
state (`vio_key_pressed` / `_just_pressed` / `_released`) and fires the `vio_on_key` callback with
`($key, $action, $mods)`.

- `$key` – Key constant (`VIO_KEY_*`)
- `$action` – `VIO_PRESS`, `VIO_RELEASE` or `VIO_REPEAT`; anything else throws a `ValueError`
- `$mods` – `VIO_MOD_*` bitmask passed to the callback

Injections apply immediately. For edges to line up like real input, inject where the loop calls
`vio_poll_events()`: `vio_begin()` snapshots the previous key state, so a press injected after the
game read its input this frame shows up as a held key next frame, never as an edge.

A key press does not produce text – typed characters are a separate event, as on the OS. Follow
the key with [`vio_inject_char()`](#vio-inject-char).

## vio_inject_char

```php
int vio_inject_char(VioContext $context, int|string $input)
```

Inject typed text: one codepoint (int) or a UTF-8 string. Each codepoint goes through the OS text
path – it is appended to `vio_chars_typed()` and fires the `vio_on_char` callback.

Control characters (Enter, Tab, Backspace, U+0000–U+001F, U+007F) throw a `ValueError`, because
the OS delivers them as keys, not text – use `vio_inject_key()` for those. Malformed UTF-8 throws
too, and nothing is emitted.

**Returns** the number of codepoints emitted.

```php
vio_inject_key($ctx, VIO_KEY_H, VIO_PRESS, VIO_MOD_SHIFT);
vio_inject_char($ctx, 'Hello');               // 5
vio_inject_key($ctx, VIO_KEY_ENTER, VIO_PRESS);
vio_poll_events($ctx);
```

All key and text injections are captured by [input recording](/api/input-recording).