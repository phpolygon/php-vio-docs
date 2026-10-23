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

### 2D and 3D sounds side by side

Every sound is spatialized by default. Music, UI clicks and voice-over should not be – switch them to 2D, then the listener can follow the camera without touching them (since v2.36):

```php
vio_audio_play($music, ['loop' => true, 'spatial' => false]);   // 2D: never attenuated or panned
vio_audio_play($engine, ['loop' => true, 'position' => [12, 0, -4], 'attenuation' => 'inverse',
                         'min_distance' => 2, 'max_distance' => 80]);

// each frame: listener = camera
vio_audio_listener($cam->x, $cam->y, $cam->z, $fwd->x, $fwd->y, $fwd->z, $up->x, $up->y, $up->z);
vio_audio_position($engine, $car->x, $car->y, $car->z);
```

`vio_audio_spatial($sound, false)` does the same for a sound that already plays; `vio_audio_spatial($sound, true, true)` places it relative to the listener (a sound that sits on the player's shoulder).

### Distance attenuation

`vio_audio_attenuation($sound, $model, …)` picks the OpenAL-style model (`none`, `inverse`, `linear`, `exponential`) with `min_distance`, `max_distance`, `rolloff` and a gain range. Arguments left `null` keep their value:

```php
vio_audio_attenuation($waterfall, 'linear', min_distance: 5, max_distance: 60);  // silent beyond 60 units
```

### Doppler

Give sources and the listener a velocity (world units per second) – the pitch follows:

```php
vio_audio_velocity($car, $vel->x, $vel->y, $vel->z);
vio_audio_listener_velocity($player->vx, $player->vy, $player->vz);
vio_audio_speed_of_sound(343.3);     // scale if a world unit is not a metre
vio_audio_doppler($ui, 0.0);         // per sound: 0 = off
```

### Live pitch and pan

`vio_audio_pitch($sound, 1.2)` and `vio_audio_pan($sound, -0.5)` change a playing sound – an engine that revs, a sound that drifts between speakers. `vio_audio_state($sound)` and `vio_audio_listener_state()` read everything back.

## Offline rendering and tests

`vio_audio_init(['device' => false])` starts an engine without any device; `vio_audio_render($frames)` mixes the next frames and returns interleaved float PCM. Nothing runs in the background, so the result is the same on every machine – for audio regression tests or rendering a mix to a file:

```php
vio_audio_init(['device' => false, 'sample_rate' => 48000]);
$s = vio_audio_load('siren.ogg');
vio_audio_play($s, ['position' => [0, 0, -50], 'velocity' => [0, 0, 100]]);  // approaching: pitched up
$pcm = unpack('g*', vio_audio_render(48000));
```

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
