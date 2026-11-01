# The Prisma Origin

The application repository is this directory (`E:\MyRPGv2` on this machine).

## Code navigation

- `src/core/`: deterministic combat, saves, economy and progression.
- `data/`: gameplay definitions; IDs connect characters, skills, statuses and rewards.
- `src/runtime/`: React state, persistence and desktop bridge.
- `src/ui/` and `src/components/`: presentation and interaction.
- `src-tauri/src/`: native desktop code. `test/` and `e2e/` verify behavior.

## Local Graphify

For cross-module architecture or impact questions, use the local graph to narrow the search:

```powershell
node scripts/graphify.mjs query "resolveAction applyEffect" --budget 1200
node scripts/graphify.mjs explain "combatTimeline"
node scripts/graphify.mjs path "resolveAction" "resolveHit"
node scripts/graphify.mjs affected "resolveHit" --depth 2
```

Read the actual located source before editing. Graph edges marked inferred are navigation hints, not proof of runtime behavior. Gameplay JSON IDs, phase/turn rules and visuals still need direct inspection and relevant tests. Ordinary focused searches and small edits do not require a graph query.

After source changes, run `npm.cmd run graph:update`. If the graph is missing, run `npm.cmd run graph:build`; if the executable is missing, run `npm.cmd run graph:setup`. A graph problem must not block unrelated work: fall back to `rg` and source reads. Do not read the full graph JSON into model context. Use `GRAPH_REPORT.md` only for broad architecture review.

This setup uses local code-only extraction. Do not enable semantic LLM extraction, cloud upload or install hooks automatically. Build output, local tools, assets and save data are excluded. Generated graph files stay local and are gitignored. See `docs/GRAPHIFY.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
