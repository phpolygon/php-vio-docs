# Live Streaming

php-vio can stream your rendering output live to RTMP or SRT endpoints using FFmpeg.

## Requirements

Build with `--with-ffmpeg` to enable streaming.

## Streaming to RTMP

```php
$stream = vio_stream($ctx, [
    "url" => "rtmp://live.twitch.tv/app/YOUR_STREAM_KEY",
    "fps" => 30,
]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    // ... render ...
    vio_end($ctx);

    vio_stream_push($stream, $ctx);
    vio_poll_events($ctx);
}

vio_stream_stop($stream);
```

## Streaming to SRT

```php
$stream = vio_stream($ctx, [
    "url" => "srt://server:1234",
    "fps" => 30,
]);
```

## Stream Options

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | string | required | RTMP or SRT endpoint URL |
| `fps` | int | `30` | Target frames per second |
| `bitrate` | int | auto | Target bitrate in bits/s |
| `codec` | string | auto | Encoder name |
| `format` | string | auto | Container format |

## How It Works

Each call to `vio_stream_push()`:

1. Reads the current framebuffer pixels
2. Encodes the frame using FFmpeg (H.264)
3. Sends the encoded packet to the remote endpoint

The stream runs in real-time — if your render loop is slower than the target FPS, frames will be dropped.
