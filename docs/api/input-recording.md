# Input Recording & Replay

Record everything a context receives as input and play it back later – for bug reproduction,
automated play-throughs, demo loops or bot scripts. The recording is a plain PHP array that
survives `json_encode()` / `json_decode()` and can be written by hand.

Available on every backend and platform (including `null`); it works on the input layer, not on
the GPU.

## Clock: ticks

Time is counted in **ticks** – one per `vio_poll_events()` call since the recording or replay
started. A replay is only as deterministic as the game loop: poll once per frame and advance the
simulation with a fixed time step.

## vio_input_record_start

```php
void vio_input_record_start(VioContext $context)
```

Start recording the context's input: keys (with modifiers), typed text, cursor, mouse buttons,
scroll and touch – whether it came from the OS or from `vio_inject_*`. Gamepads are sampled once
per `vio_poll_events()`: connects, disconnects, button and axis changes. Pads that are already
connected are recorded at tick 0. Restarting discards the events recorded so far.

## vio_input_record_stop

```php
array vio_input_record_stop(VioContext $context)
```

Stop recording and return the events. Returns `[]` if nothing was recording.

Every entry has `'tick'` and `'type'` plus the fields of its type:

| `type` | Fields |
|---|---|
| `key` | `key`, `action`, `mods` |
| `char` | `codepoint` |
| `cursor` | `x`, `y` (raw cursor coordinates) |
| `button` | `button`, `action` |
| `scroll` | `dx`, `dy` |
| `touch` | `id`, `phase`, `x`, `y` |
| `gamepad_connect` | `gamepad`, `name` |
| `gamepad_disconnect` | `gamepad` |
| `gamepad_button` | `gamepad`, `button`, `pressed` (bool) |
| `gamepad_axis` | `gamepad`, `axis`, `value` |
| `end` | – (the tick the recording stopped) |

## vio_input_replay

```php
void vio_input_replay(VioContext $context, array $events)
```

Replay recorded or scripted input in the format of `vio_input_record_stop()`.

- Entries are sorted by tick; entries with the same tick keep their order. `'mods'` is optional,
  and so are the coordinates of an ended or cancelled touch.
- Tick-0 events are delivered immediately; tick-N events in the N-th `vio_poll_events()` call
  from here, after the OS events, through the same path as real input – callbacks
  (`vio_on_key`, `vio_on_char`) fire.
- The replay owns the input while it runs: OS keyboard / mouse events are dropped (injections with
  `vio_inject_*` still pass) and physical gamepads are hidden. Gamepad events drive [virtual gamepads](/api/gamepad#virtual-gamepads),
  which are disconnected when the replay ends.
- The replay ends one poll after its last event, or with `vio_input_replay_stop()`. Starting a
  replay stops a running one.

Throws a `ValueError` naming the first malformed entry; nothing is replayed then.

## vio_input_replay_stop

```php
void vio_input_replay_stop(VioContext $context)
```

Stop a running replay early and hand input back to the OS.

## vio_input_replaying

```php
bool vio_input_replaying(VioContext $context)
```

Whether a replay is still running.

## Example

```php
// Record a session ...
vio_input_record_start($ctx);
while (!vio_should_close($ctx) && $recording) {
    vio_poll_events($ctx);
    update(1 / 60);            // fixed step
    render($ctx);
}
file_put_contents('session.json', json_encode(vio_input_record_stop($ctx)));

// ... and play it back
vio_input_replay($ctx, json_decode(file_get_contents('session.json'), true));
while (vio_input_replaying($ctx)) {
    vio_poll_events($ctx);
    update(1 / 60);
    render($ctx);
}
```

A hand-written bot script:

```php
vio_input_replay($ctx, [
    ['tick' => 0,  'type' => 'key',  'key' => VIO_KEY_W, 'action' => VIO_PRESS],
    ['tick' => 30, 'type' => 'key',  'key' => VIO_KEY_W, 'action' => VIO_RELEASE],
    ['tick' => 31, 'type' => 'char', 'codepoint' => ord('x')],
]);
```
