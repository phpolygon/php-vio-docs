# Keyboard

Functions for keyboard input polling, callbacks, and injection.

## vio_key_pressed

```php
bool vio_key_pressed(VioContext $context, int $key)
```

Returns `true` if the key is currently held down.

## vio_key_just_pressed

```php
bool vio_key_just_pressed(VioContext $context, int $key)
```

Returns `true` only on the frame the key was first pressed (edge-triggered).

## vio_key_released

```php
bool vio_key_released(VioContext $context, int $key)
```

Returns `true` only on the frame the key was released.

## vio_chars_typed

```php
string vio_chars_typed(VioContext $context)
```

Returns all characters typed this frame as a UTF-8 string. Empty string if nothing was typed.

## vio_on_key

```php
void vio_on_key(VioContext $context, callable $callback)
```

Register a key event callback.

**Callback signature:**
```php
function(int $key, int $action, int $mods): void
```

- `$key` — Key constant (`VIO_KEY_*`)
- `$action` — `VIO_PRESS`, `VIO_RELEASE`, or `VIO_REPEAT`
- `$mods` — Bitmask of modifiers (`VIO_MOD_*`)

## vio_on_char

```php
void vio_on_char(VioContext $context, callable $callback)
```

Register a character input callback (Unicode codepoint).

**Callback signature:**
```php
function(int $codepoint): void
```

## vio_inject_key

```php
void vio_inject_key(VioContext $context, int $key, int $action)
```

Simulate a key press/release. Useful for testing.

- `$key` — Key constant (`VIO_KEY_*`)
- `$action` — `VIO_PRESS` or `VIO_RELEASE`

Call `vio_poll_events()` after injection for the state to take effect.
