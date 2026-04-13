# Headless & Screenshots

Functions for framebuffer capture and visual regression testing.

## vio_read_pixels

```php
string|false vio_read_pixels(VioContext $context)
```

Read the current framebuffer as raw RGBA pixel data.

Returns a binary string of `width * height * 4` bytes, or `false` on failure.

::: info
Currently only implemented for the OpenGL backend. Vulkan and Metal return stubs.
:::

## vio_save_screenshot

```php
bool vio_save_screenshot(VioContext $context, string $path)
```

Save the current framebuffer as a PNG file.

## vio_compare_images

```php
array|false vio_compare_images(string $reference, string $current, ?array $opts = null)
```

Compare two PNG images for visual regression testing.

**Options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `threshold` | float | `0.0` | Maximum allowed diff ratio (0.0 = exact match, 0.01 = 1%) |

**Returns:**

```php
[
    "passed"      => bool,    // Did the comparison pass?
    "diff_ratio"  => float,   // Ratio of differing pixels (0.0 to 1.0)
    "diff_pixels" => int,     // Number of differing pixels
    "width"       => int,     // Image width
    "height"      => int,     // Image height
    "diff_data"   => string,  // Raw RGBA diff image data
]
```

## vio_save_diff_image

```php
bool vio_save_diff_image(array $diff, string $path)
```

Save a diff visualization as a PNG file. The `$diff` parameter is the array returned by `vio_compare_images()`.

## Example: Visual Regression Test

```php
$ctx = vio_create("opengl", [
    "width" => 256, "height" => 256, "headless" => true,
]);

// Render scene
vio_begin($ctx);
vio_clear($ctx, 0.2, 0.2, 0.2, 1.0);
vio_rect($ctx, 10, 10, 100, 100, ["color" => 0xFF0000FF]);
vio_draw_2d($ctx);
vio_end($ctx);

// Save and compare
vio_save_screenshot($ctx, "current.png");

$diff = vio_compare_images("reference.png", "current.png", [
    "threshold" => 0.005,
]);

if (!$diff["passed"]) {
    vio_save_diff_image($diff, "diff.png");
    echo "FAIL: {$diff['diff_ratio']}% pixels differ\n";
    exit(1);
}

echo "PASS\n";
```
