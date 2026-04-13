# Video Recording

php-vio can record your rendering output to H.264/MP4 video files using FFmpeg. Hardware-accelerated encoding is supported via VideoToolbox on macOS.

## Requirements

Build with `--with-ffmpeg` to enable recording.

## Recording

```php
$rec = vio_recorder($ctx, [
    "path" => "output.mp4",
    "fps"  => 30,
]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    // ... render scene ...
    vio_end($ctx);

    // Capture each frame
    vio_recorder_capture($rec, $ctx);

    vio_poll_events($ctx);
}

// Finalize and close the video file
vio_recorder_stop($rec);
```

### Recorder Options

| Option | Type | Default | Description |
|---|---|---|---|
| `path` | string | required | Output file path |
| `fps` | int | `30` | Frames per second |
| `codec` | string | auto | Encoder name (e.g., `"h264_videotoolbox"`) |

## Hardware Acceleration

On macOS, the recorder tries VideoToolbox (Apple's hardware encoder) first. If it fails (e.g., in headless mode), it falls back to libx264 (software encoding).

## Frame-Perfect Recording

The recorder captures exactly what's in the framebuffer at the time of `vio_recorder_capture()`. This means:

- Call it **after** `vio_end()` for the final composited frame
- Every call adds exactly one frame — deterministic output regardless of actual FPS
- You can record at a different FPS than your render loop

```php
// Record at 60fps even if rendering is slower
$rec = vio_recorder($ctx, ["path" => "60fps.mp4", "fps" => 60]);
```

## Example: Offline Rendering

Record without displaying a window:

```php
$ctx = vio_create("opengl", [
    "width" => 1920, "height" => 1080,
    "headless" => true,
]);

$rec = vio_recorder($ctx, ["path" => "scene.mp4", "fps" => 30]);

for ($frame = 0; $frame < 300; $frame++) {  // 10 seconds
    vio_begin($ctx);
    vio_clear($ctx, 0.0, 0.0, 0.0, 1.0);
    // ... render frame $frame ...
    vio_end($ctx);
    vio_recorder_capture($rec, $ctx);
}

vio_recorder_stop($rec);
vio_destroy($ctx);
```
