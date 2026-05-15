# Safety Notes

`smoketape` is conservative by default, but it is not a security sandbox.

## Defaults

- Temporary sandbox for every run.
- Fixture copies instead of in-place mutation.
- Sandbox-relative cwd and file assertion paths.
- 10 second per-step timeout when no timeout is configured.
- Proxy environment variables removed.
- `SMOKETAPE_NETWORK=disabled` marker set for commands.

## Explicit escape hatches

Use `--allow-host-cwd` only when a tape must run against a real checkout. Use `--allow-network` only when network behavior is the point of the smoke.
