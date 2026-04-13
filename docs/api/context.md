# Context & Frame

The `VioContext` is the central object in php-vio. It represents a GPU context, window, and all associated state.

## vio_create

Create a new rendering context.

```php
VioContext|false vio_create(string $backend = "auto", array $options = [])
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `$backend` | string | `"auto"` | Backend name: `"auto"`, `"opengl"`, `"vulkan"`, `"metal"`, `"null"` |
| `$options` | array | `[]` | Context options (see below) |

**Options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `width` | int | `800` | Window width in screen coordinates |
| `height` | int | `600` | Window height in screen coordinates |
| `title` | string | `"vio"` | Window title |
| `vsync` | bool | `true` | Enable vertical sync |
| `samples` | int | `0` | MSAA sample count (0 = disabled) |
| `debug` | bool | `false` | Enable debug output |
| `headless` | bool | `false` | Create without visible window |

**Returns:** `VioContext` on success, `false` on failure.

```php
$ctx = vio_create("opengl", [
    "width"  => 1280,
    "height" => 720,
    "title"  => "My App",
    "vsync"  => true,
]);
```

## vio_destroy

Destroy a context and free all associated GPU resources.

```php
void vio_destroy(VioContext $context)
```

All meshes, shaders, textures, and other resources created with this context are also freed.

## vio_begin

Start a new frame. Must be paired with `vio_end()`.

```php
void vio_begin(VioContext $context)
```

## vio_end

End the current frame and present to screen.

```php
void vio_end(VioContext $context)
```

## vio_clear

Clear the framebuffer with a solid color.

```php
void vio_clear(VioContext $context, float $r, float $g, float $b, float $a = 1.0)
```

Color components are in the range `0.0` to `1.0`.

## vio_should_close

Check if the window should close (user clicked close button or `vio_close()` was called).

```php
bool vio_should_close(VioContext $context)
```

## vio_close

Request the window to close. The next call to `vio_should_close()` will return `true`.

```php
void vio_close(VioContext $context)
```

## vio_poll_events

Process pending window and input events. Must be called every frame.

```php
void vio_poll_events(VioContext $context)
```

## Frame Loop Pattern

```php
$ctx = vio_create("opengl", ["width" => 800, "height" => 600]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);

    // ... render ...

    vio_end($ctx);
    vio_poll_events($ctx);
}

vio_destroy($ctx);
```
