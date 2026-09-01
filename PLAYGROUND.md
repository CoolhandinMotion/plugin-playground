# Now build your own

You've installed `plugin-playground`, watched `example-skill` respond on cue, and
confirmed the bundled MCP example stays inert. That's the guided tour. This is
the part where you drive.

## What you're allowed to build

A skill in this repository is a `SKILL.md` file: YAML frontmatter (`name`,
`description`) plus a body telling the agent what to do when the skill is
relevant. `example-skill` sticks to one rule on purpose — respond in chat only,
no tools, no network, no file writes, no processes — because the plugin
manifest declares only `skills/`, nothing else. Stay inside that same rule and
anything you dream up will validate cleanly:

- The skill directory name and the frontmatter `name` must match, in
  kebab-case (`lowercase-with-hyphens`).
- `description` should say when the skill applies, in plain language.
- The body can say anything — the only hard constraint is "just talk back,
  don't act."

Full mechanics are in [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-skill) — this
page is the playful on-ramp, that one is the reference.

## Co-write it, don't hand-write it

Don't open a blank `SKILL.md` and start typing. Ask whichever AI assistant
you're running (Copilot CLI, Claude Code, anything agentic) to draft it for
you:

> "Draft a `SKILL.md` for a plugin-playground skill that roasts my last git
> commit message in the style of a disappointed pirate. Follow the pattern in
> `plugins/plugin-playground/skills/example-skill/SKILL.md` — kebab-case name
> matching the directory, a description, and a body that just responds in
> chat with no tool use."

Then verify what it wrote:

```bash
npm run check
copilot skill list
copilot -p "invoke your new skill somehow"
```

If `npm run check` complains, hand the exact error back to your assistant and
ask it to fix it. That loop — describe intent, review the draft, point at the
validator's complaint, iterate — is the actual skill this exercise is
teaching, not the pirate joke.

## Starter ideas, if you want a nudge

Pick one, remix one, or ignore all of them and invent your own — anything
that just talks back is fair game.

- **Commit roaster** — turns your most recent commit message into a
  theatrically disappointed review.
- **Fortune cookie** — answers only in short, deadpan aphorisms about
  shipping code.
- **Skill about skills** — explains what a Copilot CLI skill is, from inside
  a skill, self-referentially.
- **Mood ring** — given one word, responds with an ASCII mood and a
  one-line explanation.

## One real MCP promotion

Everything so far has been a skill responding in chat. MCP is different: it's
a real external process the agent can call tools on, which is why
`plugin-playground` ships its filesystem example *inert*, parked under
`examples/mcp/` where nothing auto-discovers it. This exercise promotes it to
active, for real, so you can see the difference with your own eyes.

Follow [CONTRIBUTING.md's promotion steps](CONTRIBUTING.md#promoting-an-mcp-template-to-active-configuration):

```bash
mkdir -p plugins/plugin-playground
cp plugins/plugin-playground/examples/mcp/.mcp.json plugins/plugin-playground/.mcp.json
```

Add `"mcpServers": ".mcp.json"` to `plugins/plugin-playground/plugin.json`,
then:

```bash
npm run check
export EXAMPLE_MCP_ROOT="$(pwd)"
copilot plugin update plugin-playground
copilot mcp list
```

Compare that against the smoke test, where `example-filesystem` never
appeared. Now it does — that's the promotion doing its job.

This is a local experiment on your own copy of the repo, not something to
commit back. Roll it back when you're done:

```bash
git checkout -- plugins/plugin-playground/plugin.json
rm plugins/plugin-playground/.mcp.json
copilot plugin update plugin-playground
```

## Show it off

Once your skill responds the way you meant it to, invoke it once more and
paste the exact `copilot` output into chat with the group. Half the point of
building something silly is watching everyone else's silly thing work too.
