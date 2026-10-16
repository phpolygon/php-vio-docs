# Mesh Shaders & Work Graphs

GPU-driven geometry and work: **mesh / task shaders** replace the vertex stage with workgroups that
emit their own vertices and primitives; **work graphs** let shader nodes launch other nodes on the
GPU.

## Mesh shaders

A mesh pipeline is a [`vio_shader()`](/api/shaders#vio-shader) with a `'mesh'` stage (GLSL
`GL_EXT_mesh_shader`) instead of `'vertex'` – giving both is refused – and an optional `'task'`
(amplification / object) stage. Its uniforms are set with `vio_set_uniform()` like vertex uniforms
(a task stage shares that block). Mesh pipelines are drawn with `vio_draw_mesh_tasks()` /
`vio_draw_mesh_tasks_indirect()`, not `vio_draw()`.

Requires `VIO_FEATURE_MESH_SHADER`:

| Backend | Support |
|---|---|
| D3D12 | ✅ Shader Model 6.5 + `MeshShaderTier` (`vio_create(['shader_model' => 6])`, DXC) – `DispatchMesh` |
| Vulkan | ✅ `VK_EXT_mesh_shader` – `vkCmdDrawMeshTasksEXT` |
| Metal | ✅ Metal 3, Apple7 / Mac2, MSL ≥ 3.0 – `drawMeshThreadgroups` |
| OpenGL, D3D11 | ❌ (`'mesh'` returns `false` with a warning) |

```php
$mesh = "#version 450\n#extension GL_EXT_mesh_shader : require\n"
      . "layout(local_size_x = 1) in;\n"
      . "layout(triangles, max_vertices = 4, max_primitives = 2) out;\n"
      . "void main() {\n"
      . "  float x0 = -1.0 + 0.5 * float(gl_WorkGroupID.x);\n"
      . "  SetMeshOutputsEXT(4, 2);\n"
      . "  gl_MeshVerticesEXT[0].gl_Position = vec4(x0,       -1.0, 0.0, 1.0);\n"
      . "  gl_MeshVerticesEXT[1].gl_Position = vec4(x0 + 0.5, -1.0, 0.0, 1.0);\n"
      . "  gl_MeshVerticesEXT[2].gl_Position = vec4(x0 + 0.5,  1.0, 0.0, 1.0);\n"
      . "  gl_MeshVerticesEXT[3].gl_Position = vec4(x0,        1.0, 0.0, 1.0);\n"
      . "  gl_PrimitiveTriangleIndicesEXT[0] = uvec3(0, 1, 2);\n"
      . "  gl_PrimitiveTriangleIndicesEXT[1] = uvec3(0, 2, 3);\n"
      . "}";
$fs = "#version 450\nlayout(location = 0) out vec4 o;\nvoid main() { o = vec4(0.0, 1.0, 0.0, 1.0); }";

if (vio_supports_feature($ctx, VIO_FEATURE_MESH_SHADER)) {
    $sh   = vio_shader($ctx, ['mesh' => $mesh, 'fragment' => $fs]);
    $pipe = vio_pipeline($ctx, ['shader' => $sh, 'depth_test' => false, 'cull_mode' => VIO_CULL_NONE]);
    vio_begin($ctx);
    vio_bind_pipeline($ctx, $pipe);
    vio_draw_mesh_tasks($ctx, 4);     // four mesh workgroups = four columns
    vio_end($ctx);
}
```

## vio_draw_mesh_tasks

```php
void vio_draw_mesh_tasks(VioContext $context, int $x, int $y = 1, int $z = 1)
```

Launch `$x × $y × $z` task workgroups of the bound mesh pipeline – mesh workgroups directly when the
shader has no `'task'` stage. Each count is 0–65535 (0 draws nothing).

## vio_draw_mesh_tasks_indirect

```php
void vio_draw_mesh_tasks_indirect(VioContext $context, VioBuffer $args, int $maxDraws = 1, int $offset = 0)
```

`vio_draw_mesh_tasks()` with the group counts read from a storage buffer: `$maxDraws` records of
3 uint32 `{x, y, z}` (stride 12) starting at `$offset` bytes (a multiple of 4) – typically written
by a compute pass. Create the buffer with `vio_storage_buffer(['indirect' => true, …])`.

```php
$args = vio_storage_buffer($ctx, ['data' => pack('V3', 4, 1, 1), 'indirect' => true]);
vio_draw_mesh_tasks_indirect($ctx, $args);
```

## Work graphs

Work graphs are Shader Model 6.8 node shaders: **D3D12 only** (`VIO_FEATURE_WORK_GRAPHS`, needs
`OPTIONS21.WorkGraphsTier` ≥ 1.0). On most Windows builds the device has to come from the D3D12
Agility SDK – `vio_create('d3d12', ['agility_sdk' => $dir, 'shader_model' => 6])`;
[`vio_swapchain_info()`](/api/backend#vio-swapchain-info)`['agility_sdk']` reports the version in
use. Every other backend reports 0 and `vio_work_graph()` returns `false` with a warning. Work
graphs are HLSL only – GLSL has no node shaders.

## vio_work_graph

```php
VioWorkGraph|false vio_work_graph(VioContext $context, array $desc)
```

`$desc = ['hlsl' => string, 'entry' => string, 'record_size' => int]`:

- `'hlsl'` – a library compiled as `lib_6_8` with DXC (`shader_model => 6` and `dxcompiler.dll`);
  every `[Shader("node")]` function in it becomes a node of one graph.
- `'entry'` – the node `vio_dispatch_graph()` feeds. Its input record
  (`DispatchNodeInputRecord` / `ThreadNodeInputRecord` / `GroupNodeInputRecords`) is
  `'record_size'` bytes (1–32768) and laid out like the packed records passed in.
- Resources: storage buffers bound with `vio_work_graph_bind_buffer()` at
  `RWByteAddressBuffer` / `RWStructuredBuffer<T> : register(u0..u7)` in space 0. No textures,
  samplers or constant buffers – pass parameters in the records.

## vio_work_graph_bind_buffer

```php
void vio_work_graph_bind_buffer(VioContext $context, VioWorkGraph $graph, VioBuffer $buffer, int $slot)
```

Bind a storage buffer to `register(u$slot)` (0–7) of every node of `$graph`; the graph keeps a
reference. After a dispatch the buffer is readable with `vio_storage_buffer_read()`.

## vio_dispatch_graph

```php
void vio_dispatch_graph(VioContext $context, VioWorkGraph $graph, string $records, int $count)
```

Launch `$graph` with `$count` records for its entry node (`$records` holds
`$count * record_size` bytes; CPU input). Outside `vio_begin()` / `vio_end()` the call waits for
the graph to finish; inside a frame it runs in order with the frame's draws and dispatches.

```php
$hlsl = <<<'HLSL'
RWByteAddressBuffer g_out : register(u0);
struct EntryRecord { uint count; uint base; };
struct LeafRecord  { uint value; };

[Shader("node")] [NodeIsProgramEntry] [NodeLaunch("broadcasting")]
[NodeDispatchGrid(1, 1, 1)] [NumThreads(64, 1, 1)]
void producer(DispatchNodeInputRecord<EntryRecord> input,
              [MaxRecords(64)] NodeOutput<LeafRecord> leaf, uint tid : SV_GroupThreadID)
{
    EntryRecord r = input.Get();
    bool emit = tid < r.count;
    ThreadNodeOutputRecords<LeafRecord> o = leaf.GetThreadNodeOutputRecords(emit ? 1 : 0);
    if (emit) o.Get().value = r.base + tid;
    o.OutputComplete();
}

[Shader("node")] [NodeLaunch("thread")]
void leaf(ThreadNodeInputRecord<LeafRecord> input)
{
    uint prev;
    g_out.InterlockedAdd(0, input.Get().value, prev);
}
HLSL;

$graph = vio_work_graph($ctx, ['hlsl' => $hlsl, 'entry' => 'producer', 'record_size' => 8]);
$sum   = vio_storage_buffer($ctx, ['size' => 8]);
vio_work_graph_bind_buffer($ctx, $graph, $sum, 0);
vio_dispatch_graph($ctx, $graph, pack('V4', 10, 1, 5, 100), 2);   // records {10, 1} and {5, 100}
$total = unpack('V', vio_storage_buffer_read($ctx, $sum))[1];     // 55 + 510 = 565
```
