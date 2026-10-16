# Fonts & Text

Functions for loading TrueType fonts and rendering text.

## vio_font

```php
VioFont|false vio_font(VioContext $context, string $path, float $size = 24.0, float $scale = 1.0)
```

Load a TTF font file and create a font atlas.

- `$path` – Path to a `.ttf` / `.otf` font file
- `$size` – Font size in logical pixels
- `$scale` – Device pixel ratio: the atlas is rasterized at `$size * $scale` physical pixels while every metric (`vio_text` positions, `vio_text_measure` results) stays in logical `$size` units, so text stays crisp when a transform magnifies it. Values < 1 are clamped to 1.0

With HarfBuzz shaping (`VIO_HAS_SHAPING === 1`) the atlas is keyed by glyph index and fills on demand on every backend: `vio_text` rasterizes new glyphs and uploads only the rectangle they dirtied, `vio_text_measure` rasterizes nothing ([`vio_font_info()`](#vio-font-info)). Without HarfBuzz the legacy path packs a 4096 × 4096 stb_truetype atlas with these Unicode ranges up front:

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
| `max_width` | float | – | HarfBuzz: word-wrap at this width (UAX #14-lite breaks: spaces, between CJK ideographs, Thai clusters) |
| `line_height` | float | natural | HarfBuzz: line pitch for `\n` and wrapped lines |
| `vertical` | bool | `false` | HarfBuzz: top-to-bottom columns with upright glyphs and vertical forms; `(x, y)` is the top-right corner, `\n` starts the next column to the left, `line_height` is the column pitch, `max_width` is ignored |

With HarfBuzz, `\n` always starts a new line and text is bidi-resolved and shaped (Arabic joining, ligatures, marks).

```php
$font = vio_font($ctx, "/System/Library/Fonts/Helvetica.ttc", 32.0);

vio_text($ctx, $font, "Score: 42", 10, 40, [
    "color" => 0xFFFF00FF,  // Yellow
    "z"     => 10.0,        // On top of everything
]);
```

## vio_text_measure

```php
array|false vio_text_measure(VioFont $font, string $text, ?array $options = null)
```

Measure the dimensions of a text string without rendering it. Pass the same wrapping options as `vio_text()` (`max_width`, `line_height`, `vertical`) to measure wrapped, multi-line or vertical text; `lines` is only meaningful with shaping (vertical: columns).

**Returns:**

```php
[
    "width"  => 142.5,  // float, pixels
    "height" => 32.0,   // float, pixels
    "lines"  => 1,      // int
]
```

```php
$size = vio_text_measure($font, "Hello, World!");
$centerX = (800 - $size["width"]) / 2;
vio_text($ctx, $font, "Hello, World!", $centerX, 300);
```

## vio_font_has_glyph

```php
bool vio_font_has_glyph(VioFont $font, int $codepoint)
```

`true` if `$font` carries a real glyph for the Unicode `$codepoint`. Reliable coverage detection for
font-fallback routing: unlike the advance width (a font's `.notdef` box can measure non-zero on some
FreeType builds), this reports actual glyph presence through the HarfBuzz nominal-glyph lookup, so a
fallback chain never lets the primary font claim an uncovered codepoint.

```php
$font = vio_font_has_glyph($latin, mb_ord('Ж')) ? $latin : $cyrillicFallback;
```

## vio_font_info

```php
array|false vio_font_info(VioFont $font)
```

The glyph atlas of a font: `['glyphs' => int, 'rasterized' => int, 'atlas_size' => int, 'lazy' => bool]`
– `glyphs` in the face (legacy path: packed codepoints), `rasterized` glyphs in the atlas so far,
`atlas_size` the side in pixels, `lazy` whether the atlas fills on demand (HarfBuzz builds, every
backend). `false` for an invalid font.

## vio_font_load_async

```php
resource|false vio_font_load_async(VioContext $context, string $path, float $size = 24.0, float $scale = 1.0)
```

Start loading a TTF / OTF font on a background thread. Reading the file and rasterizing the glyph
atlas run on a worker, so loading large fallback fonts (CJK faces of ~13 MB / ~32k glyphs) does not
stall the render thread. `$size` and `$scale` as for [`vio_font()`](#vio-font). Returns a handle
for `vio_font_load_poll()`, or `false` on failure.

## vio_font_load_poll

```php
VioFont|null|false vio_font_load_poll(resource $handle)
```

Poll an async font load: `null` while it is still loading, `false` on failure, or a ready
`VioFont` – interchangeable with one from `vio_font()`. The atlas is uploaded to the GPU inside this
call, so it must run on the render thread.

```php
$h = vio_font_load_async($ctx, 'NotoSansSC-Regular.otf', 24.0, vio_pixel_ratio($ctx));
while (true) {
    $font = vio_font_load_poll($h);
    if ($font !== null) break;      // VioFont or false
    renderLoadingScreen($ctx);
}
```

## vio_font_face

```php
VioFontFace|false vio_font_face(string $path)
```

Load a font file as a `VioFontFace` for [`vio_text_bitmap()`](#vio-text-bitmap). Unlike
`vio_font()` it builds no glyph atlas and needs no context, so it is cheap even for a large CJK face
and works without a GPU (build tools, worker processes). TrueType, OpenType (CFF) and the first face
of a collection (`.ttc`) are read; stream wrappers such as `phar://` work.

## vio_font_face_has_glyph

```php
bool vio_font_face_has_glyph(VioFontFace $face, int $codepoint)
```

`true` if `$face` carries a real glyph for the Unicode `$codepoint`.

## vio_text_bitmap

```php
array|false vio_text_bitmap(VioFontFace|array $faces, string $text, float $size, ?array $options = null)
```

Lay out one line of text and rasterize it into an 8-bit coverage bitmap on the CPU – no context,
no GPU.

- `$faces` – a `VioFontFace` or a fallback chain (`list<VioFontFace>`): the first face that covers
  a codepoint claims it, and a segment keeps its face while that face covers the next codepoint.
- `$size` – pixels per em.
- `$options` – `['measure' => true]` returns the metrics without `'data'`.

With HarfBuzz (`VIO_HAS_SHAPING`) the line is bidi-resolved and shaped like `vio_text()` (Arabic
joining, ligatures, marks); without it glyphs are placed left to right with kerning.

**Returns** `['width' => int, 'height' => int, 'origin_x' => int, 'baseline' => int, 'advance' => float, 'data' => string]`.
The bitmap is row-major, top row first, one byte per pixel. Draw it with its pen origin at column
`origin_x` and its baseline at row `baseline`; `advance` is the pen advance of the whole line. Text
without ink (spaces) has width and height 0.

```php
$chain = [vio_font_face('Inter-Regular.ttf'), vio_font_face('NotoSansSC-Regular.otf')];
$bmp = vio_text_bitmap($chain, 'Hello 世界', 32.0);

// expand coverage to white RGBA with alpha and upload it
$rgba = '';
for ($i = 0, $n = $bmp['width'] * $bmp['height']; $i < $n; $i++) {
    $rgba .= "\xFF\xFF\xFF" . $bmp['data'][$i];
}
$label = vio_texture($ctx, ['data' => $rgba, 'width' => $bmp['width'], 'height' => $bmp['height']]);
```
## Notes

- **Space glyph (U+0020):** As of v1.4.0, the space character is correctly included in the font atlas. Earlier versions omitted it, which could cause incorrect word spacing in rendered text.

- **Atlas warm-up:** Glyphs are rasterised into the atlas the first time they are drawn at a given font + size, so the first frame that renders a new size (or a new script) pays a one-time upload cost that can show as a hitch. Warm the atlas at load time by measuring a representative string for every font/size you use:

  ```php
  $sizes = [12.0, 16.0, 24.0, 32.0];
  foreach ($sizes as $size) {
      $font = vio_font($ctx, "/path/to/font.ttf", $size);
      if ($font !== false) {
          vio_text_measure($font, "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789");
      }
  }
  ```
