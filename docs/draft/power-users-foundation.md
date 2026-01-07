# Claude Code Plugin Development Foundation Document

**Document Type:** Foundation Document (Structured Data)
**Purpose:** Source material for Power Users narrative blog post
**Source Memories:** #740, #744, #745, #746, #809, #832, #906, #910, #911, #920, #921, #1007, #1067

---

## 1. Project Context

### Plugin Overview
- **Plugin Name**: agent-team-creator
- **Goal**: Analyze codebases and generate project-specific Claude Code agents
- **Components Built**: /generate-agent-team, /generate-debugger, /generate-jira-task commands

### Initial Expectations vs Reality
| Expectation | Reality | Memory ID |
|-------------|---------|-----------|
| Plugin agents can access MCP tools | Plugin agents CANNOT access MCP (bug) | #745, #746 |
| Agents can spawn nested subagents | Single-level nesting only | #744 |
| Documentation describes actual behavior | Docs claim MCP works, but it doesn't | #746 |
| Changes propagate automatically | 3-location manual sync required | #906, #921 |
| Model inheritance works | Defaults to Sonnet 4 regardless of settings | #910 |

---

## 2. Plugin Architecture Facts

### 5 Component Types
**Source**: Memory #920

| Component | Trigger | Purpose |
|-----------|---------|---------|
| **Skills** | Auto-invoked | Context providers based on description matching |
| **Commands** | User-initiated | /command syntax shortcuts |
| **Agents** | Spawned | Separate Claude instances for specialized tasks |
| **Hooks** | Event-driven | Automation handlers for workflow events |
| **MCPs** | Tool providers | External service integrations |

### Directory Structure
```
plugin-root/
├── .claude-plugin/
│   ├── marketplace.json    # Marketplace manifest
│   └── plugin.json         # Plugin manifest
├── commands/               # Slash command definitions
│   └── *.md
├── agents/                 # Agent definitions
│   └── *.md
├── skills/                 # Skill definitions
│   └── skill-name/
│       └── SKILL.md
├── hooks/                  # Event handlers
│   └── *.md
└── .mcp.json               # MCP server configuration
```

### 15 Built-in Tools
**Source**: Memory #911
1. Read
2. Write
3. Edit
4. MultiEdit
5. Glob
6. Grep
7. LS
8. Bash
9. WebFetch
10. WebSearch
11. NotebookRead
12. NotebookEdit
13. TodoRead
14. TodoWrite
15. exit_plan_mode

### 9 Hook Events
**Source**: Memory #911
1. PreToolUse
2. PostToolUse
3. UserPromptSubmit
4. Stop
5. SubagentStop
6. SessionStart
7. SessionEnd
8. PreCompact
9. Notification

**Hook Exit Codes**:
- 0: Success
- 2: Blocking error (Claude processes stderr)
- Other: Non-blocking error

---

## 3. Pain Points Table

| Pain Point | Memory IDs | Symptoms | Root Cause | Solution |
|------------|------------|----------|------------|----------|
| **Three-Location Sync** | #906, #921, #1007 | New commands not recognized, "Unknown slash command" | Plugin files maintained in 3 locations; no auto-propagation | rsync script + restart |
| **MCP Tool Access Bug** | #745, #740, #746 | Agents can't access Atlassian MCP, "No such tool" errors | GitHub bugs #13605, #15810 - plugin agents don't inherit MCP | Hybrid architecture: Commands handle MCP |
| **Schema Validation** | #921, #906 | "owner: Expected object", "source: Invalid input" | Strict JSON schema, undocumented requirements | owner as object, source as "./" |
| **Subagent Nesting Limit** | #744, #910 | "Subagents cannot spawn subagents" | Platform design choice to prevent infinite recursion | Hub-and-spoke pattern |
| **Model Inheritance Bug** | #910 | Task agents use Sonnet 4 despite config | Bug in model propagation | Explicit model specification |
| **Mermaid Diagram Syntax** | #1067 | Lexical errors in flowcharts | "/" character in node labels breaks parser | Use brackets: "[/command]" |
| **Documentation vs Reality** | #746 | Built architectures that don't work | Docs claim MCP inheritance works | Empirical testing before building |

---

## 4. Hybrid Architecture Pattern

### Decision Rationale
**Source**: Memory #832, #809

Due to MCP Tool Access Bug (GitHub #13605, #15810), adopted separation of concerns:
- Commands = I/O Layer (reliable MCP access)
- Agents = Intelligence Layer (pure reasoning)

### Command Layer Responsibilities
- MCP tool access and execution
- File system operations (Read, Write, Glob)
- User interaction (AskUserQuestion)
- Response caching
- External service communication
- Validation between phases

### Agent Layer Responsibilities
- Pure reasoning and analysis
- Content formatting
- Decision making
- Pattern recognition
- NO direct MCP or file access

### 6-Phase Workflow Example
**Source**: Memory #832 (/generate-jira-task command)

| Phase | Owner | Action |
|-------|-------|--------|
| 0 | Command | MCP availability check |
| 1 | Command | Project resolution via MCP |
| 2 | Command | Load debugging report from file |
| 3 | Command | Duplicate check via MCP JQL |
| 4 | Agent | implementation-planner reasoning |
| 5 | Agent | jira-writer formatting |
| 6 | Command | Create Jira issue or fallback |

### Fallback Mode Behavior
When Atlassian MCP unavailable:
- Skip Phase 1 (project resolution)
- Skip Phase 3 (duplicate check)
- Phase 6: Output markdown to `.claude/reports/jira-drafts/`

---

## 5. Code Examples

### Sync Script
**Source**: Memory #906

```bash
#!/bin/bash
# sync-plugin.sh
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

### Correct marketplace.json Structure
**Source**: Memory #906

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

### Task Tool Invocation Syntax
**Source**: Memory #744, #832

```markdown
Use Task tool with:
- subagent_type: "plugin-name:agent-name"
- prompt: [input content]

Example:
Task(subagent_type="agent-team-creator:implementation-planner", prompt="...")
```

### Command Frontmatter
```yaml
---
name: command-name
description: Brief description
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-hint: "[optional-argument]"
---
```

### Agent Frontmatter
```yaml
---
name: agent-name
description: |
  Use this agent when [trigger conditions].
  Examples: "do X", "help with Y"
model: inherit
color: cyan
tools:
  - Read
  - Grep
  - Glob
---
```

---

## 6. Quick Reference Tables

### File Locations Table

| Location Type | Path | Purpose |
|--------------|------|---------|
| Marketplace Source | `~/.claude/local-marketplace/` or project path | Development location |
| Installed Plugin | `~/.claude/plugins/agent-team-creator/` | Active plugin location |
| Cache Location | `~/.claude/plugins/cache/local-marketplace/agent-team-creator/1.0.0/` | Cached version |

### Common Errors and Fixes Table

| Error | Fix | Memory ID |
|-------|-----|-----------|
| "No such tool available: Task" | Add Task to allowed-tools in agent config | #744 |
| "Plugin not found" | Sync all 3 locations and restart | #906, #1007 |
| "Invalid marketplace.json" | owner must be object, source must be "./" | #906 |
| "Subagent can't access MCP" | Move MCP operations to command level | #745, #746 |
| "Mermaid syntax error" | Use brackets around /commands: "[/command]" | #1067 |
| "Unknown slash command" | Sync + restart Claude Code session | #921 |

### Debugging Commands

```bash
# Check if plugin is loaded
ls ~/.claude/plugins/

# Verify cache sync
diff -r ~/.claude/plugins/agent-team-creator/ ~/.claude/plugins/cache/local-marketplace/agent-team-creator/1.0.0/

# Check marketplace.json syntax
cat ~/.claude/local-marketplace/.claude-plugin/marketplace.json | jq .

# View plugin structure
tree ~/.claude/plugins/agent-team-creator/

# Check for sync issues
find ~/.claude/plugins -name "*.md" -type f | xargs ls -la | grep agent-team-creator

# Verify enabled plugins
cat ~/.claude/settings.json | grep enabledPlugins
```

---

## 7. Key GitHub Issues Referenced

| Issue | Description | Memory ID |
|-------|-------------|-----------|
| #13605 | Custom plugin agents can't access MCP tools | #745 |
| #15810 | Subagents don't inherit MCP from plugin agents | #740, #745 |
| #14496 | Inconsistent MCP access with complex prompts | #745 |
| #7296 | Scope inheritance failure for Task-launched agents | #745 |

---

## 8. Development Workflow Summary

1. **Setup**: Create marketplace structure with proper JSON schema
2. **Develop**: Edit files in marketplace source
3. **Sync**: Run rsync script to propagate to all 3 locations
4. **Restart**: Quit and restart Claude Code session
5. **Test**: Verify command availability with /help
6. **Debug**: Use file comparison and JSON validation

**Key Lesson**: The hybrid architecture (Commands for I/O, Agents for reasoning) is the reliable workaround for MCP access bugs.

---

**Last Updated:** Based on memories #740-#1067

---

## Appendix A: Memory Reference (Full Context)

> **Note**: These are synthesized summaries of the original claude-mem observations. Each memory represents a discovery, decision, or change documented during plugin development.

---

### Memory #740: Additional MCP Bug Confirmation
**Type**: Discovery | **Date**: 2026-01-03

**Summary**: GitHub issue #15810 independently confirms that subagents do not inherit MCP tools from plugin-defined agents. Additionally discovered a critical MCP naming mismatch: agents list tools with one separator format (`mcp__plugin_hivebrite_atlassian__getJiraIssue`) while subagents reference them with a different format (`plugin_hivebrite_atlassian:getJiraIssue`), causing lookup failures.

**Key Facts**:
- GitHub #15810 documents bug where subagents don't inherit MCP tools
- MCP tool naming uses inconsistent separators between contexts
- Atlassian Remote MCP Server provides OAuth-secured access to Jira/Confluence
- awesome-claude-code repository catalogs plugins and MCP servers
- Seth Hobson's GitHub has 80+ specialized sub-agents

**Implication**: The MCP inheritance problem is a known, documented bug affecting plugin-defined agents specifically. Built-in agents work correctly.

---

### Memory #744: Technical Validation with Architectural Constraints
**Type**: Decision | **Date**: 2026-01-03

**Summary**: Comprehensive technical validation completed via knowledge-researcher agent (52,383 tokens, 410 seconds). Confirmed working patterns and identified critical limitations in Claude Code's agent architecture.

**Validated Assumptions**:
| Pattern | Status | Evidence |
|---------|--------|----------|
| Command → Agent | ✅ WORKS | Task tool in allowed-tools list |
| Agent → Agent | ⚠️ LIMITED | Single-level only; "Subagents cannot spawn subagents" |
| Plugin Agent → MCP | ❌ BLOCKED | GitHub #13605, #15810 |

**Recommended Architecture**: Hub-and-spoke pattern where User → Command → Main Agent → Parallel Subagents (no nesting beyond one level).

**Why Nesting is Blocked**: Platform design prevents infinite recursion and maintains manageable execution hierarchy. Context flows from parent to child via Task invocation with isolated context windows per subagent.

---

### Memory #745: Multiple MCP Tool Access Bugs (4 GitHub Issues)
**Type**: Discovery | **Date**: 2026-01-03

**Summary**: Four distinct GitHub issues document systemic MCP tool access failures across different contexts in Claude Code.

**Issue Details**:
| Issue | Description | Opened |
|-------|-------------|--------|
| #13605 | Custom plugin subagents cannot access MCP tools while built-in agents can | Dec 10, 2025 |
| #15810 | Subagents not inheriting MCP tools from plugin-defined agents | Later |
| #14496 | Task tool subagents have inconsistent MCP access with complex prompts | - |
| #7296 | Scope inheritance problem - Task-launched agents don't inherit user-scoped MCP servers | - |

**Key Finding**: User-scoped MCP servers aren't inherited by Task-launched agents, indicating a scope resolution bug.

**Workaround Discovered**: Start subagent with simple prompt, then use `resume` parameter for complex work. This suggests the issue relates to context initialization complexity.

**Available Debug Tool**: `--mcp-debug` flag for diagnosing MCP configuration issues.

---

### Memory #746: Documentation vs Reality Gap
**Type**: Discovery | **Date**: 2026-01-03

**Summary**: Critical discrepancy found between Anthropic's official documentation and actual Claude Code behavior regarding MCP tool inheritance.

**What Documentation Says**:
> "MCP Tools: Subagents can access MCP tools from configured MCP servers. When the tools field is omitted, subagents inherit all MCP tools available to the main thread."

**What Actually Happens**: Plugin-defined subagents CANNOT access MCP tools, directly contradicting documentation.

**Possible Interpretations**:
1. Documentation describes intended behavior that's broken in implementation
2. Bugs are regressions from previously working functionality
3. Built-in subagents work as documented, but plugin-defined subagents don't

**Critical Lesson**: Architectures based on documented behavior may fail in practice. Always validate assumptions empirically before building.

---

### Memory #809: Hybrid Architecture Adoption Decision
**Type**: Decision | **Date**: 2026-01-03

**Summary**: Adopted hybrid architecture as workaround for MCP tool access bugs. Commands handle all I/O operations; agents handle pure reasoning.

**Architecture Split**:

**Commands Own (I/O Layer)**:
- MCP tool calls to Atlassian plugin
- File reads and writes
- User interaction (AskUserQuestion)
- Response caching
- External service communication

**Agents Own (Intelligence Layer)**:
- Analyzing reports (implementation-planner)
- Formatting content (jira-writer)
- Pure reasoning without I/O dependencies

**Validation**: The /generate-jira-task command successfully uses this pattern with 6 phases, alternating between command-level I/O and agent-level reasoning.

**Key Change**: Removed duplicate-detector agent entirely; moved its JQL search functionality to command-level operations where MCP works reliably.

---

### Memory #832: Hybrid Architecture Finalized (6-Phase Pipeline)
**Type**: Decision | **Date**: 2026-01-04

**Summary**: Complete hybrid architecture specification for Jira integration, demonstrating the command-level MCP + agent-level reasoning pattern.

**6-Phase Workflow**:
| Phase | Owner | Operation |
|-------|-------|-----------|
| 0 | Command | MCP availability check |
| 1 | Command | Project resolution via MCP (skipped in fallback) |
| 2 | Command | Load debugging report from file |
| 3 | Command | Duplicate check via MCP JQL (skipped in fallback) |
| 4 | Agent | implementation-planner reasoning |
| 5 | Agent | jira-writer formatting |
| 6 | Command | Create Jira issue OR output markdown |

**FALLBACK_MODE Behavior**:
- Triggers when Atlassian MCP plugin unavailable
- Skips Phase 1 (project resolution) and Phase 3 (duplicate check)
- Phase 6 outputs markdown to `.claude/reports/jira-drafts/` instead of creating Jira issue

**Validation Between Phases**: Check agent outputs for required sections (Problem Summary, Recommended Approach, Implementation Steps, Testing Requirements, Risk Assessment) before proceeding.

**Caching**: Project configuration cached to `.claude/jira-project.json` to avoid repeated user prompts.

---

### Memory #906: Multi-Location Synchronization Requirements
**Type**: Discovery | **Date**: 2026-01-04

**Summary**: Plugin development requires understanding and managing three separate file locations that must be manually synchronized.

**Three Plugin Locations**:
| Location | Path | Purpose |
|----------|------|---------|
| Marketplace Source | `~/.claude/local-marketplace/` | Original development files |
| Installed Plugin | `~/.claude/plugins/plugin-name/` | Active plugin directory |
| Plugin Cache | `~/.claude/plugins/cache/marketplace/plugin/version/` | Versioned cache |

**Schema Validation Gotchas**:
| Error | Cause | Fix |
|-------|-------|-----|
| `owner: Expected object` | Used string instead of object | `"owner": {"name": "...", "email": "..."}` |
| `source: Invalid input` | Used "." | Use "./" with trailing slash |

**Critical Workflow**:
1. Edit files in marketplace source
2. Run rsync sync script to propagate changes
3. Restart Claude Code session (no hot reload)
4. Verify command availability

**Recommended Sync Script**: See Code Examples section for rsync-based synchronization.

---

### Memory #910: Subagent Model Inheritance Bug
**Type**: Discovery | **Date**: 2026-01-04

**Summary**: Model configuration doesn't propagate correctly to Task-spawned subagents, and Claude infers agent behavior from naming.

**Model Field Options**:
| Option | Behavior |
|--------|----------|
| `sonnet`, `opus`, `haiku` | Explicit model selection |
| `inherit` | Use same model as parent conversation |
| (omitted) | Defaults to sonnet |

**Known Bug**: Task tool spawned sub-agents default to Claude Sonnet 4 regardless of:
- Parent model
- Global settings
- Local settings
- Agent definitions

**Name-Based Behavior Inference**: Claude Code infers sub-agent function from agent name (e.g., "code-reviewer" triggers generic review rules), potentially overriding custom instructions. Use distinctive naming to avoid generic behavior.

**Tool Restrictions**: Each subagent can have different tool access levels through `tools` field in agent definition. Path-based restrictions can scope operations to specific directories.

---

### Memory #911: Comprehensive Plugin Architecture
**Type**: Discovery | **Date**: 2026-01-04

**Summary**: Complete plugin system documentation compiled from official sources including Anthropic docs, GitHub, and technical blogs.

**Plugin Definition**: Modular extension package for custom slash commands, specialized agents, skills, hooks, and MCP server integrations.

**Standard Structure**:
```
plugin-root/
├── .claude-plugin/plugin.json    # Only file in this directory
├── commands/                      # Markdown files with YAML frontmatter
├── agents/                        # Markdown files with YAML frontmatter
├── skills/                        # Three-tier progressive disclosure
├── hooks/                         # Event handlers
└── .mcp.json                      # MCP configuration
```

**15 Built-in Tools**: Read, Write, Edit, MultiEdit, Glob, Grep, LS, Bash, WebFetch, WebSearch, NotebookRead, NotebookEdit, TodoRead, TodoWrite, exit_plan_mode

**9 Hook Events**: PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionStart, SessionEnd, PreCompact, Notification

**Hook Exit Codes**:
- 0: Success
- 2: Blocking error with Claude processing stderr
- Other: Non-blocking error

**MCP Configuration**: Supports SSE, stdio, HTTP, WebSocket protocols with `${CLAUDE_PLUGIN_ROOT}` variable for relative paths.

---

### Memory #920: 5 Plugin Component Types
**Type**: Discovery | **Date**: 2026-01-04

**Summary**: Clarification of the five distinct component types in Claude Code plugins and their triggering mechanisms.

**Component Comparison**:
| Component | Trigger | Scope | Purpose |
|-----------|---------|-------|---------|
| **Skills** | Auto-invoked by Claude | Cross-product | Context providers based on description matching |
| **Commands** | User via /syntax | Claude Code only | Saved prompts for repeatable workflows |
| **Agents** | Spawned by main agent or user | Claude Code only | Separate Claude instances for specialized tasks |
| **Hooks** | System events | Claude Code only | Automation handlers (auto-format, approval gates) |
| **MCPs** | Tool calls | Claude Code only | External service integrations |

**Key Distinction**: Skills work across all Claude products (web, API, Claude Code) while other components are Claude Code-specific.

**Pattern**: Commands can invoke subagents for planning while Main Claude retains full tool access for execution.

---

### Memory #921: Development Workflow Constraints
**Type**: Discovery | **Date**: 2026-01-04

**Summary**: Synthesis of development workflow requirements and common friction points.

**Key Constraints**:
1. **Marketplace Required**: No "loose" plugin installation; must use marketplace structure
2. **3-Location Sync**: Changes in source don't auto-propagate to installed or cache
3. **No Hot Reload**: New commands require Claude Code restart
4. **Strict Schema**: JSON validation is unforgiving

**Development Cycle**:
1. Create marketplace structure with `.claude-plugin/` directory
2. Add `marketplace.json` and `plugin.json` with all required fields
3. Register marketplace: `/plugin marketplace add path`
4. Install plugin: `/plugin install plugin-name`
5. For updates: sync files to all 3 locations + restart

**Debugging Tools**:
- `find ~/.claude -name "command.md"` to locate files
- `cat settings.json | grep enabledPlugins` to verify status
- `jq .` to validate JSON syntax

---

### Memory #1007: Cache Synchronization Achieved
**Type**: Change | **Date**: 2026-01-04

**Summary**: Successful synchronization of all plugin commands across the three distribution locations.

**Verification Results**:
| Command | Size | Status |
|---------|------|--------|
| generate-agent-team.md | 2,309 bytes | ✅ Synced |
| generate-debugger.md | 11,797 bytes | ✅ Synced |
| generate-jira-task.md | 15,835 bytes | ✅ Synced |

**Lesson**: Identical file sizes across cache, installed, and marketplace locations confirms successful synchronization. Use `diff -r` or file size comparison to verify sync status.

---

### Memory #1067: Mermaid Diagram Syntax Errors
**Type**: Bugfix | **Date**: 2026-01-04

**Summary**: Mermaid flowchart diagrams fail to render due to malformed node definitions involving slash commands.

**Problem**: The "/" character in node labels causes lexical parsing errors.

**Error Example**:
```
Error at text "/generate-agent-team] C[/generat" - unrecognized bracket syntax
```

**Affected Patterns**: Workflow diagrams showing `/generate-agent-team`, `/generate-debugger` commands as nodes.

**Solution**: Wrap slash commands in square brackets within the node definition:
```mermaid
A["Run /generate-agent-team"]   # Correct
A[/generate-agent-team]          # Wrong - causes parser error
```

---

## Appendix B: Cross-Reference Index

| Topic | Primary Memories | Related Memories |
|-------|-----------------|------------------|
| MCP Access Bug | #745, #746 | #740, #809, #832 |
| Hybrid Architecture | #832, #809 | #745, #746 |
| Plugin Structure | #911, #920 | #906, #921 |
| Development Workflow | #906, #921 | #1007 |
| Subagent Limitations | #744, #910 | #745 |
| Schema Validation | #906, #921 | - |
| Debugging | #1007, #1067 | #906, #921 |
