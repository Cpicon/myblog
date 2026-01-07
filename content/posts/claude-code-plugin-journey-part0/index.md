+++
title = "Claude Code Plugin Journey Part 0: Agent Team Creator"
date = 2026-01-06T10:00:00
weight = 1

[taxonomies]
categories = ["AI Engineering"]
tags = ["Claude Code", "Plugins", "Productivity", "AI Agents"]
+++

# Claude Code Plugin Journey Part 0: Agent Team Creator

What if you could point an AI at your project and have it generate specialists who actually understand your stack? Not generic assistants—agents that know your architecture, your patterns, your conventions.

That's what `agent-team-creator` does. Let me show you the workflow.

<!-- more -->

---

## Scenario 1: Generate Your Agent Team

You start a new project—or join an existing one. The codebase is unfamiliar. You need help, but generic AI advice isn't cutting it.

**Step 1: Generate your agent team**

```
/generate-agent-team
```

Watch as the plugin analyzes your project:

```
Analyzing codebase...
├── Languages: Python (75%), TypeScript (20%), SQL (5%)
├── Frameworks: FastAPI, React, SQLAlchemy
├── Architecture: Monorepo with backend/frontend split
├── Patterns: Repository pattern, dependency injection

Generating specialized agents...

✓ fastapi-expert
  Knows: Your endpoint patterns, Pydantic models, middleware stack

✓ react-specialist
  Knows: Your component library, state management, hook patterns

✓ database-architect
  Knows: Your SQLAlchemy models, migration patterns, query conventions

✓ test-strategist
  Knows: Your pytest fixtures, mocking patterns, test utilities

Team saved to .claude/agents/
```

**Step 2: Use your agents immediately**

Now you have project-aware specialists. Here's how to use them:

**Ask about architecture:**

```
Use the fastapi-expert agent to explain how authentication
works in this project
```

**Implement a feature:**

```
Use the react-specialist agent to help me add a new dashboard
component following our existing patterns
```

**Debug an issue:**

```
Use the database-architect agent to help me understand why
this query is slow - check src/repositories/user_repo.py
```

**Write tests:**

```
Use the test-strategist agent to write integration tests for
the new payment endpoint following our test conventions
```

**The difference?** These agents don't give generic advice. They reference *your* files, *your* patterns, *your* conventions.

---

## Scenario 2: Advanced Debugging Workflow

After you've generated your agent team, you can create a **Project Debugger**—an orchestrator that coordinates your specialists to diagnose complex issues.

**Step 1: Generate the Project Debugger**

```
/generate-debugger
```

```
Discovering project agents...
├── Found: fastapi-expert, react-specialist, database-architect, test-strategist

Analyzing project architecture...
├── Entry points identified
├── Error handling patterns mapped
├── Logging conventions detected

Generating project-debugger.md...

✓ Created: .claude/agents/project-debugger.md
  - Orchestrates your 4 specialist agents
  - Produces structured debugging reports
  - Identifies root causes with file:line references
```

**Step 2: Use the Debugger to investigate**

When you hit a bug, invoke the project debugger:

```
Use the project-debugger agent to investigate: Users are
getting 500 errors when submitting the checkout form
```

The debugger orchestrates your specialists:

```
Consulting fastapi-expert...
├── Traced request flow through api/routes/checkout.py
├── Found: PaymentService.process() raises unhandled exception

Consulting database-architect...
├── Checked transaction handling in repositories/order_repo.py
├── Found: Missing rollback on payment failure

Consulting test-strategist...
├── Reviewed test coverage for checkout flow
├── Found: No test for payment failure scenario

Generating debugging report...
```

**Step 3: Generate a debugging report**

The debugger produces a structured report saved to `.claude/reports/debugging/` :

```markdown
# Debugging Report: Checkout 500 Errors

## Root Cause
Missing exception handling in PaymentService.process()
(src/services/payment.py:45) combined with missing
transaction rollback (src/repositories/order_repo.py:78)

## Evidence
- File: src/services/payment.py:45-52
- File: src/repositories/order_repo.py:78-85
- Missing test: tests/integration/test_checkout.py

## Recommended Fix
1. Add try/except in payment.py:45
2. Implement rollback in order_repo.py:78
3. Add failure scenario test

## Side Effects
- Orders may be in inconsistent state (needs migration)
```

**Step 4: Create a Jira ticket from the report**

Now turn that report into a Jira task. The command automatically finds the most recent debugging report:

```
/generate-jira-task
```

```
Finding latest debugging report...
├── Found: .claude/reports/debugging/report-2026-01-06-1430.md

Loading debugging report...

Checking for similar issues...
├── Searching: "checkout payment exception rollback"
├── Found 2 potentially related issues:

  PROJ-234: "Payment processing timeout errors"
           Status: In Progress

  PROJ-189: "Checkout form validation issues"
           Status: Done

How would you like to proceed?
> Create new task anyway
> Abort - I'll update an existing issue
```

If you choose to create a new task:

```
Creating Jira issue...
✓ Created: PROJ-456 "Fix checkout 500 errors: missing exception handling"
  https://yourcompany.atlassian.net/browse/PROJ-456
```

The duplicate check prevents cluttering your backlog with related issues. If the bug is a variant of an existing issue, you can update that ticket instead of creating a new one.

**No Jira configured?** The command gracefully falls back to generating a ready-to-paste markdown file in `.claude/reports/jira-drafts/`.

---

## Scenario 3: Repeatable Workflow for Multiple Bugs

Each bug investigation creates its own debugging report, which leads to its own Jira ticket. Here's how the workflow scales across multiple issues:

**Monday: API performance issue**

```
Use the project-debugger agent to investigate: Why are
API response times spiking during peak hours?
```

Report saved: `.claude/reports/debugging/report-2026-01-06-0900.md`

```
/generate-jira-task
```

Created: `PROJ-457 "Optimize database connection pooling for peak load"`

---

**Tuesday: Frontend rendering bug**

```
Use the project-debugger agent to investigate: The dashboard
chart isn't updating when new data arrives
```

Report saved: `.claude/reports/debugging/report-2026-01-07-1100.md`

```
/generate-jira-task
```

Created: `PROJ-458 "Fix React state synchronization in DashboardChart component"`

---

**Wednesday: Authentication edge case**

```
Use the project-debugger agent to investigate: Users are
being logged out randomly after password changes
```

Report saved: `.claude/reports/debugging/report-2026-01-08-1400.md`

```
/generate-jira-task
```

Created: `PROJ-459 "Handle session invalidation on password change correctly"`

---

Each investigation is independent. The debugger creates timestamped reports, and `/generate-jira-task` always picks up the most recent one. Your debugging history accumulates in `.claude/reports/debugging/`, giving you a searchable archive of past investigations.

---

## The Complete Workflow

{{ workflow(steps="/generate-agent-team|Creates specialist agents,Use agents daily|fastapi-expert react-specialist,/generate-debugger|Creates project-debugger,Debug issues|Saves to .claude/reports/,/generate-jira-task|Creates Jira ticket") }}

---

## Quick Start

### Installation

Install directly from the GitHub marketplace—no cloning required:

```bash
# Add the marketplace (one-time setup)
/plugin marketplace add Cpicon/claude-code-plugins

# Install the plugin
/plugin install agent-team-creator
```

That's it. The plugin is ready to use immediately.

### First Commands

1. Navigate to your project
2. Run `/generate-agent-team` to create your specialist agents
3. Start using your specialists: `Use the [agent-name] agent to...`
4. Run `/generate-debugger` to create your project debugger
5. Use the debugger to investigate bugs: `Use the project-debugger agent to investigate...`
6. Run `/generate-jira-task` to convert the debugging report to a ticket

---

## What You Get

| Command                  | Output                  | Value                                                 |
| ------------------------ | ----------------------- | ----------------------------------------------------- |
| `/generate-agent-team` | 3-6 specialist agents   | Project-aware help for features, questions, debugging |
| `/generate-debugger`   | Orchestrator agent      | Coordinates specialists for complex investigations    |
| `/generate-jira-task`  | Jira ticket or markdown | Auto-finds latest report, creates actionable ticket   |

### Time Savings

| Task                   | Before                 | After              |
| ---------------------- | ---------------------- | ------------------ |
| Get project-aware help | N/A (generic only)     | Immediate          |
| Debug complex issues   | Hours of investigation | Structured reports |
| Write Jira tickets     | 15-30 min              | 2-5 min            |

---

## Try It Yourself

The plugin is open source and available on GitHub: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Install it with two commands, run `/generate-agent-team`, and see what specialists emerge for your project.

### Contributing & Feedback

Have ideas for improvements? Found a bug? The [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) tab is where you can:

- **Request features** — Suggest new capabilities or enhancements
- **Report bugs** — Help improve reliability by reporting issues you encounter
- **Discuss improvements** — Share ideas for plugin maintenance and development

Your feedback shapes the plugin's roadmap.

In [Part 1](/posts/claude-code-plugin-journey-part1/), I'll show you how I built this plugin—the bugs I hit, the patterns I discovered, and why the architecture works the way it does.

---

**Series Navigation:**

- **Part 0** (You are here): What the plugin does and how to use it
- **Part 1**: [The Hybrid Architecture Pattern](/posts/claude-code-plugin-journey-part1/) — Building the plugin
- **Part 2**: [The Inheritance Paradox](/posts/claude-code-plugin-journey-part2/) — Research insights
