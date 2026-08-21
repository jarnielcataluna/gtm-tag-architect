# AGENTS.md

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Project Rules

- **Plugin Architecture:** Follow Antigravity and Claude Code plugin standards (`plugin.json`, `mcp_config.json`, `skills/`, `rules/`).
- **Deterministic & Offline-First:** The GTM MCP server and `/setup` skill must support offline container JSON analysis without requiring mandatory external API keys during testing.
- **Safety First:** Modifying tags, triggers, or variables must support dry-run diffs before applying changes.
