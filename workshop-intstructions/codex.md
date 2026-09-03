# Workshop Guide — Codex (ChatGPT app)

Welcome! This guide walks you through the whole workshop using **Codex** as
your agent — either the ChatGPT desktop app (Windows, macOS, Linux) or the
`codex` CLI in a terminal. If a step fails, check section 12 before asking
for help — your problem is probably listed there.

> Guides also exist for GitHub Copilot CLI and Claude Code. They all follow
> the same section numbers, so when the facilitator says "section 4", it's
> section 4 in every guide.

## 1. What you need before the workshop

- **ChatGPT desktop app** with Codex, or the **`codex` CLI**
  (`codex --version` works).
- **Logged in** to your ChatGPT/OpenAI account in the app or CLI. Do this
  now, not mid-exercise — invoking a skill talks to the model and requires
  an authenticated session.
- **Node.js 22+** (only needed for `npm run check`, the repo's validator).
- A terminal. Any OS works — on **Windows use PowerShell** (not the legacy
  `cmd.exe`); on **macOS/Linux** any shell (bash, zsh) is fine. Every
  command in this guide runs unchanged in all of those unless it's shown
  in two variants.

## 2. Get the code

1. Open <https://github.com/CoolhandinMotion/plugin-playground> in a browser.
2. Click **Code → Download ZIP**.
3. Unzip it somewhere convenient. You'll get a folder named
   `plugin-playground-master`.
4. Open your terminal **inside that folder** (the one containing `README.md`).
   Every command below runs from there.

## 3. Register the marketplace

A plugin marketplace is just a directory with a catalog file. From the
terminal:

```bash
codex plugin marketplace add ./
```

Or in the ChatGPT app: open the **Plugins** directory and add your unzipped
folder (or `CoolhandinMotion/plugin-playground`) as a marketplace source.

## 4. Install the plugin

Run `/plugins` inside a Codex session, select `meetup-marketplace`, and
install **plugin-playground**. Restart Codex after installing.

## 5. Verify the install (and the trust boundary)

Open the `/plugins` view again — `plugin-playground` should be listed as
installed, providing one skill (`example-skill`).

Also confirm no MCP server appeared: the repo bundles an MCP *example*, but
it's inert — it lives under `examples/`, and Codex only auto-loads a
`.mcp.json` placed at the plugin root, which this plugin doesn't have.
Installing the plugin started no process and reached no network. You just
verified a safety claim yourself instead of taking the README's word for it.

## 6. Invoke the skill

Ask Codex:

> Use the example-skill from the plugin-playground plugin.

Expected response: `plugin-playground example skill is available`

Note what just happened: sections 3–5 were *mechanical* — the app read files
and reported facts. This step was different: **the model chose** to invoke
the skill based on your words. That difference — your command vs. the agent's
judgment — is the core mental model of this workshop.

## 7. Edit the skill

Open this file in any editor:

```text
plugins/plugin-playground/skills/example-skill/SKILL.md
```

Change the response line in the body to something of your own, e.g.:

```text
Respond with `<YOUR NAME> was here and the skill knows it`.
```

Save the file. Now invoke the skill again, exactly as in section 6, and
observe the response carefully.

## 8. Updating an installed plugin

Reference: to refresh an installed plugin from its marketplace source, open
the `/plugins` view, update (or remove and reinstall) **plugin-playground**
from the `meetup-marketplace` entry, then **restart Codex**.
<!-- PREFLIGHT: confirm the exact update gesture in the current Codex build (update button vs remove+reinstall) before printing PDFs -->

After updating, invoke the skill again as in section 6.

## 9. Build your own skill

Don't hand-write it — ask Codex to draft it for you. Example prompt:

> Draft a `SKILL.md` for a plugin-playground skill that roasts my last git
> commit message in the style of a disappointed pirate. Follow the pattern in
> `plugins/plugin-playground/skills/example-skill/SKILL.md` — kebab-case name
> matching the directory, a description, and a body that just responds in
> chat with no tool use.

Rules your skill must follow (the validator enforces them):

- New directory under `plugins/plugin-playground/skills/`, kebab-case name.
- Frontmatter `name` matches the directory name exactly.
- The body only talks back — no tools, no network, no file writes.

Verify the draft:

```bash
npm run check
```

then update the plugin as in section 8 and invoke your new skill. If
`npm run check` complains, paste the exact error back to Codex and ask it to
fix it. That loop — describe intent, review the draft, hand back the
validator's complaint, iterate — is the actual skill being taught here.

## 10. Connect to the Cauldron

The Cauldron is a live, shared MCP server the whole room connects to. Unlike
a skill (which only talks), an MCP server gives your agent real tools with
real side effects — and everyone's agent is acting on the *same* shared state.

The facilitator will give you two things: the **server URL** and the room's
**access token**.

**Step 1 — set the token as an environment variable** (in the same terminal
or environment you run Codex from). Never paste the token itself into any
file.

PowerShell:

```powershell
$env:WORKSHOP_MCP_TOKEN = "<token from facilitator>"
```

bash/zsh:

```bash
export WORKSHOP_MCP_TOKEN="<token from facilitator>"
```

**Step 2 — create the MCP config.** Create a new file
`plugins/plugin-playground/.mcp.json` (at the plugin root — Codex auto-loads
it from there) with exactly this content (URL from the facilitator):

```json
{
  "mcpServers": {
    "cauldron": {
      "type": "http",
      "url": "<server URL from facilitator>/mcp",
      "headers": {
        "Authorization": "Bearer ${WORKSHOP_MCP_TOKEN}"
      },
      "tools": ["*"]
    }
  }
}
```

What each field means:

- `"cauldron"` — the name your agent shows for this server. Keep it as is.
- `"type": "http"` — the transport: this server is reached over HTTPS, not
  launched as a local process. (Compare the inert example under
  `examples/mcp/`, which is `"type": "stdio"` with a `command` — a program
  started on *your* machine. Remote servers use `url`; local ones use
  `command`. Never both.)
- `"url"` — the server's MCP endpoint. Must be `https:` and ends in `/mcp`.
- `"headers"` — extra HTTP headers sent with every request. Here it carries
  the standard `Authorization: Bearer <token>` credential.
- `"${WORKSHOP_MCP_TOKEN}"` — expanded from your environment variable at
  connect time. The file names the variable; it never contains the secret.
- `"tools": ["*"]` — allow every tool this server offers.

The same JSON body works on all three workshop agents — what differs per
agent is only *where* the file lives and *how* it gets activated, which is
why the guides differ only in the next step.

**Step 3 — activate it.** Update the plugin as in section 8 (so the new
config is picked up) and restart Codex. The `cauldron` server should now
appear among available tools.
<!-- PREFLIGHT: verify plugin-root .mcp.json auto-load + env-var expansion end-to-end in the current Codex build; record the known-good version here before printing PDFs; confirm the step-2 JSON is accepted verbatim by this client, including the "tools" field -->

**Step 4 — say hello.** Pick a display name for yourself (any silly name is
fine — it appears on the shared screen). Then ask Codex:

> Check the cauldron and tell me what's brewing. My name is <your display name>.

Watch the shared screen. Then follow the facilitator's lead.

## 11. Clean up

After the workshop, delete the Cauldron config: remove the file
`plugins/plugin-playground/.mcp.json` (any file manager or editor — same on
every OS).

Then remove the plugin and the marketplace source from the `/plugins` view,
or:

```bash
codex plugin marketplace remove meetup-marketplace
```

The room's token stops working when the workshop server is torn down (hours
from now), so there's nothing secret left on your machine — but unsetting
`WORKSHOP_MCP_TOKEN` or closing the terminal is good hygiene anyway.

## 12. If something goes wrong

| Symptom | Fix |
|---|---|
| Login or authentication error when invoking a skill | Not a plugin problem. Sign in to your ChatGPT account in the app (or `codex login` in the CLI), then retry. |
| Marketplace registration fails | Add the repository root (the folder with `README.md`), not a subfolder. |
| Skill response looks stale after an edit | Installs are cached copies — see section 8, and remember the restart. |
| `npm run check` fails | Read the error; it names the file and rule. Ask your agent to fix it and re-run. |
| `cauldron` doesn't appear after step 3 | Check `.mcp.json` is at the *plugin* root (`plugins/plugin-playground/`), `WORKSHOP_MCP_TOKEN` is set in the environment Codex runs from, and you updated the plugin *and* restarted Codex. |
| Cauldron calls rejected (401) | Token typo, or the env var isn't visible to the app. Re-set it and restart Codex from the same terminal. |
