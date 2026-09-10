# Workshop Instructions

One guide per agent — pick the one you'll be driving and ignore the others:

- [github-copilot.md](github-copilot.md) — GitHub Copilot CLI
- [claude-code.md](claude-code.md) — Claude Code
- [codex.md](codex.md) — Codex (ChatGPT app)

All three guides share the same section numbers, so when the facilitator says
"section 4", it's section 4 in every guide. Follow the facilitator's pace —
the workshop unfolds section by section, and some of the best parts aren't
written down anywhere.

If a step fails, check section 12 of your guide first, then ask your agent,
then raise a hand.

## The validator

`npm run check` validates the whole repository — manifests, skills, and MCP
configurations. It runs in seconds and tells you exactly which file and rule
failed. When it complains about something you built, paste the exact error
back to your agent and let it fix it.

## MCP environment variables

Configuration files in this repository name environment variables instead of
containing their values — the validator rejects any config with an inline
secret. These are the variables you may meet:

| Variable | Purpose | When required | Default |
|---|---|---|---|
| `EXAMPLE_MCP_ROOT` | Absolute directory exposed by the inert filesystem example | Only if you manually activate that example | No default; set locally |
| `WORKSHOP_MCP_TOKEN` | Access token for the workshop's shared MCP server | Section 10 — handed out by the facilitator | No default; never write the value into a file |
