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

The backend the engine plays through (`wasapi`, `coreaudio`, `pulseaudio`, `alsa`, `null`, …), `false` before the engine is started.

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
void vio_audio_listener(float $x, float $y, float $z, float $fx, float $fy, float $fz)
```

Set the listener position and forward direction for 3D audio.

- `($x, $y, $z)` – Listener position in world space
- `($fx, $fy, $fz)` – Forward direction vector
