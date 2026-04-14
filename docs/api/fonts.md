# Fonts & Text

Functions for loading TrueType fonts and rendering text.

## vio_font

```php
VioFont|false vio_font(VioContext $context, string $path, float $size = 24.0)
```

Load a TTF font file and create a font atlas.

- `$path` — Path to a `.ttf` font file
- `$size` — Font size in pixels

The font atlas is a 4096x4096 texture generated using stb_truetype. It covers 9 Unicode ranges with ~33,000+ unique glyphs:

| Range | Description | Approx. Glyphs |
|---|---|---|
| U+0020–007F | Basic Latin | 96 |
| U+00A0–00FF | Latin Supplement | 96 |
| U+0100–017F | Latin Extended-A | 128 |
| U+0180–024F | Latin Extended-B | 208 |
| U+0370–03FF | Greek and Coptic | 135 |
| U+0400–04FF | Cyrillic | 256 |
| U+1E00–1EFF | Latin Extended Additional (Vietnamese) | 256 |
| U+3000–30FF | CJK Symbols, Hiragana, Katakana | 256 |
| U+4E00–9FFF | CJK Unified Ideographs | 20,992 |
| U+AC00–D7AF | Hangul Syllables | 11,172 |
| U+FF00–FFEF | Fullwidth Forms | 240 |

Glyph lookup uses a PHP HashTable internally for O(1) access, so rendering performance is independent of the number of loaded glyphs.

::: tip
If the loaded font file does not contain a glyph for a given Unicode code point, that character will be skipped during rendering.
:::

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

## Notes

- **Space glyph (U+0020):** As of v1.4.0, the space character is correctly included in the font atlas. Earlier versions omitted it, which could cause incorrect word spacing in rendered text.
