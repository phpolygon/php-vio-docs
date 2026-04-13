# Constants

Complete reference of all `VIO_*` constants.

## Vertex Formats

| Constant | Components | Type |
|---|---|---|
| `VIO_FLOAT1` | 1 | float |
| `VIO_FLOAT2` | 2 | float |
| `VIO_FLOAT3` | 3 | float |
| `VIO_FLOAT4` | 4 | float |
| `VIO_INT1` | 1 | int |
| `VIO_INT2` | 2 | int |
| `VIO_INT3` | 3 | int |
| `VIO_INT4` | 4 | int |
| `VIO_UINT1` | 1 | uint |
| `VIO_UINT2` | 2 | uint |
| `VIO_UINT3` | 3 | uint |
| `VIO_UINT4` | 4 | uint |

## Topology

| Constant | Value |
|---|---|
| `VIO_TRIANGLES` | 0 |
| `VIO_TRIANGLE_STRIP` | 1 |
| `VIO_TRIANGLE_FAN` | 2 |
| `VIO_LINES` | 3 |
| `VIO_LINE_STRIP` | 4 |
| `VIO_POINTS` | 5 |

## Culling

| Constant | Value |
|---|---|
| `VIO_CULL_NONE` | 0 |
| `VIO_CULL_BACK` | 1 |
| `VIO_CULL_FRONT` | 2 |

## Blending

| Constant | Value |
|---|---|
| `VIO_BLEND_NONE` | 0 |
| `VIO_BLEND_ALPHA` | 1 |
| `VIO_BLEND_ADDITIVE` | 2 |

## Depth Testing

| Constant | Value |
|---|---|
| `VIO_DEPTH_LESS` | 0 |
| `VIO_DEPTH_LEQUAL` | 1 |

## Texture Filtering

| Constant | Value |
|---|---|
| `VIO_FILTER_NEAREST` | 0 |
| `VIO_FILTER_LINEAR` | 1 |

## Texture Wrapping

| Constant | Value |
|---|---|
| `VIO_WRAP_REPEAT` | 0 |
| `VIO_WRAP_CLAMP` | 1 |
| `VIO_WRAP_MIRROR` | 2 |

## Shader Formats

| Constant | Value |
|---|---|
| `VIO_SHADER_AUTO` | 0 |
| `VIO_SHADER_SPIRV` | 1 |
| `VIO_SHADER_GLSL` | 2 |
| `VIO_SHADER_MSL` | 3 |
| `VIO_SHADER_GLSL_RAW` | 4 |
| `VIO_SHADER_HLSL` | 5 |

## Vertex Attribute Usage

| Constant | Value |
|---|---|
| `VIO_POSITION` | 0 |
| `VIO_COLOR` | 1 |
| `VIO_TEXCOORD` | 2 |
| `VIO_NORMAL` | 3 |
| `VIO_TANGENT` | 4 |

## Buffer Types

| Constant | Value |
|---|---|
| `VIO_BUFFER_VERTEX` | 0 |
| `VIO_BUFFER_INDEX` | 1 |
| `VIO_BUFFER_UNIFORM` | 2 |
| `VIO_BUFFER_STORAGE` | 3 |

## Features

| Constant | Value |
|---|---|
| `VIO_FEATURE_COMPUTE` | 0 |
| `VIO_FEATURE_RAYTRACING` | 1 |
| `VIO_FEATURE_TESSELLATION` | 2 |
| `VIO_FEATURE_GEOMETRY` | 3 |
| `VIO_FEATURE_MULTIVIEW` | 4 |

## Input Actions

| Constant | Value |
|---|---|
| `VIO_RELEASE` | 0 |
| `VIO_PRESS` | 1 |
| `VIO_REPEAT` | 2 |

## Mouse Buttons

| Constant | Value |
|---|---|
| `VIO_MOUSE_LEFT` | 0 |
| `VIO_MOUSE_RIGHT` | 1 |
| `VIO_MOUSE_MIDDLE` | 2 |

## Modifier Keys (Bitmask)

| Constant | Value |
|---|---|
| `VIO_MOD_SHIFT` | 0x0001 |
| `VIO_MOD_CONTROL` | 0x0002 |
| `VIO_MOD_ALT` | 0x0004 |
| `VIO_MOD_SUPER` | 0x0008 |
| `VIO_MOD_CAPS_LOCK` | 0x0010 |
| `VIO_MOD_NUM_LOCK` | 0x0020 |

## Keyboard Keys

### Letters
`VIO_KEY_A` (65) through `VIO_KEY_Z` (90)

### Numbers
`VIO_KEY_0` (48) through `VIO_KEY_9` (57)

### Function Keys
`VIO_KEY_F1` (290) through `VIO_KEY_F12` (301)

### Special Keys

| Constant | Value |
|---|---|
| `VIO_KEY_SPACE` | 32 |
| `VIO_KEY_APOSTROPHE` | 39 |
| `VIO_KEY_COMMA` | 44 |
| `VIO_KEY_MINUS` | 45 |
| `VIO_KEY_PERIOD` | 46 |
| `VIO_KEY_SLASH` | 47 |
| `VIO_KEY_SEMICOLON` | 59 |
| `VIO_KEY_EQUAL` | 61 |
| `VIO_KEY_LEFT_BRACKET` | 91 |
| `VIO_KEY_BACKSLASH` | 92 |
| `VIO_KEY_RIGHT_BRACKET` | 93 |
| `VIO_KEY_GRAVE_ACCENT` | 96 |
| `VIO_KEY_ESCAPE` | 256 |
| `VIO_KEY_ENTER` | 257 |
| `VIO_KEY_TAB` | 258 |
| `VIO_KEY_BACKSPACE` | 259 |
| `VIO_KEY_INSERT` | 260 |
| `VIO_KEY_DELETE` | 261 |
| `VIO_KEY_RIGHT` | 262 |
| `VIO_KEY_LEFT` | 263 |
| `VIO_KEY_DOWN` | 264 |
| `VIO_KEY_UP` | 265 |
| `VIO_KEY_PAGE_UP` | 266 |
| `VIO_KEY_PAGE_DOWN` | 267 |
| `VIO_KEY_HOME` | 268 |
| `VIO_KEY_END` | 269 |
| `VIO_KEY_CAPS_LOCK` | 280 |
| `VIO_KEY_SCROLL_LOCK` | 281 |
| `VIO_KEY_NUM_LOCK` | 282 |
| `VIO_KEY_PRINT_SCREEN` | 283 |
| `VIO_KEY_PAUSE` | 284 |
| `VIO_KEY_MENU` | 348 |

### Numpad Keys

| Constant | Value |
|---|---|
| `VIO_KEY_KP_0` – `VIO_KEY_KP_9` | 320–329 |
| `VIO_KEY_KP_DECIMAL` | 330 |
| `VIO_KEY_KP_DIVIDE` | 331 |
| `VIO_KEY_KP_MULTIPLY` | 332 |
| `VIO_KEY_KP_SUBTRACT` | 333 |
| `VIO_KEY_KP_ADD` | 334 |
| `VIO_KEY_KP_ENTER` | 335 |
| `VIO_KEY_KP_EQUAL` | 336 |

### Modifier Keys

| Constant | Value |
|---|---|
| `VIO_KEY_LEFT_SHIFT` | 340 |
| `VIO_KEY_LEFT_CONTROL` | 341 |
| `VIO_KEY_LEFT_ALT` | 342 |
| `VIO_KEY_LEFT_SUPER` | 343 |
| `VIO_KEY_RIGHT_SHIFT` | 344 |
| `VIO_KEY_RIGHT_CONTROL` | 345 |
| `VIO_KEY_RIGHT_ALT` | 346 |
| `VIO_KEY_RIGHT_SUPER` | 347 |

## Gamepad Buttons

| Constant | Value |
|---|---|
| `VIO_GAMEPAD_A` | 0 |
| `VIO_GAMEPAD_B` | 1 |
| `VIO_GAMEPAD_X` | 2 |
| `VIO_GAMEPAD_Y` | 3 |
| `VIO_GAMEPAD_LEFT_BUMPER` | 4 |
| `VIO_GAMEPAD_RIGHT_BUMPER` | 5 |
| `VIO_GAMEPAD_BACK` | 6 |
| `VIO_GAMEPAD_START` | 7 |
| `VIO_GAMEPAD_GUIDE` | 8 |
| `VIO_GAMEPAD_LEFT_THUMB` | 9 |
| `VIO_GAMEPAD_RIGHT_THUMB` | 10 |
| `VIO_GAMEPAD_DPAD_UP` | 11 |
| `VIO_GAMEPAD_DPAD_RIGHT` | 12 |
| `VIO_GAMEPAD_DPAD_DOWN` | 13 |
| `VIO_GAMEPAD_DPAD_LEFT` | 14 |

## Gamepad Axes

| Constant | Value |
|---|---|
| `VIO_GAMEPAD_AXIS_LEFT_X` | 0 |
| `VIO_GAMEPAD_AXIS_LEFT_Y` | 1 |
| `VIO_GAMEPAD_AXIS_RIGHT_X` | 2 |
| `VIO_GAMEPAD_AXIS_RIGHT_Y` | 3 |
| `VIO_GAMEPAD_AXIS_LEFT_TRIGGER` | 4 |
| `VIO_GAMEPAD_AXIS_RIGHT_TRIGGER` | 5 |

## Plugin Types

| Constant | Value |
|---|---|
| `VIO_PLUGIN_TYPE_GENERIC` | 0 |
| `VIO_PLUGIN_TYPE_OUTPUT` | 1 |
| `VIO_PLUGIN_TYPE_INPUT` | 2 |
| `VIO_PLUGIN_TYPE_FILTER` | 4 |
| `VIO_PLUGIN_API_VERSION` | 1 |
