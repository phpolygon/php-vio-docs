# Desktop Integration

What a desktop application needs from the window system beyond a window: dialogs, menus,
notifications, a tray icon, file drops, links to other applications and a tree for screen readers.
Added in v2.41.0.

```php
$ctx = vio_create('auto', ['width' => 800, 'height' => 600, 'title' => 'Editor']);

vio_menu_bar($ctx, [
    ['label' => 'File', 'children' => [
        ['id' => 'open', 'label' => 'Open…', 'shortcut' => 'Primary+O'],
        ['separator' => true],
        ['id' => 'quit', 'label' => 'Quit', 'shortcut' => 'Primary+Q'],
    ]],
], function (string $id) use ($ctx) {
    if ($id === 'open') {
        $paths = vio_file_dialog($ctx, ['mode' => 'open', 'filters' => [
            ['name' => 'Images', 'extensions' => ['png', 'jpg']],
        ]]);
        if ($paths) {
            vio_set_title($ctx, basename($paths[0]));
        }
    } elseif ($id === 'quit') {
        vio_close($ctx);
    }
});

while (!vio_should_close($ctx)) {
    vio_wait_events($ctx, 0.5);
    vio_begin($ctx);
    vio_clear($ctx, 0.12, 0.12, 0.14);
    vio_end($ctx);
}
vio_destroy($ctx);
```

Every function on this page depends on the window system. [`vio_platform_info()`](#vio-platform-info)
says what the active one can do, and a call the platform cannot serve returns `false` without a
warning. Argument errors (an unknown mode, a menu item without an id) throw a `ValueError` on every
platform. Callbacks run from [`vio_poll_events()`](/api/context#vio-poll-events) /
[`vio_wait_events()`](/api/context#vio-wait-events).

Functions that take `VioContext|VioWindow` also accept a window opened with
[`vio_window()`](/api/window#vio-window).

## vio_platform_info

```php
array vio_platform_info()
```

What the active window platform can do. `name` is the platform ([`vio_platform()`](/api/platform#vio-platform));
every other entry is a `bool`.

| Key | Call it answers for |
|---|---|
| `wait_events` | [`vio_wait_events()`](/api/context#vio-wait-events) blocks (otherwise it only polls) |
| `cursor_shapes` | [`vio_set_cursor()`](/api/window#vio-set-cursor) |
| `custom_cursor` | [`vio_set_cursor_image()`](/api/window#vio-set-cursor-image) |
| `window_icon` | [`vio_set_window_icon()`](/api/window#vio-set-window-icon) |
| `size_limits` | [`vio_set_window_size_limits()`](/api/window#vio-set-window-size-limits) |
| `aspect_ratio` | [`vio_set_window_aspect_ratio()`](/api/window#vio-set-window-aspect-ratio) |
| `floating` | [`vio_set_window_floating()`](/api/window#vio-set-window-floating) |
| `opacity` | [`vio_set_window_opacity()`](/api/window#vio-set-window-opacity) |
| `window_parent` | `'parent'` / `'modal'` of [`vio_window()`](/api/window#vio-window) |
| `open_url`, `reveal_file` | [`vio_open_url()`](#vio-open-url), [`vio_reveal_file()`](#vio-reveal-file) |
| `file_drop` | [`vio_on_drop()`](#vio-on-drop) receives drops from the OS |
| `file_dialog`, `message_box` | [`vio_file_dialog()`](#vio-file-dialog), [`vio_message_box()`](#vio-message-box) |
| `menu_bar`, `popup_menu` | [`vio_menu_bar()`](#vio-menu-bar), [`vio_popup_menu()`](#vio-popup-menu) |
| `notifications`, `progress`, `tray` | [`vio_notify()`](#vio-notify), [`vio_set_progress()`](#vio-set-progress), [`vio_tray()`](#vio-tray) |
| `ime_preedit` | [`vio_on_preedit()`](/api/keyboard#vio-on-preedit) reports compositions |
| `accessibility` | [`vio_a11y_update()`](#vio-a11y-update) |

On Linux `file_dialog`, `notifications`, `progress` and `tray` depend on the services of the running
session (the D-Bus session bus), so the answer can differ between two machines with the same build.

```php
$can = vio_platform_info();
if (!$can['menu_bar']) {
    // draw your own menu
}
```

## Dialogs

### vio_file_dialog

```php
array|false|null vio_file_dialog(VioContext|VioWindow $context, array $options = [])
```

Show the system's file dialog (modal). Returns the chosen paths as a list, `null` when the user
cancels, `false` when the platform has no dialogs.

| Option | Type | Description |
|---|---|---|
| `mode` | string | `'open'` (default), `'save'` or `'folder'` |
| `multiple` | bool | Several files / folders (`open`, `folder`) |
| `title` | string | Dialog title |
| `default_path` | string | A folder to start in, or for `save` a file name to propose |
| `filters` | array | `[['name' => 'Images', 'extensions' => ['png', 'jpg']], …]` – bare extensions, no dot |

Windows uses the Common Item Dialog, macOS `NSOpenPanel` / `NSSavePanel`, Linux the FileChooser
portal (`xdg-desktop-portal`) on the session bus.

```php
$target = vio_file_dialog($ctx, ['mode' => 'save', 'default_path' => 'export.png',
                                 'filters' => [['name' => 'PNG', 'extensions' => ['png']]]]);
if (is_array($target)) {
    vio_save_screenshot($ctx, $target[0]);
}
```

### vio_message_box

```php
int|false vio_message_box(VioContext|VioWindow $context, string $title, string $message, array $options = [])
```

Show a modal message box and return the index of the pressed button. Closing it with Escape picks
the last button. `false` when the platform has none.

| Option | Type | Description |
|---|---|---|
| `buttons` | list&lt;string&gt; | 1 to 3 labels, default `['OK']` |
| `kind` | string | `'info'` (default), `'warning'`, `'error'` or `'question'` |

```php
$choice = vio_message_box($ctx, 'Unsaved changes', 'Save before closing?',
                          ['buttons' => ['Save', 'Discard', 'Cancel'], 'kind' => 'question']);
if ($choice === 0) {
    // save
}
```

## Menus

### vio_menu_bar

```php
bool vio_menu_bar(VioContext $context, array $menus, callable $on_select)
```

Set the window's menu bar. `$menus` is a list of top-level menus `['label' => 'File', 'children' => […]]`.
An entry of `children` is one of:

| Entry | Keys |
|---|---|
| Item | `id` (string, unique in the bar), `label`, optional `shortcut`, `enabled` (bool), `checked` (bool) |
| Submenu | `label`, `children` |
| Separator | `['separator' => true]` |

A shortcut is modifiers and one key, joined with `+`: `Primary`, `Ctrl`, `Shift`, `Alt`, `Cmd`.
`Primary` is Cmd on macOS and Ctrl elsewhere. `$on_select` receives the chosen `id`. `[]` removes
the menu bar.

On macOS the bar is the application's menu, placed after an app menu php-vio adds (About, Hide,
Quit – Quit asks [`vio_on_close()`](/api/window#vio-on-close)). Linux and GLFW have no menu bar: the
call returns `false`, draw your own.

### vio_popup_menu

```php
string|false|null vio_popup_menu(VioContext $context, array $items, float $x, float $y)
```

Show a context menu (modal) at `$x`, `$y` in the cursor space of
[`vio_mouse_position()`](/api/mouse#vio-mouse-position). Items as in `vio_menu_bar()`. Returns the
chosen `id`, `null` when dismissed, `false` where the platform has none.

```php
[$x, $y] = vio_mouse_position($ctx);
$id = vio_popup_menu($ctx, [
    ['id' => 'cut',   'label' => 'Cut'],
    ['id' => 'copy',  'label' => 'Copy'],
    ['id' => 'paste', 'label' => 'Paste', 'enabled' => vio_clipboard_get() !== ''],
], $x, $y);
```

### vio_inject_menu

```php
bool vio_inject_menu(VioContext $context, string $id)
```

Choose a menu bar item through the same path as a click (tests). `false` when there is no such id
or no menu bar.

## Notifications and progress

### vio_notify

```php
bool vio_notify(string $title, string $body = '', array $options = [])
```

Show a desktop notification. Needs no context.

| Option | Type | Description |
|---|---|---|
| `id` | string | A key: a notification with the same id replaces the last one |
| `icon` | string | Linux: a path or a theme icon name |

`false` where there are none right now: Linux needs a notification service on the session bus,
macOS an app bundle. On Windows the notification is a balloon at the tray icon. The INI setting
`vio.app_id` (or the environment variable `VIO_APP_ID`) names the application on Linux.

```php
vio_notify('Export finished', 'video.mp4', ['id' => 'export']);
```

### vio_set_progress

```php
bool vio_set_progress(VioContext|VioWindow $context, ?float $progress, string $state = 'normal')
```

Progress on the window's taskbar button (Windows), the Dock icon (macOS) or the launcher entry
(Linux): `0.0` to `1.0`, `null` hides it. `$state` is `'normal'`, `'paused'`, `'error'` or
`'indeterminate'` (needs no value). Linux needs `vio.app_id`, the id of the application's
`.desktop` file.

```php
vio_set_progress($ctx, 0.4);
vio_set_progress($ctx, null, 'indeterminate');
vio_set_progress($ctx, null);          // hide
```

## Tray icon

### vio_tray

```php
bool vio_tray(array $options)
```

Show or update the process's tray icon – one per process, a further call changes it. Needs no
context.

| Option | Type | Description |
|---|---|---|
| `icon` | array | RGBA images as in [`vio_set_window_icon()`](/api/window#vio-set-window-icon); without it the platform's default |
| `tooltip` | string | Text shown on hover |
| `menu` | array | Items as in [`vio_popup_menu()`](#vio-popup-menu) |
| `on_select` | callable(string $id) | A menu choice |
| `on_click` | callable() | A click on the icon. Windows: left click; macOS and Linux open the menu instead |

`false` where there is no tray, for example Linux without a StatusNotifierWatcher (GNOME without an
extension). The icon goes away with `vio_tray_remove()` or at the end of the request.

```php
$icon = str_repeat("\x33\x99\xFF\xFF", 32 * 32);   // 32×32 RGBA, one colour
vio_tray([
    'icon'      => [['data' => $icon, 'width' => 32, 'height' => 32]],
    'tooltip'   => 'Editor',
    'menu'      => [['id' => 'show', 'label' => 'Show'], ['separator' => true], ['id' => 'quit', 'label' => 'Quit']],
    'on_select' => fn (string $id) => $id === 'quit' ? vio_close($ctx) : null,
]);
```

### vio_tray_remove

```php
bool vio_tray_remove()
```

Remove the tray icon; `false` when there was none.

## File drop

### vio_on_drop

```php
void vio_on_drop(VioContext|VioWindow $context, callable $callback)
```

Called when files are dropped on the window, with their paths (UTF-8) and the drop point in the
cursor space of `vio_mouse_position()`: `callable(list<string> $paths, float $x, float $y)`.

```php
vio_on_drop($ctx, function (array $paths, float $x, float $y) {
    foreach ($paths as $path) {
        echo "dropped $path at $x, $y\n";
    }
});
```

### vio_inject_drop

```php
void vio_inject_drop(VioContext|VioWindow $context, array $paths, float $x = 0.0, float $y = 0.0)
```

Drop files on the window through the same path as a real drop (tests, headless contexts).
`$paths` holds 1 to 4096 non-empty strings, anything else throws a `ValueError`.

## Other applications

### vio_open_url

```php
bool vio_open_url(string $url)
```

Open a URL in its default application (browser, mail client). The URL needs a scheme and must not
contain control characters; `file:` URLs are refused – both with a `ValueError`. Returns whether
the opener started. On macOS and Linux the environment variable `VIO_OPEN_COMMAND` replaces the
opener program.

### vio_reveal_file

```php
bool vio_reveal_file(string $path)
```

Show a file in the file manager: Explorer and Finder select it, Linux opens its folder. `false`
when the file does not exist.

```php
vio_open_url('https://github.com/phpolygon/php-vio');
vio_reveal_file(__FILE__);
```

## Accessibility

Screen readers see a window through a tree of nodes the application describes. php-vio hands it to
the platform through [AccessKit](https://accesskit.dev/): UI Automation on Windows, NSAccessibility
on macOS, AT-SPI on Linux. The extension must be built `--with-accesskit`;
`vio_platform_info()['accessibility']` says whether it is.

### vio_a11y_update

```php
bool vio_a11y_update(VioContext|VioWindow $context, array $update)
```

Send the window's accessibility tree or a change to it. The first update carries the nodes
(`root` defaults to the first one); later ones carry only the nodes that changed.

| Key of `$update` | Description |
|---|---|
| `nodes` | List of nodes |
| `root` | Id of the root node |
| `focus` | Id of the node that has keyboard focus |

| Key of a node | Description |
|---|---|
| `id` | string, unique in the tree |
| `role` | `'window'`, `'button'`, `'label'`, `'text_input'`, … |
| `label`, `description` | Text a screen reader speaks |
| `value` | string or number |
| `bounds` | `[x, y, width, height]` in window coordinates |
| `children` | Ids of the child nodes |
| `actions` | What the node accepts: `'click'`, `'focus'`, `'set_value'`, … |
| `checked` | `bool` or `'mixed'` |
| `disabled` | bool |
| `range` | `[min, max]` for a numeric value |

Children and `focus` must be nodes of the tree. `false` where accessibility is not available.

```php
vio_a11y_update($ctx, ['focus' => 'save', 'nodes' => [
    ['id' => 'root', 'role' => 'window', 'label' => 'Editor', 'children' => ['save']],
    ['id' => 'save', 'role' => 'button', 'label' => 'Save',
     'bounds' => [10, 10, 80, 24], 'actions' => ['click']],
]]);
```

### vio_on_a11y_action

```php
void vio_on_a11y_action(VioContext|VioWindow $context, callable $callback)
```

Called when assistive technology asks for an action on a node:
`callable(string $id, string $action, mixed $value)` – the node, the action (`'click'`, `'focus'`,
`'set_value'`, …) and its value (string, number or `null`).

```php
vio_on_a11y_action($ctx, function (string $id, string $action, mixed $value) {
    if ($id === 'save' && $action === 'click') {
        // the same code path as a mouse click on the button
    }
});
```

## Platform support

| | Windows | macOS | Linux (X11, Wayland) | GLFW |
|---|---|---|---|---|
| File dialog | ✅ | ✅ | ✅ with the FileChooser portal | ❌ |
| Message box | ✅ | ✅ | ❌ | ❌ |
| Menu bar, context menu | ✅ | ✅ | ❌ | ❌ |
| Notifications | ✅ (balloon) | ✅ in an app bundle | ✅ with a notification service | Linux only, as left |
| Progress | ✅ taskbar | ✅ Dock | ✅ launcher entry, needs `vio.app_id` | Linux only, as left |
| Tray icon | ✅ | ✅ | ✅ with a StatusNotifierWatcher | Linux only, as left |
| File drop | ✅ | ✅ | ✅ | ✅ |
| Accessibility (build `--with-accesskit`) | ✅ | ✅ | ✅ | macOS and Linux |

The table is a guide; `vio_platform_info()` is the answer for the running process. A build without
AccessKit reports `accessibility => false` on every platform.
