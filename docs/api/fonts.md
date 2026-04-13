# Fonts & Text

Functions for loading TrueType fonts and rendering text.

## vio_font

```php
VioFont|false vio_font(VioContext $context, string $path, float $size = 24.0)
```

Load a TTF font file and create a font atlas.

- `$path` — Path to a `.ttf` font file
- `$size` — Font size in pixels

The font atlas is a 512x512 texture generated using stb_truetype.

## vio_text

```php
void vio_text(VioContext $ctx, VioFont $font, string $text, float $x, float $y, ?array $opts = null)
```

Queue text for 2D rendering. Text is rendered as part of the 2D batch (flushed by `vio_draw_2d()`).

**Options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `color` | int | `0xFFFFFFFF` | Text color (AARRGGBB) |
| `z` | float | `0.0` | Z-order for sorting |

```php
$font = vio_font($ctx, "/System/Library/Fonts/Helvetica.ttc", 32.0);

vio_text($ctx, $font, "Score: 42", 10, 40, [
    "color" => 0xFFFF00FF,  // Yellow
    "z"     => 10.0,        // On top of everything
]);
```

## vio_text_measure

```php
array|false vio_text_measure(VioFont $font, string $text)
```

Measure the dimensions of a text string without rendering it.

**Returns:**

```php
[
    "width"  => 142.5,  // float, pixels
    "height" => 32.0,   // float, pixels
]
```

```php
$size = vio_text_measure($font, "Hello, World!");
$centerX = (800 - $size["width"]) / 2;
vio_text($ctx, $font, "Hello, World!", $centerX, 300);
```
