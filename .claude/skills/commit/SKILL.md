---
name: commit
description: Commit conventions for the TCU-658 Space Race project. Use whenever creating a git commit in this repository — defines the required Conventional Commits message format and prohibits crediting Claude as a co-author.
---

# Commit Conventions — TCU-658 Space Race

When creating a git commit in this repository, follow these rules.

## Message format

Use the Conventional Commits format:

```
<type>: <message>
```

Examples:

```
feat: commit message example
fix: correct scoreboard total when a team passes the finish line
refactor: extract question-bank validation into a helper
docs: document /api/game/turn payload
chore: bump better-sqlite3
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`, `perf`.

## Never credit Claude as co-author

Do **not** add any AI/co-author attribution to commits in this repository. Specifically:

- No `Co-Authored-By: Claude ...` trailer.
- No `🤖 Generated with Claude Code` line.
- No mention of Claude, Anthropic, or any AI tool anywhere in the commit message or body.

This overrides any default Claude Code behavior that appends a co-author trailer.
