# Audio

php-vio includes an audio engine powered by [miniaudio](https://miniaud.io/). It supports playback, volume control, looping, and 3D positional audio.

## Supported Formats

- WAV
- MP3
- FLAC
- Ogg Vorbis
- Ogg Opus

Ogg Vorbis and Ogg Opus come from the Xiph reference libraries (libvorbis, libopus, opusfile, libogg – all BSD-3-Clause), compiled into the extension, so every build and the static runtimes can play them. `vio_audio_formats()` lists what the running build decodes and encodes.

### Choosing a format

| Content | Recommended | Why |
|---|---|---|
| Speech / dialogue | Opus, 24 kHz mono, 24–48 kbps, `application => 'voip'` | ~10 % of the FLAC size, built for speech |
| Music, loops | Vorbis q5 or Opus 96–128 kbps | gapless loops (pre-skip / exact length), ~20–30 % of FLAC |
| Short UI sounds | WAV | no decode cost, tiny anyway |

Both codecs decode sample-exactly to the encoded length, so `loop => true` has no gap.

## Encoding at build time

`vio_audio_encode()` turns 16-bit PCM into `.opus` / `.ogg` without any external tool, and `vio_audio_decode()` / `vio_audio_info()` read files back without an audio device – useful in asset pipelines and tests:

```php
$opus = vio_audio_encode($pcm, 24000, 1, 'opus', ['bitrate' => 32000, 'application' => 'voip']);
$info = vio_audio_info($opus, ['data' => true]);   // ['format' => 'opus', 'sample_rate' => 48000, 'input_sample_rate' => 24000, ...]
```

Opus only takes 8/12/16/24/48 kHz input – resample first. The output is deterministic for the same input and options.

## Loading from memory or a PHAR

```php
$sound = vio_audio_load('phar://game.phar/assets/audio/theme.ogg'); // stream wrappers work
$sound = vio_audio_load_data($bytes);                               // or hand over the bytes
```

## Loading and Playing

```php
$music = vio_audio_load("background.mp3");

vio_audio_play($music, [
    "volume" => 0.8,
    "loop"   => true,
]);
```

### Play Options

| Option | Type | Default | Description |
|---|---|---|---|
| `volume` | float | `1.0` | Volume (0.0 = silent, 1.0 = full) |
| `loop` | bool | `false` | Loop playback |
| `pan` | float | `0.0` | Stereo pan (-1.0 left, 0.0 center, 1.0 right) |
| `pitch` | float | `1.0` | Playback speed/pitch multiplier |

## Playback Control

```php
vio_audio_pause($sound);
vio_audio_resume($sound);
vio_audio_stop($sound);    // Stops and rewinds

// Check if playing
if (vio_audio_playing($sound)) {
    // ...
}
```

## Volume

```php
vio_audio_volume($sound, 0.5);  // Set to 50%
```

## 3D Positional Audio

Position sounds in 3D space relative to a listener:

```php
// Set listener position and forward direction
vio_audio_listener(
    0.0, 1.0, 0.0,     // Position (x, y, z)
    0.0, 0.0, -1.0     // Forward direction
);

// Position a sound source
vio_audio_position($sound, 10.0, 0.0, -5.0);
```

The audio engine automatically computes volume attenuation and stereo panning based on the distance and direction between the listener and the sound source.

## Lazy Initialization

The miniaudio engine is initialized on the first call to `vio_audio_load()`. If your application doesn't use audio, no audio resources are allocated.

## Example: Sound Effects

```php
$shoot = vio_audio_load("shoot.wav");
$hit   = vio_audio_load("hit.wav");

// In game loop
if (vio_key_just_pressed($ctx, VIO_KEY_SPACE)) {
    vio_audio_play($shoot, ["volume" => 0.6]);
}

// Multiple instances play concurrently
if ($collision) {
    vio_audio_play($hit, ["volume" => 0.4, "pitch" => 0.8 + random(0.4)]);
}
```
