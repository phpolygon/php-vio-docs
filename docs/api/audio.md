# Audio

Functions for audio playback, control, and 3D positioning.

## vio_audio_load

```php
VioSound|false vio_audio_load(string $path)
```

Load an audio file. Supported formats: WAV, MP3, FLAC, Ogg Vorbis, Ogg Opus.

The miniaudio engine is lazily initialized on the first call. Ogg files and paths through a PHP stream wrapper (`phar://`, `data://`, …) are read into memory and decoded from there, so audio packed into a PHAR plays directly.

## vio_audio_init

```php
bool vio_audio_init(array $options = [])
```

Start the audio engine explicitly – before the first sound; otherwise `vio_audio_load()` starts it with the default backends.

| Option | Type | Description |
|---|---|---|
| `backends` | list&lt;string&gt; | miniaudio backends to try in order: `wasapi`, `dsound`, `winmm`, `coreaudio`, `sndio`, `audio4`, `oss`, `pulseaudio`, `alsa`, `jack`, `aaudio`, `opensl`, `webaudio`, `null` |
| `device` | bool | `false` starts an **offline engine** without any device: the mix only advances through [`vio_audio_render()`](#vio-audio-render) (since v2.36). Excludes `backends`. |
| `sample_rate` | int | Offline engine only: 8000–384000 (default 44100) |
| `channels` | int | Offline engine only: 1–8 (default 2) |

`null` is a device without hardware: it pulls audio on its own real-time clock, so loading, decoding, resampling and mixing run exactly as with a sound card – for headless servers and CI runners without one.

Without `backends`, the environment variable `VIO_AUDIO_BACKEND` (comma list, e.g. `null` or `pulseaudio,alsa,null`) decides; without it, miniaudio's default order. Returns `false` with a warning when the engine cannot start, or when it already runs and `backends` was given. An unknown backend name throws `ValueError`.

```php
// CI / headless: play through the null device
vio_audio_init(['backends' => ['null']]);
// or: VIO_AUDIO_BACKEND=null php game.php
```

## vio_audio_backend

```php
string|false vio_audio_backend()
```

The backend the engine plays through (`wasapi`, `coreaudio`, `pulseaudio`, `alsa`, `null`, …), `offline` for an engine started with `['device' => false]`, `false` before the engine is started.

## vio_audio_backends

```php
array vio_audio_backends()
```

The backends compiled into this build, in default priority order (`null` last).

## vio_audio_load_data

```php
VioSound|false vio_audio_load_data(string $data)
```

Load a sound from encoded bytes (any format `vio_audio_load()` reads). The sound keeps the bytes until it is freed. An empty string throws `ValueError`.

## vio_audio_formats

```php
array vio_audio_formats()
```

What this build can decode and encode, plus the codec library versions. Use it to check whether the runtime plays Opus before choosing an asset format:

```php
[
    'decode'   => ['wav', 'flac', 'mp3', 'vorbis', 'opus'],
    'encode'   => ['opus', 'vorbis'],
    'versions' => ['opus' => 'libopus 1.5.2', 'vorbis' => 'Xiph.Org libVorbis 1.3.7'],
]
```

Releases before Opus/Vorbis support do not have this function: `function_exists('vio_audio_formats')` is the feature test.

## vio_audio_info

```php
array|false vio_audio_info(string $source, array $options = [])
```

Probe a file without an audio device. `$source` is a path (any stream wrapper) or, with `['data' => true]`, the encoded bytes.

| Key | Type | Description |
|---|---|---|
| `format` | string | `wav`, `flac`, `mp3`, `vorbis` or `opus` |
| `channels` | int | Channel count |
| `sample_rate` | int | Rate of the decoded PCM (Opus always decodes at 48000) |
| `input_sample_rate` | int | Opus: rate the encoder was fed (from the `OpusHead`); otherwise `sample_rate` |
| `frames` | int | Length in PCM frames at `sample_rate` (sample-exact for Ogg: pre-skip and end trim applied) |
| `duration` | float | Seconds |

Returns `false` with a warning when the data cannot be decoded.

## vio_audio_decode

```php
array|false vio_audio_decode(string $source, array $options = [])
```

Decode to interleaved PCM without an audio device. Returns the `vio_audio_info()` fields plus `pcm`.

| Option | Type | Default | Description |
|---|---|---|---|
| `data` | bool | `false` | `$source` holds the encoded bytes instead of a path |
| `format` | string | `'s16'` | `'s16'` (signed 16-bit little endian, `unpack('s*')`) or `'f32'` (32-bit float, `unpack('g*')`) |

## vio_audio_encode

```php
string|false vio_audio_encode(string $pcm, int $sampleRate, int $channels, string $codec = 'opus', array $options = [])
```

Encode interleaved signed 16-bit little-endian PCM (`pack('s*', ...)`, 1 or 2 channels) to an Ogg Opus (`.opus`) or Ogg Vorbis (`.ogg`) file. The bytes are deterministic: the same input and options give the same file (the Ogg serial number is derived from the PCM unless `serial` is set), so build caches and reproducible builds work.

**Opus** (`$sampleRate` must be 8000, 12000, 16000, 24000 or 48000 – resample other rates first):

| Option | Type | Default | Description |
|---|---|---|---|
| `bitrate` | int | 48000 mono / 96000 stereo | Bits per second (500–512000) |
| `application` | string | `'audio'` | `'audio'`, `'voip'` (speech) or `'lowdelay'` |
| `signal` | string | `'auto'` | `'auto'`, `'voice'` or `'music'` |
| `complexity` | int | `10` | 0–10 |
| `vbr` | bool | `true` | Variable bitrate |
| `frame_ms` | int | `20` | 10, 20, 40 or 60 |
| `serial` | int | from the PCM | Ogg stream serial |

The `OpusHead` records `$sampleRate` as the input rate; playback is always 48 kHz. The encoder delay is written as pre-skip and the last page trims the padding, so decoding gives back exactly the input length.

**Vorbis** (any rate):

| Option | Type | Default | Description |
|---|---|---|---|
| `quality` | float | `0.5` | −0.1 … 1.0 (0.5 ≙ `oggenc -q5`) |
| `bitrate` | int | – | Managed average bitrate instead of quality mode |
| `serial` | int | from the PCM | Ogg stream serial |

Invalid arguments (channels, PCM length, codec, option names/types) throw `ValueError`/`TypeError`; encoder errors (unsupported rate, quality out of range) return `false` with a warning.

```php
// Speech: 32 kbps Opus at 24 kHz
$opus = vio_audio_encode($pcm24k, 24000, 1, 'opus', ['bitrate' => 32000, 'application' => 'voip', 'signal' => 'voice']);
file_put_contents('line.opus', $opus);

// Music: Vorbis q5
file_put_contents('theme.ogg', vio_audio_encode($pcm44k, 44100, 2, 'vorbis', ['quality' => 0.5]));
```

## vio_audio_play

```php
void vio_audio_play(VioSound $sound, ?array $opts = null)
```

Start playing a sound.

**Options:**

| Key | Type | Default | Description |
|---|---|---|---|
| `volume` | float | `1.0` | Volume (0.0 = silent, 1.0 = full) |
| `loop` | bool | `false` | Loop playback |
| `pan` | float | `0.0` | Stereo pan (-1.0 left, 0.0 center, 1.0 right) |
| `pitch` | float | `1.0` | Playback speed multiplier |
| `spatial` | bool | `true` | `false` = plain 2D sound: the listener neither attenuates nor pans it (music, UI, voice-over) |
| `relative` | bool | `false` | Position is relative to the listener |
| `position` / `velocity` / `direction` | [x, y, z] | – | As [`vio_audio_position()`](#vio-audio-position), [`vio_audio_velocity()`](#vio-audio-velocity-vio-audio-doppler), [`vio_audio_direction()`](#vio-audio-direction-vio-audio-cone); a list or `x`/`y`/`z` keys |
| `doppler` | float | `1.0` | Doppler factor |
| `attenuation` | string | `'inverse'` | `none`, `inverse`, `linear`, `exponential` |
| `min_distance`, `max_distance`, `rolloff`, `min_gain`, `max_gain` | float | 1, ∞, 1, 0, 1 | See [`vio_audio_attenuation()`](#vio-audio-attenuation) |

The spatial options (since v2.36) are validated before anything changes: an invalid one throws `ValueError`/`TypeError` and the sound neither changes nor starts.

## vio_audio_stop

```php
void vio_audio_stop(VioSound $sound)
```

Stop playback and rewind to the beginning.

## vio_audio_pause

```php
void vio_audio_pause(VioSound $sound)
```

Pause playback at the current position.

## vio_audio_resume

```php
void vio_audio_resume(VioSound $sound)
```

Resume playback from the paused position.

## vio_audio_volume

```php
void vio_audio_volume(VioSound $sound, float $volume)
```

Set volume. Range: `0.0` (silent) to `1.0` (full).

## vio_audio_playing

```php
bool vio_audio_playing(VioSound $sound)
```

Returns `true` if the sound is currently playing.

## vio_audio_position

```php
void vio_audio_position(VioSound $sound, float $x, float $y, float $z)
```

Set the 3D position of a sound source for spatial audio.

## vio_audio_listener

```php
void vio_audio_listener(float $x, float $y, float $z, float $forward_x, float $forward_y, float $forward_z,
                        ?float $up_x = null, ?float $up_y = null, ?float $up_z = null)
```

Set the listener position and forward direction for 3D audio.

- `($x, $y, $z)` – Listener position in world space
- `($forward_x, $forward_y, $forward_z)` – Forward direction vector
- `($up_x, $up_y, $up_z)` – optional up vector (since v2.36, default +Y). Give all three or none; without them the current up vector stays. A zero vector or a partial one throws `ValueError`.

Warns when the audio engine has not started yet (load a sound or call `vio_audio_init()` first).

## Live sound parameters

Since v2.36 every parameter can change while the sound plays. All of them ignore a `VioSound` that never loaded.

### vio_audio_pitch

```php
void vio_audio_pitch(VioSound $sound, float $pitch)
```

Playback speed/pitch (1.0 = original, 2.0 = one octave up). Must be finite and > 0 (`ValueError` otherwise).

### vio_audio_pan

```php
void vio_audio_pan(VioSound $sound, float $pan)
```

Stereo pan, −1.0 (left) to 1.0 (right), clamped. Applied after spatialization.

### vio_audio_spatial

```php
void vio_audio_spatial(VioSound $sound, bool $enabled, ?bool $relative = null)
```

Switch 3D spatialization on or off. Off = plain 2D sound: the listener neither attenuates nor pans it, wherever it is – so music and UI sounds stay untouched while the listener follows the camera. `$relative = true` positions the sound relative to the listener (it moves with it); `null` keeps the current setting.

### vio_audio_attenuation

```php
void vio_audio_attenuation(VioSound $sound, string $model, ?float $min_distance = null, ?float $max_distance = null,
                           ?float $rolloff = null, ?float $min_gain = null, ?float $max_gain = null)
```

Distance attenuation (OpenAL clamped models). Arguments left `null` keep their value.

| Model | Gain at distance d (clamped to min…max distance) |
|---|---|
| `none` | 1 (no attenuation, no spatial panning) |
| `inverse` (default) | min / (min + rolloff · (d − min)) |
| `linear` | 1 − rolloff · (d − min) / (max − min) |
| `exponential` | (d / min)^−rolloff |

The gain is then clamped to `min_gain`…`max_gain`. Defaults: `min_distance` 1, `max_distance` `INF`, `rolloff` 1, `min_gain` 0, `max_gain` 1. An unknown model, a negative value or `max < min` throws `ValueError` and changes nothing.

### vio_audio_velocity / vio_audio_doppler

```php
void vio_audio_velocity(VioSound $sound, float $x, float $y, float $z)
void vio_audio_doppler(VioSound $sound, float $factor)
```

Source velocity in world units per second and the Doppler factor (0 = off, 1 = physical, default 1). The pitch shift follows OpenAL: (c − f·v<sub>listener</sub>) / (c − f·v<sub>source</sub>), velocities projected onto the line between them.

### vio_audio_direction / vio_audio_cone

```php
void vio_audio_direction(VioSound $sound, float $x, float $y, float $z)
void vio_audio_cone(VioSound $sound, float $inner_angle, float $outer_angle, float $outer_gain)
```

Directional source: full volume inside `$inner_angle`, `$outer_gain` outside `$outer_angle`, interpolated between. Angles in radians (0…2π, outer ≥ inner), gain 0…1.

### vio_audio_state

```php
array vio_audio_state(VioSound $sound)
```

Current parameters: `loaded`, `playing`, `looping`, `volume`, `pitch`, `pan`, `spatial`, `relative`, `position`, `velocity`, `direction` (each `[x, y, z]`), `doppler`, `attenuation`, `min_distance`, `max_distance` (`INF` when unlimited), `rolloff`, `min_gain`, `max_gain`, `cone` (`inner_angle`, `outer_angle`, `outer_gain`), `cursor` and `length` (seconds). A sound that never loaded gives `['loaded' => false]`.

## Listener

### vio_audio_listener_velocity

```php
void vio_audio_listener_velocity(float $x, float $y, float $z)
```

Listener velocity in world units per second (Doppler).

### vio_audio_speed_of_sound

```php
void vio_audio_speed_of_sound(float $speed)
```

Speed of sound for the Doppler effect in world units per second (default 343.3 – metres). Scale it when a world unit is not a metre.

### vio_audio_listener_state

```php
array|false vio_audio_listener_state()
```

`position`, `direction`, `up`, `velocity` (each `[x, y, z]`), `speed_of_sound`, `sample_rate`, `channels` – or `false` before the engine started.

## vio_audio_render

```php
string|false vio_audio_render(int $frames)
```

Mix the next `$frames` frames of an offline engine (`vio_audio_init(['device' => false])`) and return them as interleaved 32-bit float PCM (`unpack('g*', …)`). The mix advances only through this call, so it is deterministic – for audio tests and offline rendering. Returns `false` with a warning on a device engine. 0…2 880 000 frames per call.

```php
vio_audio_init(['device' => false]);
$s = vio_audio_load('engine.wav');
vio_audio_play($s, ['loop' => true, 'position' => [0, 0, -10]]);
$pcm = unpack('g*', vio_audio_render(44100));   // one second, L R L R …
```
