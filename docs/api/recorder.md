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
| `codec` | string | auto | Encoder name (e.g., `"h264_videotoolbox"`, `"libx264"`) |

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
