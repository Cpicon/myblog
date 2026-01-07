+++
title = "The Hybrid Architecture Pattern: Lessons from agent-team-creator"
date = 2026-01-06T11:00:00
weight = 2

[taxonomies]
categories = ["AI Engineering"]
tags = ["Claude Code", "Plugins", "AI Agents", "Hybrid Architecture"]
+++

# The Hybrid Architecture Pattern: Lessons from agent-team-creator

> *This is Part 1 of a three-part series. Start with [Part 0: Agent Team Creator](/posts/claude-code-plugin-journey-part0/) to see what the plugin does, or continue here for the development journey.*

I thought building a Claude Code plugin would take a weekend. Three days into wrestling with MCP tool access bugs, three-location file synchronization, and documentation that promised features that didn't work, I realized I was building something more valuable than a plugin—I was mapping uncharted territory.

This is the story of building **agent-team-creator**, a Claude Code plugin that analyzes codebases and generates project-specific AI agents. Along the way, I discovered a pattern that turned platform limitations into architectural clarity: the **Hybrid Architecture Pattern**.

<!-- more -->

---

## Act I: The Setup

### The Vision

The idea was simple: analyze any codebase and automatically generate a team of specialized Claude Code agents tailored to that project. A React frontend? Generate a component-designer agent. A Python ML pipeline? Spawn a model-trainer agent. The plugin would understand your code and create AI collaborators that speak your project's language.

I had read the documentation. Claude Code plugins support five component types—commands, agents, skills, hooks, and MCP integrations. Agents can spawn subagents using the Task tool. MCP servers provide external service access. It seemed straightforward.

Here's what I expected versus what I found:

| Expectation | Reality |
|-------------|---------|
| Plugin agents can access MCP tools | Plugin agents **cannot** access MCP (documented bug) |
| Agents can spawn nested subagents | Single-level nesting only |
| Documentation describes actual behavior | Docs claim MCP works, but it doesn't |
| Changes propagate automatically | 3-location manual sync required |
| Model inheritance works | Defaults to Sonnet 4 regardless of settings |

The gap between expectation and reality would become my curriculum.

### Understanding the Terrain

Before diving into the pain points, let me share the landscape. Claude Code plugins have five component types, each with distinct triggering mechanisms:

| Component | Trigger | Purpose |
|-----------|---------|---------|
| **Skills** | Auto-invoked | Context providers based on description matching |
| **Commands** | User-initiated (`/command`) | Slash command shortcuts |
| **Agents** | Spawned via Task tool | Separate Claude instances for specialized work |
| **Hooks** | Event-driven | Automation handlers (PreToolUse, PostToolUse, etc.) |
| **MCPs** | Tool calls | External service integrations |

The directory structure follows a predictable pattern:

{{ tree(root="plugin-root", nodes=".claude-plugin/:marketplace.json;plugin.json,commands/:*.md,agents/:*.md,skills/:SKILL.md,hooks/:*.md,.mcp.json:config") }}

Armed with this knowledge, I built my first prototype. It worked—sort of. The commands executed. The agents spawned. And then everything started breaking in ways the documentation didn't prepare me for.

---

## Act II: The Descent

### Pain Point #1: The MCP Tool Access Bug

My agent-team-creator plugin needed to integrate with Jira. The Atlassian MCP plugin was installed and working beautifully in the main Claude Code session. Following the documentation, I configured my plugin agent to access these MCP tools.

The error was immediate and confusing:

```
Error: No such tool available: mcp__plugin_atlassian__getJiraIssue
```

I spent hours debugging. Was my configuration wrong? Did I misname the tool? Then I found them—four GitHub issues documenting the same problem:

| Issue | Description |
|-------|-------------|
| #13605 | Custom plugin subagents cannot access MCP tools |
| #15810 | Subagents don't inherit MCP tools from plugin-defined agents |
| #14496 | Inconsistent MCP access with complex prompts |
| #7296 | Scope inheritance failure for Task-launched agents |

The documentation said:

> "When the tools field is omitted, subagents inherit all MCP tools available to the main thread."

Reality disagreed. Plugin-defined agents live in a different scope—they can see the MCP tools listed in the main session, but they cannot invoke them.

---

**★ Teaching Moment: The MCP Scope Reality**

MCP tools work reliably in two contexts:
1. The main Claude Code session
2. Commands (which run in the main session's scope)

MCP tools **do not work** in:
- Plugin-defined agents spawned via Task tool
- Subagents of any kind

If your plugin needs external service access, your **commands** must handle it, not your agents.

---

### Pain Point #2: Three-Location Sync Hell

After modifying my agent definitions, I reloaded Claude Code. My changes weren't there. I edited again. Still nothing.

It turns out Claude Code plugins exist in three separate locations that must be manually synchronized:

| Location | Path | Purpose |
|----------|------|---------|
| Marketplace Source | `~/.claude/local-marketplace/` | Where you edit |
| Installed Plugin | `~/.claude/plugins/plugin-name/` | Where Claude reads |
| Cache | `~/.claude/plugins/cache/marketplace/plugin/version/` | Versioned backup |

There's no hot reload. There's no auto-sync. You edit in one place, but Claude reads from another.

The solution? A sync script:

```bash
#!/bin/bash
PLUGIN_NAME="agent-team-creator"
MARKETPLACE="$HOME/.claude/local-marketplace"
INSTALLED="$HOME/.claude/plugins/$PLUGIN_NAME"
CACHE="$HOME/.claude/plugins/cache/local-marketplace/$PLUGIN_NAME/1.0.0"

rsync -av "$MARKETPLACE/commands/" "$INSTALLED/commands/"
rsync -av "$MARKETPLACE/commands/" "$CACHE/commands/"
rsync -av "$MARKETPLACE/agents/" "$INSTALLED/agents/"
rsync -av "$MARKETPLACE/agents/" "$CACHE/agents/"
echo "Plugin synced to all locations"
```

After every change: sync, quit Claude Code, restart. This became muscle memory.

---

**★ Teaching Moment: Debugging Your Plugin**

When things go wrong, these commands are your friends:

```bash
# Check if plugin is loaded
ls ~/.claude/plugins/

# Verify cache sync
diff -r ~/.claude/plugins/agent-team-creator/ \
        ~/.claude/plugins/cache/local-marketplace/agent-team-creator/1.0.0/

# Validate marketplace.json syntax
cat ~/.claude/local-marketplace/.claude-plugin/marketplace.json | jq .

# View plugin structure
tree ~/.claude/plugins/agent-team-creator/
```

---

### Pain Point #3: Schema Validation Gotchas

My first marketplace.json was rejected with cryptic errors:

```
owner: Expected object, received string
source: Invalid input
```

The schema is strict and underdocumented. Here's what works:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "local-marketplace",
  "description": "Local plugins for Claude Code",
  "owner": {
    "name": "Your Name",
    "email": "your@email.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "description": "Plugin description",
      "version": "1.0.0",
      "author": {
        "name": "Author Name",
        "email": "author@email.com"
      },
      "source": "./",
      "category": "development"
    }
  ]
}
```

Key gotchas:
- `owner` must be an object with `name` and `email`, not a string
- `source` must be `"./"` with the trailing slash
- Missing any required field causes silent failures

---

## Act III: The Discovery

### The Documentation vs. Reality Gap

The breaking point came when I built an entire multi-agent architecture based on documented behavior—only to have it fail completely.

The docs promised:

> "MCP Tools: Subagents can access MCP tools from configured MCP servers."

I tested extensively. Plugin-defined subagents **cannot** access MCP tools. This isn't a configuration issue—it's a known bug tracked across multiple GitHub issues.

**The lesson**: Documentation represents *intended* behavior, not *guaranteed* behavior. Always validate assumptions empirically before building dependent architectures.

### The Nesting Wall

My original design had agents spawning specialized sub-agents in a recursive tree structure. Elegant in theory. Impossible in practice.

When I tried:

{{ blocked_flow(nodes="User,Command,Agent,SubAgent", blocked="SubSubAgent") }}

Claude Code responded:

```
Error: Subagents cannot spawn subagents
```

This is a hard platform limit. Single-level nesting only. The constraint exists for good reasons—preventing infinite recursion, maintaining bounded resource consumption, ensuring predictable execution. But it invalidated my entire architecture.

### Model Inheritance That Doesn't Inherit

I configured my agents to use `model: inherit`, expecting them to use whatever model the parent session used. Every single subagent defaulted to Sonnet 4, regardless of:
- Parent model
- Global settings
- Local settings
- Explicit agent configuration

Another discovery: Claude Code infers agent behavior from naming. An agent named "code-reviewer" triggers built-in review behaviors that may override your custom instructions. Naming isn't just labeling—it's functional.

---

## Act IV: The Solution

### The Hybrid Architecture Pattern

Constraints breed creativity. Facing MCP access bugs, nesting limits, and model inheritance failures, I developed what I now call the **Hybrid Architecture Pattern**.

The core insight: **Commands and Agents have different capabilities. Use each for what it does well.**

**Command Layer (I/O)**:
- MCP tool access (works reliably)
- File system operations
- User interaction (AskUserQuestion)
- Response caching
- External service communication

**Agent Layer (Intelligence)**:
- Pure reasoning and analysis
- Content formatting
- Decision making
- Pattern recognition
- **No direct I/O dependencies**

Commands become the I/O adapters. Agents become the reasoning engines. Neither tries to do the other's job.

### The 6-Phase Pipeline

Here's how this plays out in my `/generate-jira-task` command:

{% pipeline() %}
[
    {"phase": 0, "owner": "Command", "label": "MCP Check", "io": "external"},
    {"phase": 1, "owner": "Command", "label": "Project Resolve", "io": "external"},
    {"phase": 2, "owner": "Command", "label": "Load Report", "io": "local"},
    {"phase": 3, "owner": "Command", "label": "Dup Check", "io": "external"},
    {"phase": 4, "owner": "Agent", "label": "Reasoning", "io": "none"},
    {"phase": 5, "owner": "Agent", "label": "Formatting", "io": "none"},
    {"phase": 6, "owner": "Command", "label": "Output", "io": "external"}
]
{% end %}

Commands handle all external communication (cyan nodes). Agents handle all thinking (green nodes). The boundary is clean—notice how I/O operations (marked EXTERNAL/LOCAL) cluster at the Command layer.

### Graceful Degradation

What if MCP isn't available? The pattern handles this elegantly:

```
FALLBACK_MODE activates when:
  - Atlassian MCP plugin unavailable

Actions:
  - Skip Phase 1 (project resolution)
  - Skip Phase 3 (duplicate check)
  - Phase 6: Output markdown to .claude/reports/jira-drafts/
```

The intelligence layer (Phases 4-5) works identically whether connected to Jira or not. The I/O layer gracefully degrades to local file output.

---

**★ Teaching Moment: Command and Agent Frontmatter**

**Command Template**:
```yaml
---
name: generate-jira-task
description: Generate Jira task from debugging report
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-hint: "[report-file]"
---
```

**Agent Template**:
```yaml
---
name: implementation-planner
description: |
  Use this agent to analyze debugging reports and create implementation plans.
model: inherit
color: cyan
tools:
  - Read
  - Grep
  - Glob
---
```

Note: Agents should **not** include MCP tools in their tools list—they won't work anyway.

---

## Act V: The Return

### What Works Now

The agent-team-creator plugin now functions reliably with three commands:
- `/generate-agent-team` - Analyzes codebases and generates specialized agents
- `/generate-debugger` - Creates project-specific debugging agents
- `/generate-jira-task` - Converts debugging reports to Jira tasks

Each follows the Hybrid Architecture Pattern. Commands handle I/O. Agents handle reasoning. The system degrades gracefully when services are unavailable.

### Lessons Learned

| Lesson | Implication |
|--------|-------------|
| Trust but verify documentation | Build minimal proofs-of-concept before committing to architectures |
| Constraints reveal clarity | The hybrid pattern is cleaner than my original unconstrained design |
| Sync is your responsibility | Automate it. Make it muscle memory. |
| Naming is functional | Agent names influence platform behavior |
| Explicit over implicit | Never assume tool inheritance; declare everything |

### Quick-Start Checklist for New Plugin Developers

1. **Setup**: Create marketplace structure with proper JSON schema
2. **Develop**: Edit files in marketplace source only
3. **Sync**: Run rsync script after every change
4. **Restart**: Quit and restart Claude Code (no hot reload)
5. **Test**: Verify command availability with `/help`
6. **Debug**: Use `diff -r` and `jq` for validation

The key lesson: **Commands for I/O, Agents for reasoning**. This pattern works around every bug I encountered.

---

## Conclusion

Building agent-team-creator taught me more about AI agent architecture than any documentation could. The bugs weren't obstacles—they were teachers. The constraints weren't limitations—they were design principles in disguise.

The Hybrid Architecture Pattern emerged from necessity, but I now believe it's superior to unconstrained designs. Clear boundaries between I/O and intelligence layers make systems easier to test, debug, and extend. Graceful degradation becomes natural when you've already separated concerns.

In Part 2 of this series, I'll step back from the practical details and examine what these discoveries reveal about agent framework design more broadly. Why do inheritance models break down in multi-agent systems? What makes the hub-and-spoke topology emerge naturally? And what does naming-as-behavior tell us about AI systems in general?

For now, if you're building Claude Code plugins: embrace the constraints. They'll teach you things the documentation can't.

---

## Get the Plugin

The plugin is open source: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Use the [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) tab to request features, report bugs, or discuss improvements.

---

**Series Navigation:**
- **Part 0**: [Agent Team Creator](/posts/claude-code-plugin-journey-part0/) — What the plugin does and how to use it
- **Part 1** (You are here): Building the plugin, lessons learned
- **Part 2**: [The Inheritance Paradox](/posts/claude-code-plugin-journey-part2/) — Research insights, patterns

---

*This post is based on empirical observations from building the agent-team-creator plugin. All pain points and solutions were documented through real development sessions.*
