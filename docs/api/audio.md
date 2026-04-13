# Audio

Functions for audio playback, control, and 3D positioning.

## vio_audio_load

```php
VioSound|false vio_audio_load(string $path)
```

Load an audio file. Supported formats: WAV, MP3, FLAC, OGG Vorbis.

The miniaudio engine is lazily initialized on the first call.

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

- `($x, $y, $z)` — Listener position in world space
- `($fx, $fy, $fz)` — Forward direction vector
