# Building from Source

php-vio is a standard PHP extension built with phpize/autotools. All features are optional — enable only what you need.

## Build Flags

| Flag | Feature | Dependency |
|---|---|---|
| `--enable-vio` | Core extension | PHP development headers |
| `--with-glfw` | Windowing & input | GLFW 3.4 |
| `--with-glslang` | GLSL → SPIR-V compilation | glslang |
| `--with-spirv-cross` | Shader reflection & transpilation | SPIRV-Cross |
| `--with-vulkan` | Vulkan backend | Vulkan SDK |
| `--with-ffmpeg` | Video recording & streaming | FFmpeg (libavcodec, libavformat, libavutil, libswscale) |
| `--with-metal` | Metal backend (macOS only) | Metal + QuartzCore frameworks |

## Minimal Build

Just windowing and OpenGL:

```bash
phpize && ./configure --enable-vio --with-glfw && make
```

## Full Build (macOS)

```bash
brew install glfw glslang spirv-cross vulkan-loader ffmpeg

phpize && ./configure --enable-vio \
  --with-glfw --with-glslang --with-spirv-cross \
  --with-vulkan --with-ffmpeg --with-metal && \
make -j$(sysctl -n hw.ncpu)
```

## Full Build (Linux)

```bash
sudo apt install php-dev libglfw3-dev glslang-dev libvulkan-dev \
  libavcodec-dev libavformat-dev libavutil-dev libswscale-dev \
  spirv-cross libspirv-cross-c-shared-dev

phpize && ./configure --enable-vio \
  --with-glfw --with-glslang --with-spirv-cross \
  --with-vulkan --with-ffmpeg && \
make -j$(nproc)
```

## Windows

See the [Getting Started](/guide/getting-started#windows) guide for Windows-specific instructions.

## Conditional Compilation

Missing dependencies don't cause build errors. Each feature is wrapped in `#ifdef HAVE_*` guards:

```c
#ifdef HAVE_GLFW      // Windowing & input
#ifdef HAVE_VULKAN    // Vulkan backend
#ifdef HAVE_METAL     // Metal backend
#ifdef HAVE_FFMPEG    // Recording & streaming
#ifdef HAVE_GLSLANG   // Shader compilation
#ifdef HAVE_SPIRV_CROSS // Shader reflection
```

Functions for unavailable features return `false` at runtime.

## Vendored Libraries

These are included in the repository and compiled automatically:

| Library | Location | Purpose |
|---|---|---|
| GLAD | `vendor/glad/` | OpenGL function loader |
| stb_image | `vendor/stb/` | PNG/JPG/BMP loading |
| stb_truetype | `vendor/stb/` | TTF font rendering |
| stb_image_write | `vendor/stb/` | PNG saving |
| VMA | `vendor/vma/` | Vulkan Memory Allocator |
| miniaudio | `vendor/miniaudio/` | Audio engine |

## Build System Files

| File | Purpose |
|---|---|
| `config.m4` | Autotools configuration (phpize/configure) |
| `Makefile.frag` | Extra rules: VMA (C++14), Metal (ObjC+ARC) |
| `CMakeLists.txt` | Alternative CMake build |

## Installing

```bash
sudo make install

# Or copy manually
cp modules/vio.so $(php-config --extension-dir)/
```

::: tip Release Binaries
Pre-built release archives (ZIP) contain the binary named `vio.so` (or `vio.dll` on Windows) for Position Independent Executable (PIE) compatibility.
:::

Add to `php.ini`:

```ini
extension=vio
```

## Laravel Herd

To use with Laravel Herd's PHP 8.4:

```bash
# Build against Herd's PHP
/usr/local/Cellar/php@8.4/8.4.19/bin/phpize && \
./configure --enable-vio --with-glfw \
  --with-php-config=/usr/local/Cellar/php@8.4/8.4.19/bin/php-config && \
make

# Copy to Herd's extension directory
cp modules/vio.so ~/Library/Application\ Support/Herd/config/php/extensions/
```

Enable in Herd's `php.ini`:
```
~/Library/Application Support/Herd/config/php/84/php.ini
```
