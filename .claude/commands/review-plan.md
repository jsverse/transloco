---
description: Review an implementation plan before execution using the plan-reviewer skill
allowed-tools: Read Write Grep Glob Bash(git:*) Bash(nx:*)
---

Use the plan-reviewer skill to thoroughly review the current implementation plan.

If an argument was provided (`$ARGUMENTS`), use it as the plan file path. Otherwise, find the most recent plan in `.claude/plans/`.

Evaluate the plan for completeness, feasibility, risk, scope creep, code reuse, test coverage, and implementation order.

After completing the review, always write the review output to a file next to the plan. The review file path should be derived from the plan path by replacing `.md` with `-review.md` (e.g., `my-plan.md` → `my-plan-review.md`).
