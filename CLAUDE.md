@AGENTS.md

## Browser use (Claude only)

When you need a browser — screenshots, visual verification, driving the site — use `agent-browser`, not Playwright. Playwright is only for the `pnpm e2e` test suite.

```sh
pnpm exec agent-browser open http://localhost:3000/components
pnpm exec agent-browser snapshot -i        # refs like @e1 for click/fill
pnpm exec agent-browser screenshot out.png
pnpm exec agent-browser close
```

The `agent-browser` skill in `.claude/skills/` has the full command reference.
