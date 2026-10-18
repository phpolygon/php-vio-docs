# Backend

Functions for querying the active rendering backend, ranking the backends and adapters of the machine, and diagnostics of the presentation path and the shader cache. Window-system queries are on [Platform & Clipboard](/api/platform).

## vio_backend_name

```php
string vio_backend_name(VioContext $context)
```

Returns the name of the active backend: `"opengl"`, `"vulkan"`, `"metal"`, `"d3d11"`, `"d3d12"` or `"null"`. Use it to resolve what `"auto"` picked, e.g. for backend-specific conventions (render-target row order).

## vio_backend_count

```php
int vio_backend_count()
```

Returns the number of registered backends.

## vio_supports_feature

```php
bool vio_supports_feature(VioContext $context, int $feature)
```

Query whether the active backend supports a `VIO_FEATURE_*` capability (see [Constants → Features](/api/constants#features)). Returns `false` for unsupported features and unrecognized constants, so it doubles as a safe capability gate before using an optional code path.

```php
if (vio_supports_feature($ctx, VIO_FEATURE_TEXTURE_3D)) {
    $volume = vio_texture_3d($ctx, $config);
} else {
    // fall back to a 2D approximation
}
```

## vio_backends

```php
string[] vio_backends()
```

Returns an array of all registered backend names.

```php
$backends = vio_backends();
// macOS: ["metal", "vulkan", "opengl", "null"] – Windows: ["d3d12", "d3d11", "vulkan", "opengl", "null"]
```

## vio_gpu_info

```php
array|false vio_gpu_info()
```

Adapter name, vendor and memory of the GPU the active backend uses (Metal reports `recommendedMaxWorkingSetSize` as `vram_bytes`).

## vio_gl_info

```php
array|false vio_gl_info(VioContext $context)
```

OpenGL only: negotiated core version, GLSL version, renderer/vendor strings and the resolved capability flags of this context (which features the 3.3 → 4.6 ladder actually delivered).

## vio_feature_info

```php
array vio_feature_info(VioContext $context, int $feature)
```

How the context's backend provides a `VIO_FEATURE_*` capability:
`['supported' => bool, 'emulated' => bool, 'method' => ?string]`.

- `supported` equals `vio_supports_feature()`.
- `emulated` is `true` when the feature is reached by other means than the API's own stage or
  call; `method` then names how (it is `null` for native features). Emulated paths work, but
  usually cost more than on a backend that has the feature natively.
- Unknown constants return `['supported' => false, 'emulated' => false, 'method' => null]`.

Examples pinned by the test suite: Metal runs geometry shaders (and geometry-shader instancing) as
compute kernels and multiview by instancing; D3D11 emulates multiview by instancing. Geometry and
tessellation are native on OpenGL, D3D11, D3D12 and Vulkan.

```php
$i = vio_feature_info($ctx, VIO_FEATURE_GEOMETRY);
if ($i['supported'] && $i['emulated']) {
    error_log("geometry shaders are emulated: {$i['method']}");
}
```

## vio_backend_info

```php
array|false vio_backend_info(VioContext $context)
```

The API level the backend negotiated and what the device can do there. `false` without a device.

| Key | Meaning |
|---|---|
| `backend` | Backend name |
| `api` | API and level, e.g. `'Metal 4'`; D3D11 / D3D12 report the feature level |
| `device` | Device name |
| `shading_language` | e.g. `'MSL'`; D3D11 / D3D12 report the HLSL shader model, Vulkan the SPIR-V version of the instance / device API, OpenGL the GLSL version |
| `shading_language_version` | Version in use, `major * 10 + minor` |
| `shading_language_max` | Highest version the OS / driver accepts |
| `families` | Metal GPU families (`'apple7'`, `'mac2'`, `'metal3'`, …) |
| `caps` | `array<string, bool>`: device support **and** the minimum language version |
| `vendor_id`, `vendor` | PCI vendor (`0x10005` = Mesa, `0` = unknown) and its name |
| `driver` | Driver version |
| `device_type` | `'discrete'`, `'integrated'`, `'software'` or `'unknown'` |
| `vram_bytes` | Video memory |
| `selected_by` | `'explicit'` (backend named), `'priority'` (plain `'auto'`), `'score'` or `'benchmark'` (`'auto'` with `prefer` / `require` / `benchmark`) |
| `candidates` | The [`vio_rank_backends()`](#vio-rank-backends) ranking of a scored `'auto'`, `[]` otherwise |

The Metal language ladder can be pinned with `vio_create(['msl_version' => 21])` or the
`VIO_METAL_MSL_VERSION` environment variable.

## vio_adapters

```php
array vio_adapters(?string $backend = null)
```

The adapters each registered backend can open – no context needed:

```php
[
    'd3d12' => [
        ['index' => 0, 'name' => '…', 'vendor_id' => 0x10DE, 'vendor' => 'NVIDIA', 'device_id' => …,
         'driver' => '…', 'device_type' => 'discrete', 'vram_bytes' => …,
         'features' => [VIO_FEATURE_COMPUTE, VIO_FEATURE_MESH_SHADER, …]],
        …
    ],
    'vulkan' => [ … ],
]
```

Preferred (discrete) adapters come first. `features` lists the `VIO_FEATURE_*` flags the hardware
supports. OpenGL lists only the adapter of its live context. A backend name limits the scan; an
unknown name throws a `ValueError`.

## vio_rank_backends

```php
array|false vio_rank_backends(array $options = [])
```

The ranking `vio_create('auto', ['prefer' => …, 'require' => […]])` uses: one candidate per
backend with its preferred adapter, eligible ones first, then by score.

- `'prefer'` – `'performance'` (default), `'quality'` or `'compat'` (D3D11 / OpenGL first, no
  feature points)
- `'require'` – list of `VIO_FEATURE_*` flags a candidate must have. A feature a backend cannot
  report before a context exists is checked again when `vio_create()` opens it.

The score combines a vendor profile (NVIDIA: d3d12 > vulkan > d3d11; AMD: vulkan > d3d12; older
Intel iGPUs: d3d11; Apple: metal; Linux: vulkan > opengl), discrete before integrated, software
rasterizers last, and feature points from `prefer`.

**Entries:** `['backend', 'adapter' => ?string, 'vendor', 'device_type', 'score', 'eligible' => bool,
'reason' => ?string, 'benchmark_ms' => ?float]`. `false` (with a warning) on a bad option.

```php
foreach (vio_rank_backends(['prefer' => 'quality', 'require' => [VIO_FEATURE_RAY_QUERY]]) as $c) {
    printf("%-7s %-30s %s\n", $c['backend'], $c['adapter'] ?? '-', $c['eligible'] ? $c['score'] : $c['reason']);
}
$ctx = vio_create('auto', ['prefer' => 'quality', 'require' => [VIO_FEATURE_RAY_QUERY]]);
```

## vio_benchmark_backends

```php
array|false vio_benchmark_backends(array $options = [])
```

A calibration run without selecting anything – for settings menus and tools. The same scene
(64 draws into a render target, a post pass, async compute; headless on the GPU at 256 × 256) runs
on the top candidates of the ranking.

| Option | Default | Meaning |
|---|---|---|
| `max` | 3 | Candidates to measure |
| `prefer`, `require` | – | As for `vio_rank_backends()` |
| `frames` | 120 | Frames per candidate |
| `cache` | the shader cache directory | Directory for `vio-benchmark.json`; the result is kept per (backend, adapter, driver, vio version) and a hit skips the run |

**Entries**, fastest first, failed runs last: `['backend', 'adapter' => ?string, 'driver', 'ms'`
(wall time per frame, `-1` = failed)`, 'gpu_ms'` (median GPU time, `-1` = unknown)`, 'cached' => bool]`.

`vio_create('auto', ['benchmark' => true, 'benchmark_cache' => $dir, 'benchmark_frames' => $n])`
runs the same calibration and picks the fastest candidate (`selected_by` = `'benchmark'`).

## vio_swapchain_info

```php
array vio_swapchain_info(VioContext $context)
```

What the presentation path runs with:

| Key | Meaning |
|---|---|
| `buffer_count` | Swapchain buffers |
| `frame_latency` | `vio_create(['frame_latency' => n])` in effect, `0` = driver default |
| `waitable` | A frame-latency waitable object is in use |
| `hdr_output` | HDR10 backbuffer active (`vio_create(['hdr_output' => …])`) |
| `format` | Backbuffer format: `0` RGBA8, `8` RGB10A2 |
| `shader_model` | D3D12: `6` with DXC / DXIL, `5` with FXC; D3D11: `5`; `0` elsewhere |
| `shader_model_version` | Compile profile as `major * 10 + minor`: D3D12 60–69 with DXC, 51 with FXC; D3D11 50; `0` elsewhere |
| `agility_sdk` | D3D12: the Agility SDK version the device runs on, `0` = OS runtime; `0` elsewhere |

`frame_latency` caps the CPU's run-ahead on D3D11, D3D12 and Metal (`VIO_FEATURE_FRAME_LATENCY`);
the HDR10 backbuffer is available on D3D11, D3D12, Vulkan and Metal (`VIO_FEATURE_HDR_OUTPUT`).

```php
$ctx = vio_create('d3d12', ['frame_latency' => 1, 'shader_model' => 6]);
$sc  = vio_swapchain_info($ctx);   // ['frame_latency' => 1, 'waitable' => true, 'shader_model' => 6, …]
```

## vio_shader_cache_stats

```php
array vio_shader_cache_stats()
```

Counters of the on-disk shader / pipeline cache (`vio_create(['shader_cache' => $dir])`),
cumulative for the process: `['dir' => ?string, 'hits' => int, 'misses' => int, 'stores' => int]`.

The cache stores DXBC per HLSL stage on D3D11 / D3D12, program binaries on OpenGL ≥ 4.1, the
`VkPipelineCache` on Vulkan and an `MTLBinaryArchive` per device and OS on Metal; a warm start skips
the compiles.

```php
$ctx = vio_create('auto', ['shader_cache' => __DIR__ . '/cache']);
// ... create shaders ...
['hits' => $hits, 'misses' => $misses] = vio_shader_cache_stats();
```