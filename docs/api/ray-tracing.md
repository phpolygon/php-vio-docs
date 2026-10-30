# Ray Tracing

Two levels of hardware ray tracing:

- **Inline ray queries** (`VIO_FEATURE_RAY_QUERY`): an acceleration structure is bound like a
  texture and queried with `GL_EXT_ray_query` (`rayQueryEXT`) from fragment and compute shaders.
- **Ray tracing pipelines** (`VIO_FEATURE_RAYTRACING`): raygen, miss, hit and callable shaders
  launched with [`vio_trace_rays()`](#vio-trace-rays).

| Backend | Ray query | RT pipeline |
|---|---|---|
| D3D12 | ✅ DXR 1.1 + Shader Model 6.5 (`vio_create(['shader_model' => 6])`) | ✅ DXR 1.0 (SM ≥ 6.3); stages from an HLSL library |
| Vulkan | ✅ `VK_KHR_acceleration_structure` + `VK_KHR_ray_query` | ✅ `VK_KHR_ray_tracing_pipeline`; GLSL stages |
| Metal | ✅ MSL 2.4 | ❌ |
| OpenGL, D3D11 | ❌ | ❌ |

Where a flag is 0 the functions return `false` with a warning. Shader execution reordering
(`VIO_FEATURE_SHADER_EXECUTION_REORDER`) and [opacity micromaps](#opacity-micromaps)
(`VIO_FEATURE_OPACITY_MICROMAP`) are available on D3D12 (DXR 1.2) and Vulkan.

![Hard shadows traced with a ray query from the fragment shader](/gallery/ray_query_shadows.png)

## vio_acceleration_structure

```php
VioAccelerationStructure|false vio_acceleration_structure(VioContext $context, array $instances)
```

Build a bottom-level acceleration structure per distinct mesh (its location-0 positions and its
indices) and a top-level structure over the instances. Each instance:

| Key | Type | Default | Description |
|---|---|---|---|
| `mesh` | `VioMesh` | required | Geometry |
| `transform` | `float[16]` | identity | Column-major 4 × 4 matrix |
| `hit_group` | int | 0 | 0–7: hit group of the RT pipeline |
| `mask` | int | `0xFF` | 0–255: rays skip the instance when `mask & cullMask` is 0 |
| `opacity_micromap` | array | none | Map of the mesh, see [Opacity micromaps](#opacity-micromaps). A mesh carries one map |

```php
$occluder = vio_mesh($ctx, ['vertices' => [-1,-1,0.5, 0,-1,0.5, 0,1,0.5, -1,1,0.5],
                            'indices' => [0,1,2, 0,2,3], 'layout' => [VIO_FLOAT3]]);
$tlas = vio_acceleration_structure($ctx, [
    ['mesh' => $occluder],
    ['mesh' => $occluder, 'transform' => [1,0,0,0, 0,1,0,0, 0,0,1,0, 1,0,0,1]],   // moved +1 in x
]);
```

## Opacity micromaps

Rays through alpha-tested geometry (leaves, fences, grates) normally run an any-hit shader for every
triangle they touch, only to read a texture and learn that the ray passes through. An opacity micromap
stores the answer per **micro-triangle** in the acceleration structure, so the hardware decides during
traversal. Only what the map cannot decide still runs the shader.

Micromaps speed up ray tracing through alpha-tested geometry. Ray tracing itself does not need them,
and opaque geometry gains nothing from them.

Each triangle splits into 4^`subdivision` micro-triangles. A state is one byte:

| State | Meaning | With format 2 | With format 4 |
|---|---|---|---|
| 0 | Transparent | ray passes | ray passes |
| 1 | Opaque | ray hits, no any-hit | ray hits, no any-hit |
| 2 | Unknown, leans transparent | – | any-hit decides |
| 3 | Unknown, leans opaque | – | any-hit decides |

The geometry of a mesh with a map becomes non-opaque. `RAY_FLAG_FORCE_OMM_2_STATE` /
`gl_RayFlagsForceOpacityMicromap2StateEXT` resolves the unknown states without an any-hit shader.

### vio_opacity_micromap_bake

```php
array vio_opacity_micromap_bake(array $options)
```

Bake a map from an alpha texture. It needs no GPU and no context, so it can run in a build step.

| Option | Type | Default | Description |
|---|---|---|---|
| `uvs` | `float[]` | required | `u, v` per vertex |
| `indices` | `int[]` | `0, 1, 2, …` | The mesh's indices |
| `data` | string | required | `width × height × channels` bytes |
| `width`, `height` | int | required | 1–65536 |
| `channels` | int | 4 | 1 or 4; the last channel holds alpha |
| `subdivision` | int | 4 | 0–12 |
| `format` | int | 4 | 4: exact image, unknown states run the any-hit shader. 2: no any-hit needed, edges as coarse as the subdivision |
| `threshold` | float | 0.5 | Alpha at or above this is opaque |
| `clamp` | bool | `false` | `false`: uvs repeat |

Returns `['subdivision', 'format', 'states', 'stats']`, which goes straight into
`'opacity_micromap'`. `stats` counts `transparent`, `opaque`, `unknown_transparent` and
`unknown_opaque`. Malformed input and more than 256 MiB of states throw a `ValueError`.

```php
$map = vio_opacity_micromap_bake([
    'uvs' => [0,0, 1,0, 1,1, 0,1], 'indices' => [0,1,2, 0,2,3],
    'data' => $rgba, 'width' => 256, 'height' => 256,
    'subdivision' => 6, 'format' => 4,
]);
$tlas = vio_acceleration_structure($ctx, [['mesh' => $leaf, 'opacity_micromap' => $map]]);
```

![A leaf at subdivision 3, 5 and 7: the unknown share falls from 72 to 16 percent](/gallery/opacity_micromap.png)

Format 4 calls a micro-triangle known only if every texel a bilinear lookup inside it can reach lies
on one side of the threshold, so a known state is never wrong. Fine detail needs a higher subdivision:
a coarse map finds nothing it can decide.

Measured on an RTX 2080 with 80 leaf cards, 40 crossed per ray, a 256 × 256 mask and a trivial any-hit
shader:

| Subdivision | Any-hit calls saved | Bake time | Packed size |
|---|---|---|---|
| 2 | 0 % | 8 ms | under 1 KiB |
| 4 | 67 % | 52 ms | 5 KiB |
| 6 | 90 % | 87 ms | 80 KiB |
| 8 | 96 % | 370 ms | 1280 KiB |

Bake at load time or in a build step, not per frame.

::: warning Limits
- The baker reads mip 0 only, so the any-hit shader must not sample lower mips.
- Inline ray queries have no any-hit stage. Unknown states are candidates the shader resolves itself,
  so format 2 is the simple choice there.
- D3D12 needs DXR 1.2, which an RTX 2080 reports with the [Agility SDK](/api/backend). Below Shader
  Model 6.9 a ray query cannot declare micromap support in HLSL; on Agility 1.620 and later php-vio opts
  the pipeline in. Metal, OpenGL and D3D11 have no micromaps.
:::

## vio_acceleration_structure_update

```php
string|false vio_acceleration_structure_update(VioContext $context, VioAccelerationStructure $accelerationStructure, array $instances)
```

Update an acceleration structure with a new instance list (same format as
`vio_acceleration_structure()`). Returns what it did:

| Result | When |
|---|---|
| `'refit'` | Every instance keeps its mesh, only transforms change – the top level is updated in place (the cheap per-frame path for moving objects) |
| `'rebuild'` | The list changes but all meshes are already in the structure – a new top level over the existing bottom levels |
| `'full'` | A mesh is new – everything is built again |

The structure keeps its meshes alive. Call it outside `vio_begin()` / `vio_end()` (inside a frame:
`false` + warning); it is synchronous and waits for frames still using the structure.

## vio_bind_acceleration_structure

```php
void vio_bind_acceleration_structure(VioContext $context, VioAccelerationStructure $accelerationStructure, int $binding)
```

Bind an acceleration structure for the following draws and compute dispatches at the GLSL binding
of the shader's `accelerationStructureEXT`, and for [`vio_trace_rays()`](#vio-trace-rays).

```php
$fs = "#version 460\n#extension GL_EXT_ray_query : require\n"
    . "layout(location = 0) in vec3 wpos;\nlayout(location = 0) out vec4 o;\n"
    . "layout(binding = 0) uniform accelerationStructureEXT u_tlas;\n"
    . "void main() {\n"
    . "  rayQueryEXT q;\n"
    . "  rayQueryInitializeEXT(q, u_tlas, gl_RayFlagsTerminateOnFirstHitEXT | gl_RayFlagsOpaqueEXT, 0xFF,\n"
    . "                        vec3(wpos.xy, 0.0), 0.001, vec3(0.0, 0.0, 1.0), 100.0);\n"
    . "  while (rayQueryProceedEXT(q)) {}\n"
    . "  bool hit = rayQueryGetIntersectionTypeEXT(q, true) != gl_RayQueryCommittedIntersectionNoneEXT;\n"
    . "  o = hit ? vec4(1, 0, 0, 1) : vec4(0, 1, 0, 1);\n"
    . "}";

vio_begin($ctx);
vio_bind_pipeline($ctx, $shadowPipe);
vio_bind_acceleration_structure($ctx, $tlas, 0);
vio_draw($ctx, $fullscreenQuad);
vio_end($ctx);
```

## vio_rt_pipeline

```php
VioRtPipeline|false vio_rt_pipeline(VioContext $context, array $desc)
```

A ray tracing pipeline: one raygen shader, one or more miss shaders, triangle hit groups and
callables (at most 8 of each kind).

| Key | Description |
|---|---|
| `raygen` | GLSL raygen stage (`GL_EXT_ray_tracing`), required |
| `miss` | GLSL miss stage, or a list of them (`traceRayEXT`'s `missIndex` picks one), required |
| `closest_hit`, `any_hit` | Single hit group: closest-hit (required) and optional any-hit stage |
| `hit_groups` | `list<['closest_hit' => glsl, 'any_hit' => ?glsl]>` instead of the single-group keys; an instance's `hit_group` plus `sbtRecordOffset` picks one |
| `callables` | `list<glsl>` for `executeCallableEXT(index)` |
| `records` | `['raygen' => bytes, 'miss' => list<bytes>, 'hit_groups' => list<bytes>, 'callables' => list<bytes>]` – each group's shader record (≤ 256 bytes), read as `layout(shaderRecordEXT) buffer` |
| `max_recursion` | int, default 1 |
| `payload_size` | Bytes, default 32 (D3D12 only) |
| `hlsl` | D3D12: the stages as one HLSL library |

**Vulkan** compiles the GLSL stages; the acceleration structure and the std430 buffers sit at their
bindings in set 0.

**D3D12** (needs `vio_create(['shader_model' => 6])`) compiles `'hlsl'` as one DXC library
(`lib_6_3`) with the exports `vio_raygen`, `vio_miss` / `vio_miss<k>`, `vio_closest_hit` /
`vio_closest_hit<k>` (+ `vio_any_hit` / `vio_any_hit<k>`) and `vio_callable<k>`; the payload struct
is the library's own, at most `payload_size` bytes. The bound acceleration structure is a
`RaytracingAccelerationStructure` at `t0`, a buffer bound with `vio_rt_bind_buffer(…, $binding)` a
`RWStructuredBuffer` / `RWByteAddressBuffer` at `u<binding>`; shader records are root constants of
a local root signature (`ConstantBuffer<T> : register(b0, space1)`).

Returns `false` with a warning where the feature is 0 or a stage does not compile.

```php
$hdr  = "#version 460\n#extension GL_EXT_ray_tracing : require\n";
$rgen = $hdr . "layout(binding = 0) uniform accelerationStructureEXT u_tlas;\n"
      . "layout(std430, binding = 1) buffer B { uint v[]; } b;\n"
      . "layout(location = 0) rayPayloadEXT uint hit;\n"
      . "void main() {\n"
      . "  uvec3 id = gl_LaunchIDEXT; uvec3 n = gl_LaunchSizeEXT;\n"
      . "  vec2 uv = (vec2(id.xy) + 0.5) / vec2(n.xy) * 2.0 - 1.0;\n"
      . "  traceRayEXT(u_tlas, gl_RayFlagsOpaqueEXT, 0xFF, 0, 0, 0, vec3(uv, 0.0), 0.001, vec3(0, 0, 1), 100.0, 0);\n"
      . "  b.v[id.y * n.x + id.x] = hit;\n"
      . "}";
$miss = $hdr . "layout(location = 0) rayPayloadInEXT uint hit;\nvoid main() { hit = 0u; }";
$chit = $hdr . "layout(location = 0) rayPayloadInEXT uint hit;\nhitAttributeEXT vec2 bary;\nvoid main() { hit = 1u; }";

$rt = vio_rt_pipeline($ctx, ['raygen' => $rgen, 'miss' => $miss, 'closest_hit' => $chit,
                             'hlsl' => $hlslLibrary /* used on D3D12 */]);
```

## vio_rt_bind_buffer

```php
void vio_rt_bind_buffer(VioContext $context, VioRtPipeline $pipeline, VioBuffer $buffer, int $binding)
```

Bind a storage buffer (`vio_storage_buffer()`) at `$binding` (0–15, up to 8 per pipeline) for the
following `vio_trace_rays()` of `$pipeline`. Read the result with `vio_storage_buffer_read()`.

## vio_rt_bind_texture

```php
void vio_rt_bind_texture(VioContext $context, VioRtPipeline $pipeline, VioTexture $texture, int $binding)
```

Bind a texture at `$binding` (1–15; 0 is the acceleration structure) for the following
`vio_trace_rays()` of `$pipeline`. The stages read it as
`layout(binding = $binding) uniform sampler2D` with the texture's own filter / wrap – use
`textureLod()`, ray tracing stages have no derivatives. D3D12: `Texture2D` at `t<binding>` with a
linear / repeat `SamplerState` at `s<binding>`. Rebinding replaces; up to 16 resources (buffers and
textures) per pipeline; the pipeline keeps a reference.

## vio_trace_rays

```php
void vio_trace_rays(VioContext $context, VioRtPipeline $pipeline, int $width, int $height, int $depth = 1)
```

Launch `$width × $height × $depth` raygen invocations (`gl_LaunchIDEXT` / `DispatchRaysIndex`)
against the acceleration structure bound with `vio_bind_acceleration_structure()`.

Outside `vio_begin()` / `vio_end()` it is synchronous – the buffers are complete on return. Inside a
frame it is recorded in order with the frame's draws and async compute dispatches: later work of
the frame sees its writes, and `vio_storage_buffer_read()` waits for it (mid-frame too).

```php
$out = vio_storage_buffer($ctx, ['size' => 16 * 4 * 4]);
vio_bind_acceleration_structure($ctx, $tlas, 0);
vio_rt_bind_buffer($ctx, $rt, $out, 1);
vio_trace_rays($ctx, $rt, 16, 4);
$hits = unpack('V*', vio_storage_buffer_read($ctx, $out));
```
