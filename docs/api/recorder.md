# Video Recording

Functions for recording rendering output to video files.

Requires `--with-ffmpeg` at build time.

## vio_recorder

```php
VioRecorder|false vio_recorder(VioContext $context, array $config)
```

Create a video recorder.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `path` | string | required | Output file path (e.g., `"output.mp4"`) |
| `fps` | int | `30` | Frames per second |
| `encoder` | string | `"auto"` | `"auto"`: the platform's hardware encoders (Windows NVENC → AMF → QSV → Media Foundation, Apple VideoToolbox, Linux NVENC), then libx264; `"hardware"`: no software fallback; `"software"`: libx264; or an FFmpeg encoder name (`"h264_nvenc"`, `"libx264"`, …) |
| `codec` | string | – | Older spelling of `encoder` |

On D3D11 a hardware encoder that takes D3D11 frames (NVENC, AMF) gets each frame without a CPU copy (`vio_recorder_info()['zero_copy']`); the other backends read the frame back. `VIO_DEBUG_ENCODE=1` shows why an encoder or the zero-copy path was not used.

## vio_recorder_capture

```php
bool vio_recorder_capture(VioRecorder $recorder, VioContext $context)
```

Capture the current framebuffer as one video frame. Call once per frame after `vio_end()`.

Returns `true` on success.

## vio_recorder_stop

```php
void vio_recorder_stop(VioRecorder $recorder)
```

Finalize the video file. Writes remaining frames and closes the container. Must be called before the recorder is garbage-collected.

## vio_recorder_info

```php
array|false vio_recorder_info(VioRecorder $recorder)
```

What the recorder runs with:
`['encoder' => string, 'hardware' => bool, 'zero_copy' => bool, 'frames' => int, 'width' => int, 'height' => int, 'fps' => int, 'recording' => bool]`
– `encoder` is the FFmpeg encoder name.

```php
$rec = vio_recorder($ctx, ['path' => 'out.mp4', 'fps' => 60]);
// ... vio_recorder_capture() per frame ...
$info = vio_recorder_info($rec);   // e.g. ['encoder' => 'h264_nvenc', 'hardware' => true, 'zero_copy' => true, …]
vio_recorder_stop($rec);
```

## vio_video_info

```php
array|false vio_video_info(string $path)
```

Facts of a video file: `['width', 'height', 'frames', 'fps', 'codec']` – `frames` are decoded and
counted. `false` when the file is no video FFmpeg can read. No context needed.

## vio_video_frame

```php
array|false vio_video_frame(string $path, int $index)
```

Frame `$index` of a video decoded to RGBA: `['width', 'height', 'data']`; `false` past the end.
No context needed – handy for checking a recording in a test, or for feeding video frames into a
texture with [`vio_texture_update()`](/api/textures#vio-texture-update).

```php
$info  = vio_video_info('out.mp4');            // ['width' => 1280, 'height' => 720, 'frames' => 300, 'fps' => 60, 'codec' => 'h264']
$frame = vio_video_frame('out.mp4', 12);
$tex   = vio_texture($ctx, ['data' => $frame['data'], 'width' => $frame['width'], 'height' => $frame['height']]);
```