# Security Policy

`smoketape` executes local commands from YAML tapes. Treat tapes like shell scripts: review them before running.

## Supported versions

The current `main` branch receives security fixes until the first tagged release policy is established.

## Reporting a vulnerability

Please report vulnerabilities through GitHub private vulnerability reporting when enabled, or by opening a minimal public issue that omits exploit details and asks for a private contact path.

## Security model

- Temp sandbox execution by default.
- No host cwd escape without `--allow-host-cwd`.
- Proxy env vars removed and network marked disabled unless `--allow-network` is supplied.
- Redaction support for configured secret values and common token patterns.
- No claim of isolation against malicious commands. If a command is dangerous, `smoketape` cannot make it safe.
