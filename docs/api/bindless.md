# Bindless Textures & Sampler Feedback

**Bindless textures** put textures into one context-wide table that shaders index at run time – one
draw can sample hundreds of textures without rebinding. **Sampler feedback** records which mip
level a shader actually sampled per region of a texture, the input for texture streaming.

## Bindless textures

Requires `VIO_FEATURE_BINDLESS`:

| Backend | Support |
|---|---|
| D3D12 | ✅ Resource Binding Tier 2+ (FXC 5.1 and DXC) |
| Vulkan | ✅ `VK_EXT_descriptor_indexing` |
| Metal | ✅ Metal 3 + argument buffers Tier 2 + MSL 3.0 |
| OpenGL, D3D11 | ❌ |

Shaders read the table in descriptor set 1:

```glsl
#extension GL_EXT_nonuniform_qualifier : require
layout(set = 1, binding = 0) uniform texture2D      vio_textures[];
layout(set = 1, binding = 1) uniform sampler        vio_sampler;                 // linear, repeat
layout(set = 1, binding = 2) uniform sampler        vio_sampler_nearest;         // optional
layout(set = 1, binding = 3) uniform sampler        vio_sampler_clamp;           // optional
layout(set = 1, binding = 4) uniform sampler        vio_sampler_nearest_clamp;   // optional
layout(set = 1, binding = 5) uniform textureCube    vio_cubes[];                 // VioCubemap slots
layout(set = 1, binding = 6) uniform texture2DArray vio_texture_arrays[];        // layered VioTexture slots

// ...
o = texture(sampler2D(vio_textures[nonuniformEXT(slot)], vio_sampler), uv);
```

2D textures, texture arrays and cubemaps share 1024 slots; a slot is read through the array of its
kind. 3D textures and render-target textures stay out of the table.

## vio_texture_index

```php
int|false vio_texture_index(VioContext $context, VioTexture|VioCubemap $texture)
```

The slot of `$texture` in the context's bindless table. The first call adds the texture and keeps
it alive until `vio_texture_release_index()` or `vio_destroy()`; later calls return the same slot.
Returns `false` with a warning without `VIO_FEATURE_BINDLESS`.

```php
$slots = [];
foreach ($materials as $m) {
    $slots[] = vio_texture_index($ctx, $m->albedo);
}
// pass the slot per instance (vertex attribute, storage buffer, uniform) and index vio_textures[]
```

## vio_texture_release_index

```php
bool vio_texture_release_index(VioContext $context, VioTexture|VioCubemap $texture)
```

Free the bindless slot of `$texture`. Frames already recorded may still read it, so the table keeps
the entry and the texture for 4 more `vio_begin()` calls; after that the slot is cleared and
`vio_texture_index()` hands it out again. The texture can re-enter the table at once (under a new
slot). Returns `false` when the texture is not in the table.

## Sampler feedback

Two paths, used together where both exist:

| Path | Flag | Backends |
|---|---|---|
| **GLSL**: prepend `VIO_SAMPLER_FEEDBACK_GLSL` to the fragment source and call `vio_write_feedback($sampler, $uv)` next to the sample; the map lives at fragment storage binding 3 | `VIO_FEATURE_SAMPLER_FEEDBACK_GLSL` | Every backend with [fragment storage](/api/buffers#vio-bind-fragment-storage-buffer): OpenGL ≥ 4.3, D3D11, D3D12, Vulkan, Metal |
| **Hardware**: a MinMip feedback map written by `WriteSamplerFeedback` in an HLSL fragment override | `VIO_FEATURE_SAMPLER_FEEDBACK` | D3D12 with Shader Model 6.5 + `SamplerFeedbackTier` ≥ 0.9 |

On D3D12 with hardware feedback both maps are merged (minimum per region).

For the hardware path the fragment stage is an HLSL override –
`vio_shader(['vertex' => …, 'fragment' => $glsl, 'hlsl' => ['fragment' => $ps]])` – whose `main`
declares `FeedbackTexture2D<SAMPLER_FEEDBACK_MIN_MIP> vio_feedback : register(u0, space2);` and calls
`vio_feedback.WriteSamplerFeedback($tex, $sampler, $uv)` next to its sample. Texture / sampler
registers follow vio's scheme (`t0` / `s0` for unit 0, `cbuffer b0` with the layout of the GLSL
fragment uniforms); inputs use the SPIRV-Cross semantics (`TEXCOORD<location>`).

One map entry covers a region of mip 0: the largest power of two ≤ half the shorter side, between
4 and 128 texels (128 × 128 = one 64 KB tile of a 32-bit texture).

## vio_sampler_feedback_bind

```php
bool vio_sampler_feedback_bind(VioContext $context, ?VioTexture $texture)
```

Bind the feedback map paired with `$texture` (created on first use) for the following draws;
`null` unbinds – draws then record nothing. Returns `false` with a warning without either feedback
flag, and for 3D / array / borrowed textures and textures smaller than 8 × 8.

## vio_sampler_feedback_read

```php
array|false vio_sampler_feedback_read(VioContext $context, VioTexture $texture)
```

Decode the feedback map of `$texture`:
`['regions_x' => int, 'regions_y' => int, 'region' => int, 'min_mip' => list<int|null>]` –
`region` is the mip-0 texel count per region edge, `min_mip` row by row the lowest mip sampled in
each region since the last clear (`null` = never sampled). Waits for the GPU (also mid-frame, like
`vio_read_render_target()`).

## vio_sampler_feedback_clear

```php
bool vio_sampler_feedback_clear(VioContext $context, VioTexture $texture)
```

Reset the feedback map of `$texture` to "never sampled" (creates the map if needed).

```php
$fs = "#version 450\n" . VIO_SAMPLER_FEEDBACK_GLSL
    . "layout(location = 0) in vec2 uv;\nlayout(location = 0) out vec4 o;\n"
    . "uniform sampler2D u_tex;\n"
    . "void main() { vio_write_feedback(u_tex, uv); o = texture(u_tex, uv); }";

vio_sampler_feedback_clear($ctx, $tex);
vio_begin($ctx);
vio_bind_pipeline($ctx, $pipe);
vio_bind_texture($ctx, $tex, 0);
vio_sampler_feedback_bind($ctx, $tex);
vio_draw($ctx, $quad);
vio_sampler_feedback_bind($ctx, null);
vio_end($ctx);

$fb = vio_sampler_feedback_read($ctx, $tex);
// ['regions_x' => 2, 'regions_y' => 2, 'region' => 128, 'min_mip' => [3, 3, 3, 3]] (±1) for a mipmapped 256² texture on a 32² target
```
