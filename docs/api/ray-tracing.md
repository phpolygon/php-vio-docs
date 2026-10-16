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
(`VIO_FEATURE_SHADER_EXECUTION_REORDER`) and opacity micromaps (`VIO_FEATURE_OPACITY_MICROMAP`) are
available on D3D12 (DXR 1.2) and Vulkan.

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

```php
$occluder = vio_mesh($ctx, ['vertices' => [-1,-1,0.5, 0,-1,0.5, 0,1,0.5, -1,1,0.5],
                            'indices' => [0,1,2, 0,2,3], 'layout' => [VIO_FLOAT3]]);
$tlas = vio_acceleration_structure($ctx, [
    ['mesh' => $occluder],
    ['mesh' => $occluder, 'transform' => [1,0,0,0, 0,1,0,0, 0,0,1,0, 1,0,0,1]],   // moved +1 in x
]);
```

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
