# Desktop Applications

php-vio is built for games, but since v2.41.0 the same extension carries a native desktop
application: an event loop that sleeps while nothing happens, several windows, menus, dialogs, a
tray icon and a tree for screen readers. This guide shows how the pieces fit; the reference is on
[Window](/api/window), [Desktop Integration](/api/desktop) and [Context & Frame](/api/context).

```php
<?php

$ctx  = vio_create('auto', ['width' => 900, 'height' => 600, 'title' => 'Notes']);
$font = vio_font($ctx, __DIR__ . '/Inter.ttf', 18.0);

$text  = '';
$dirty = true;

vio_on_char($ctx, function (int $codepoint) use (&$text, &$dirty) {
    $text .= mb_chr($codepoint);
    $dirty = true;
});
vio_on_refresh($ctx, function () use (&$dirty) { $dirty = true; });
vio_on_close($ctx, function () use ($ctx, &$text) {
    if ($text === '') {
        return true;
    }
    $choice = vio_message_box($ctx, 'Notes', 'Discard the text?',
                              ['buttons' => ['Discard', 'Cancel'], 'kind' => 'question']);
    return $choice !== 1;      // false keeps the window open
});

while (!vio_should_close($ctx)) {
    vio_wait_events($ctx, 1.0);            // sleeps until an event or the timeout
    if (!$dirty) {
        continue;
    }
    vio_begin($ctx);
    vio_clear($ctx, 0.96, 0.96, 0.94);
    if ($font) {
        vio_text($ctx, $font, $text, 24, 48, ['color' => 0xFF202020, 'max_width' => 852]);
    }
    vio_draw_2d($ctx);
    vio_end($ctx);
    $dirty = false;
}

vio_destroy($ctx);
```

## Wait instead of poll

A game calls [`vio_poll_events()`](/api/context#vio-poll-events) and renders every frame. An
application that only changes on input loops on [`vio_wait_events()`](/api/context#vio-wait-events):
it blocks until the OS delivers an event, the timeout passes or [`vio_wake()`](/api/context#vio-wake)
is called, then dispatches the callbacks like `vio_poll_events()`. Render only when something
changed.

Two callbacks keep the window correct while the loop sleeps:

- [`vio_on_refresh()`](/api/window#vio-on-refresh) fires when the OS wants the content redrawn – the
  window was exposed, or the user drags its border. On Windows and macOS a live resize blocks the
  event loop, so render a frame from the callback itself to fill the window meanwhile.
- [`vio_on_close()`](/api/window#vio-on-close) fires when the user asks to close the window.
  Returning `false` keeps it open – the place for an "unsaved changes" question.

## Ask the platform first

Window systems differ: Linux has no native menu bar or message box, Wayland has no window icons,
notifications on macOS need an app bundle. [`vio_platform_info()`](/api/desktop#vio-platform-info)
reports what the running process can use, and a call the platform cannot serve returns `false`
without a warning – so one code path works everywhere:

```php
$can = vio_platform_info();

if (!vio_menu_bar($ctx, $menus, $onSelect)) {
    $drawOwnMenu = true;                   // Linux, GLFW
}
if ($can['tray']) {
    vio_tray(['tooltip' => 'Notes', 'menu' => [['id' => 'quit', 'label' => 'Quit']],
              'on_select' => fn (string $id) => vio_close($ctx)]);
}
```

## Several windows

[`vio_window()`](/api/window#vio-window) opens a further window on the same device, so textures,
fonts and shaders are shared. A frame goes to one window: `vio_begin($ctx, ['window' => $w])`.
Input and size functions take the `VioWindow` in place of the context.

```php
$inspector = vio_window($ctx, ['width' => 320, 'height' => 480, 'title' => 'Inspector']);

// a dialog of your own: stays above the main window and blocks its input
$dialog = vio_window($ctx, ['width' => 360, 'height' => 160, 'title' => 'Rename',
                            'parent' => $ctx, 'modal' => true]);
```

Check `vio_supports_feature($ctx, VIO_FEATURE_MULTI_WINDOW)` first; without a window system
`vio_window()` returns `false`.

## Text input

Committed text arrives through [`vio_on_char()`](/api/keyboard#vio-on-char). For Japanese, Chinese
and Korean input – and dead keys – also handle the composition:
[`vio_on_preedit()`](/api/keyboard#vio-on-preedit) reports the text being composed, and
[`vio_ime_rect()`](/api/keyboard#vio-ime-rect) tells the input method where the caret is so its
candidate window appears next to it. Turn the input method off with
[`vio_ime_enable($ctx, false)`](/api/keyboard#vio-ime-enable) while keys drive a game or a canvas.

Copy and paste go through [`vio_clipboard_get()` / `vio_clipboard_set()`](/api/platform#vio-clipboard-get);
shortcuts that should follow the keyboard layout use [`vio_key_name()`](/api/keyboard#vio-key-name).

## Accessibility

A window drawn with a GPU is opaque to a screen reader. Describe what is on screen with
[`vio_a11y_update()`](/api/desktop#vio-a11y-update) – a tree of nodes with roles, labels and
bounds – and send only the nodes that changed afterwards. Actions the user triggers from assistive
technology arrive in [`vio_on_a11y_action()`](/api/desktop#vio-on-a11y-action); route them into the
same code as a mouse click.

## Testing without a desktop

Every OS event has an injection function that takes the same path, so the logic of an application
runs headless in CI: [`vio_inject_window_event()`](/api/window#vio-inject-window-event),
[`vio_inject_menu()`](/api/desktop#vio-inject-menu), [`vio_inject_drop()`](/api/desktop#vio-inject-drop),
[`vio_inject_preedit()`](/api/keyboard#vio-inject-preedit), next to the
[key, mouse and gamepad injection](/api/input-recording).

```php
$ctx = vio_create('auto', ['width' => 64, 'height' => 64, 'headless' => true]);

$dropped = [];
vio_on_drop($ctx, function (array $paths) use (&$dropped) { $dropped = $paths; });
vio_inject_drop($ctx, ['/tmp/a.txt'], 10, 20);
assert($dropped === ['/tmp/a.txt']);
```

## Platform notes

- **Linux** – notifications, launcher progress, the tray and the file dialog use services on the
  D-Bus session bus (notification daemon, `xdg-desktop-portal`, a StatusNotifierWatcher). Set the
  INI value `vio.app_id` (or `VIO_APP_ID`) to the id of your `.desktop` file.
- **macOS** – ship the application as an app bundle; notifications are unavailable from a plain
  command-line `php`.
- **Windows** – notifications appear as a balloon at the tray icon.
