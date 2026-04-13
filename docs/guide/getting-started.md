# Getting Started

## Installation

### macOS (Homebrew + PHP 8.5)

```bash
# Install dependencies
brew install glfw glslang spirv-cross vulkan-loader ffmpeg

# Build the extension
cd php-vio
make clean; phpize --clean; phpize && \
./configure --enable-vio \
  --with-glfw --with-glslang --with-spirv-cross \
  --with-vulkan --with-ffmpeg --with-metal && \
make -j$(sysctl -n hw.ncpu)

# Install
sudo make install
```

### macOS (Laravel Herd / PHP 8.4)

```bash
make clean
/usr/local/Cellar/php@8.4/8.4.19/bin/phpize --clean
/usr/local/Cellar/php@8.4/8.4.19/bin/phpize && \
./configure --enable-vio \
  --with-glfw --with-glslang --with-spirv-cross \
  --with-vulkan --with-ffmpeg --with-metal \
  --with-php-config=/usr/local/Cellar/php@8.4/8.4.19/bin/php-config && \
make -j$(sysctl -n hw.ncpu)
```

### Linux (Ubuntu / Debian)

```bash
# Install dependencies
sudo apt install php-dev libglfw3-dev glslang-dev libvulkan-dev \
  libavcodec-dev libavformat-dev libavutil-dev libswscale-dev \
  spirv-cross libspirv-cross-c-shared-dev

# Build (no --with-metal on Linux)
phpize && \
./configure --enable-vio \
  --with-glfw --with-glslang --with-spirv-cross \
  --with-vulkan --with-ffmpeg && \
make -j$(nproc)
sudo make install
```

### Windows

Requires PHP SDK + Visual Studio Build Tools. Place precompiled dependencies in `deps/`.

```cmd
cd C:\php-sdk\phpdev\vs17\x64\php-src\ext\vio

:: Full build
configure --enable-vio --with-glfw=C:\deps\glfw ^
  --with-vulkan=C:\VulkanSDK\1.3.xxx ^
  --with-glslang=C:\deps\glslang ^
  --with-spirv-cross=C:\deps\spirv-cross ^
  --with-ffmpeg=C:\deps\ffmpeg

nmake
```

### Enable the Extension

Add to your `php.ini`:

```ini
extension=vio
```

Verify:

```bash
php -m | grep vio
```

## Minimal Build

All features are optional. A minimal build with just OpenGL windowing:

```bash
phpize && ./configure --enable-vio --with-glfw && make
```

Features not compiled in are simply unavailable at runtime — no errors, just `false` returns from unsupported functions.

## Your First Window

```php
<?php
// Create a window with OpenGL backend
$ctx = vio_create("opengl", [
    "width"  => 800,
    "height" => 600,
    "title"  => "Hello php-vio",
]);

// Main loop
while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.1, 0.1, 0.15, 1.0);

    // Draw a red rectangle
    vio_rect($ctx, 100, 100, 200, 150, [
        "color" => 0xFF0000FF,
    ]);

    // Flush 2D batch
    vio_draw_2d($ctx);
    vio_end($ctx);

    vio_poll_events($ctx);

    // Close on Escape
    if (vio_key_pressed($ctx, VIO_KEY_ESCAPE)) {
        vio_close($ctx);
    }
}

vio_destroy($ctx);
```

Run it:

```bash
php -d extension=modules/vio.so hello.php
```

## Drawing a 3D Triangle

```php
<?php
$ctx = vio_create("opengl", [
    "width" => 800, "height" => 600,
    "title" => "3D Triangle",
]);

// Vertex data: position (xyz) + color (rgb)
$vertices = [
     0.0,  0.5, 0.0,   1.0, 0.0, 0.0,  // top (red)
    -0.5, -0.5, 0.0,   0.0, 1.0, 0.0,  // left (green)
     0.5, -0.5, 0.0,   0.0, 0.0, 1.0,  // right (blue)
];

$mesh = vio_mesh($ctx, [
    "vertices" => $vertices,
    "layout"   => [VIO_FLOAT3, VIO_FLOAT3],
    "topology" => VIO_TRIANGLES,
]);

$shader = vio_shader($ctx, [
    "vertex" => "
        #version 410 core
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aColor;
        out vec3 vColor;
        void main() {
            gl_Position = vec4(aPos, 1.0);
            vColor = aColor;
        }
    ",
    "fragment" => "
        #version 410 core
        in vec3 vColor;
        out vec4 fragColor;
        void main() {
            fragColor = vec4(vColor, 1.0);
        }
    ",
]);

$pipeline = vio_pipeline($ctx, ["shader" => $shader]);

while (!vio_should_close($ctx)) {
    vio_begin($ctx);
    vio_clear($ctx, 0.1, 0.1, 0.15, 1.0);

    vio_bind_pipeline($ctx, $pipeline);
    vio_draw($ctx, $mesh);

    vio_end($ctx);
    vio_poll_events($ctx);

    if (vio_key_pressed($ctx, VIO_KEY_ESCAPE)) {
        vio_close($ctx);
    }
}

vio_destroy($ctx);
```

## Playing Audio

```php
<?php
$sound = vio_audio_load("background.mp3");
vio_audio_play($sound, [
    "volume" => 0.7,
    "loop"   => true,
]);

// Keep running until Ctrl+C
while (vio_audio_playing($sound)) {
    usleep(100000);
}
```

## Running Tests

```bash
NO_INTERACTION=1 TEST_PHP_EXECUTABLE=$(which php) \
  php run-tests.php -d extension=$PWD/modules/vio.so tests/
```

## Next Steps

- [Architecture](/guide/architecture) — How the backend dispatch works
- [Backends](/guide/backends) — OpenGL, Vulkan, Metal, D3D details
- [2D Rendering](/guide/rendering-2d) — Sprites, shapes, text
- [3D Rendering](/guide/rendering-3d) — Meshes, shaders, pipelines
