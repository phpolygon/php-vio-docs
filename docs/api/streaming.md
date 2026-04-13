# Streaming

Functions for live streaming rendering output via RTMP or SRT.

Requires `--with-ffmpeg` at build time.

## vio_stream

```php
VioStream|false vio_stream(VioContext $context, array $config)
```

Create a network stream.

**Config:**

| Key | Type | Default | Description |
|---|---|---|---|
| `url` | string | required | Stream endpoint (e.g., `"rtmp://server/live/key"`) |
| `fps` | int | `30` | Target frames per second |
| `bitrate` | int | auto | Target bitrate in bits/s |
| `codec` | string | auto | Encoder name |
| `format` | string | auto | Container format |

## vio_stream_push

```php
bool vio_stream_push(VioStream $stream, VioContext $context)
```

Push the current framebuffer as one frame to the stream. Call once per frame after `vio_end()`.

Returns `true` on success.

## vio_stream_stop

```php
void vio_stream_stop(VioStream $stream)
```

Stop streaming and close the connection.
