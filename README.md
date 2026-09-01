# Plugin Playground

Example skills and reviewed MCP configuration patterns for GitHub Copilot CLI,
Claude Code, and Codex (the ChatGPT app). One repo layout serves all three
agents: Copilot reads `.github/plugin/marketplace.json`, Claude Code reads
`.claude-plugin/marketplace.json`, Codex reads `.agents/plugins/marketplace.json`,
and each installs the same plugin from `plugins/plugin-playground/`.

> **Trust boundary** — review plugin source and MCP permissions before
> installation. The MCP example included in this repository is inert and
> starts no process.

## Prerequisites

- GitHub Copilot CLI with plugin support.
- Node.js 22+ (only required for running contribution checks).

## Local installation

```bash
copilot plugin marketplace add "$(pwd)"
copilot plugin install plugin-playground@meetup-marketplace
copilot plugin list
```

## Public installation

```bash
copilot plugin marketplace add CoolhandinMotion/plugin-playground
copilot plugin install plugin-playground@meetup-marketplace
```

## Claude Code installation

No IDE needed — any terminal with the `claude` CLI works. From the public
repository:

```bash
claude plugin marketplace add CoolhandinMotion/plugin-playground
claude plugin install plugin-playground@meetup-marketplace
```

Or from a local checkout: `claude plugin marketplace add ./` (run at the
repository root), then the same install command. The same two commands also
work as `/plugin marketplace add …` and `/plugin install …` inside an
interactive Claude Code session.

Verify with `claude plugin list` (expect `plugin-playground@meetup-marketplace`,
enabled), then ask Claude to use `example-skill` and confirm the exact
response `plugin-playground example skill is available`. The inert MCP
template stays inert here too: it lives under `examples/`, which Claude Code
does not auto-load.

Cleanup:

```bash
claude plugin uninstall plugin-playground@meetup-marketplace
claude plugin marketplace remove meetup-marketplace
```

## Codex (ChatGPT app) installation

No IDE needed — the ChatGPT desktop app works on Windows, macOS, and Linux.
Codex reads the marketplace from `.agents/plugins/marketplace.json` and the
plugin manifest from `plugins/plugin-playground/.codex-plugin/plugin.json`.

In the app: open the Plugins directory, add
`CoolhandinMotion/plugin-playground` (or the full repository URL) as a
marketplace source, then install **plugin-playground** from the
`meetup-marketplace` entry. Restart Codex after installing.

The same works from any terminal with the `codex` CLI:

```bash
codex plugin marketplace add CoolhandinMotion/plugin-playground
```

then run `/plugins` inside a Codex session, select `meetup-marketplace`, and
install `plugin-playground`.

Verify by asking Codex to use `example-skill` and confirming the exact
response `plugin-playground example skill is available`. The inert MCP
template stays inert here too: Codex only auto-loads a `.mcp.json` placed at
the plugin root, and ours lives under `examples/`, which is never auto-loaded.

Cleanup: remove the plugin and the marketplace source from the same
`/plugins` view (or `codex plugin marketplace remove meetup-marketplace`).

## Update

```bash
copilot plugin marketplace update meetup-marketplace
copilot plugin update plugin-playground
```

## Disable / enable

```bash
copilot plugin disable plugin-playground
copilot plugin enable plugin-playground
```

## Uninstall / remove

```bash
copilot plugin uninstall plugin-playground
copilot plugin marketplace remove meetup-marketplace
```

## Local smoke test

```bash
copilot plugin marketplace add "$(pwd)"
copilot plugin marketplace browse meetup-marketplace
copilot plugin install plugin-playground@meetup-marketplace
copilot plugin list
copilot mcp list
copilot
```

Inside interactive Copilot run `/skills list`, confirm `example-skill`,
invoke it, and confirm the exact response
`plugin-playground example skill is available`. Confirm
`example-filesystem` is absent from `copilot mcp list`.

Cleanup:

```bash
copilot plugin uninstall plugin-playground
copilot plugin marketplace remove meetup-marketplace
```

Finished the smoke test? [**PLAYGROUND.md**](PLAYGROUND.md) has playful
exercises for building your own skill and promoting the MCP example to
active.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Invalid marketplace registration | Use repository root or `CoolhandinMotion/plugin-playground`; verify `.github/plugin/marketplace.json`. |
| Stale cache | `copilot plugin marketplace update meetup-marketplace`; reinstall local plugin because installs are cached. |
| Version mismatch | Synchronize both `0.1.0` values and run `npm run check`. |
| Missing runtime command | Install the command named by the activated MCP config and verify `PATH`. |
| Missing environment variable | Export the documented variable without committing its value. |
| Existing installed plugin blocks marketplace removal | Uninstall the plugin first; do not use `--force` as a normal path. |

## MCP environment variables

| Variable | Purpose | When required | Default |
|---|---|---|---|
| `EXAMPLE_MCP_ROOT` | Absolute directory exposed by inert filesystem example | Required only when manually testing template | No default; set locally |

## CI

Every pull request and push is validated by `.github/workflows/validate.yml` on
Node.js 22 and 24 via `npm run check`. The workflow uses read-only permissions
(`contents: read`) and performs no deploys, releases, or authenticated
Copilot calls.
