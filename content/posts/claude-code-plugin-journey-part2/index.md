+++
title = "The Inheritance Paradox: Tool Scoping in Multi-Agent Systems"
date = 2026-01-06T12:00:00
weight = 3

[taxonomies]
categories = ["AI Research"]
tags = ["Agent Architecture", "Tool Scoping", "AI Systems", "Multi-Agent"]
+++

# The Inheritance Paradox: Tool Scoping in Multi-Agent Systems

> *This is Part 2 of a three-part series. See [Part 0](/posts/claude-code-plugin-journey-part0/) for the plugin overview and installation, or [Part 1](/posts/claude-code-plugin-journey-part1/) for the development journey.*

**Abstract**: This article presents empirical observations from developing a Claude Code plugin, revealing fundamental patterns in multi-agent AI system design. Through documented development sessions, we identify three key findings: (1) implicit tool inheritance models consistently fail in practice, requiring explicit scope contracts; (2) platform-enforced topology constraints drive the emergence of specific architectural patterns; and (3) agent naming conventions become functional requirements in AI systems. These findings have implications for the design of agent frameworks beyond the specific platform studied.

<!-- more -->

---

## 1. Introduction

Agent-based development platforms represent an emerging paradigm in software engineering, where AI instances collaborate on complex tasks through structured orchestration. These platforms offer extension mechanisms—plugins, commands, agents—that allow developers to customize behavior for specific domains.

This article examines Claude Code as a case study in agent framework design. Claude Code enables developers to build custom plugins with commands (user-invoked shortcuts), agents (specialized Claude instances), skills (context providers), hooks (event handlers), and MCP integrations (external service connections).

During the development of `agent-team-creator`, a plugin for generating project-specific AI agents, we documented systematic observations about platform behavior. These observations reveal patterns relevant to multi-agent system design more broadly.

### Research Questions

1. How do tool inheritance models behave in practice versus documentation?
2. What architectural patterns emerge from platform topology constraints?
3. How do naming conventions influence agent behavior in AI systems?

---

## 2. Platform Architecture Analysis

### 2.1 Component Type Taxonomy

Claude Code plugins support five distinct extension types, each with different triggering mechanisms and scope:

| Component | Trigger | Invocation | Scope |
|-----------|---------|------------|-------|
| Skills | Auto (Claude decides) | Implicit | Cross-product |
| Commands | User (`/syntax`) | Explicit | Claude Code |
| Agents | Spawn (Task tool) | Explicit/Implicit | Claude Code |
| Hooks | Events | Automatic | Claude Code |
| MCPs | Tool calls | Explicit | Claude Code |

**Key Observation**: Skills are unique in being cross-product (functional in web UI, API, and CLI), while all other components are Claude Code-specific. This suggests different inheritance models may apply to different component types.

### 2.2 Tool Inventory

The platform provides 15 built-in tools available to agents:

1. Read, Write, Edit, MultiEdit (file operations)
2. Glob, Grep, LS (search operations)
3. Bash (system commands)
4. WebFetch, WebSearch (web access)
5. NotebookRead, NotebookEdit (Jupyter support)
6. TodoRead, TodoWrite (task tracking)
7. exit_plan_mode (workflow control)

Additionally, MCP (Model Context Protocol) servers provide external service integrations—database access, API connections, third-party services.

### 2.3 Lifecycle Events

Nine hook events define the agent lifecycle:

| Event | Trigger |
|-------|---------|
| PreToolUse | Before any tool execution |
| PostToolUse | After tool execution |
| UserPromptSubmit | User message received |
| Stop | Agent completion |
| SubagentStop | Subagent completion |
| SessionStart | Session initialization |
| SessionEnd | Session termination |
| PreCompact | Before context compaction |
| Notification | System notification |

Hook exit codes follow Unix conventions: 0 for success, 2 for blocking errors (Claude processes stderr), other codes for non-blocking errors.

---

## 3. Key Findings

### 3.1 The Inheritance Paradox

**Documentation Claim**:
> "MCP Tools: Subagents can access MCP tools from configured MCP servers. When the tools field is omitted, subagents inherit all MCP tools available to the main thread."

**Observed Behavior**: Plugin-defined subagents cannot access MCP tools under any tested configuration.

This discrepancy is documented across four GitHub issues (#13605, #15810, #14496, #7296), each describing a different manifestation of scope inheritance failure:

| Issue | Failure Mode | Scope Context |
|-------|-------------|---------------|
| #13605 | Plugin agents can't access MCP | Plugin vs built-in |
| #15810 | Subagents don't inherit MCP | Parent-child hierarchy |
| #14496 | Complex prompts break MCP access | Prompt complexity |
| #7296 | Task-launched agents lack MCP | User-scoped inheritance |

**Analysis**: The pattern suggests a fundamental architectural issue rather than isolated bugs. Tool inheritance operates differently across scope boundaries:

1. **Built-in agents** inherit MCP tools correctly
2. **Plugin-defined agents** do not inherit MCP tools
3. **Task-launched agents** receive a fresh scope without user-level configurations

**Implication for Framework Design**: Implicit tool inheritance models require explicit contracts at scope boundaries. Assuming tools propagate through agent hierarchies creates fragile dependencies. Explicit tool declarations at each scope level, while verbose, produce predictable behavior.

### 3.2 Topology Constraints and Emergent Patterns

**Discovery**: The platform enforces a single-level nesting limit for agent spawning.

{{ blocked_flow(nodes="Agent,Subagent", blocked="Subsubagent") }}

When an agent attempts to spawn a nested subagent, the platform returns:

```
Error: Subagents cannot spawn subagents
```

**Design Rationale (Inferred)**:
- Prevents infinite recursion in autonomous systems
- Maintains bounded resource consumption
- Ensures predictable execution topology
- Simplifies debugging and monitoring

**Emergent Architecture: Hub-and-Spoke**

{{ hub_spoke(hub="Main Agent", spokes="Agent 1,Agent 2,Agent 3") }}

This constraint eliminates tree-structured agent hierarchies in favor of flat, hub-coordinated topologies. The "hub" agent coordinates parallel execution of "spoke" agents. No spoke can spawn additional agents.

**Observed Trade-off**:

| Lost Capability | Gained Property |
|-----------------|-----------------|
| Recursive decomposition | Bounded execution depth |
| Dynamic hierarchy | Predictable topology |
| Arbitrary nesting | Simplified resource management |

**Implication for Framework Design**: Topology constraints are design decisions, not merely limitations. The hub-and-spoke pattern that emerges from single-level nesting produces systems that are easier to reason about, debug, and monitor than arbitrary recursive structures.

### 3.3 Naming as Behavior

**Discovery**: Claude Code infers agent behavior from agent names.

An agent named `code-reviewer` triggers built-in review behaviors that may override custom system prompt instructions. The platform applies heuristics based on naming conventions.

**Observed Pattern**:

| Agent Name | Inferred Behavior |
|------------|------------------|
| `code-reviewer` | Generic code review patterns |
| `test-writer` | Test generation patterns |
| `implementation-planner` | Less inference, more custom control |

**Analysis**: This represents a "convention over configuration" paradigm applied to AI agent systems. The platform assumes semantically meaningful names carry behavioral intent.

**Implications**:
1. Naming conventions become functional requirements
2. Distinctive, non-generic names preserve custom behavior
3. Agent system design must consider name-based inference

---

## 4. Emergent Patterns

### 4.1 I/O Separation (Hybrid Architecture)

In response to MCP access limitations, a clear architectural pattern emerged: separating I/O operations from intelligence operations.

**Layer Model**:

| Layer | Responsibilities | Components |
|-------|-----------------|------------|
| I/O | MCP access, file ops, user interaction, caching | Commands |
| Intelligence | Reasoning, analysis, formatting, decisions | Agents |

**6-Phase Pipeline Example**:

{% pipeline() %}
[
    {"phase": 0, "owner": "Command", "label": "Availability", "io": "external"},
    {"phase": 1, "owner": "Command", "label": "Data Resolve", "io": "external"},
    {"phase": 2, "owner": "Command", "label": "Load Content", "io": "local"},
    {"phase": 3, "owner": "Command", "label": "Validation", "io": "external"},
    {"phase": 4, "owner": "Agent", "label": "Reasoning", "io": "none"},
    {"phase": 5, "owner": "Agent", "label": "Formatting", "io": "none"},
    {"phase": 6, "owner": "Command", "label": "Delivery", "io": "external"}
]
{% end %}

**Generalizability**: This separation applies to any framework where tool access constraints exist. The intelligence layer becomes portable and testable in isolation. The I/O layer becomes the platform-specific adapter.

### 4.2 Phase-Based Validation

Each phase transition represents a validation checkpoint:

| Checkpoint | Validation |
|------------|------------|
| Pre-phase | Input contract verification |
| Mid-phase | Progress checkpoint |
| Post-phase | Output contract enforcement |
| Inter-phase | Data transformation validation |

**Error Recovery Strategies**:
1. Rollback to last valid state
2. Retry with modified parameters
3. Escalate to fallback mode
4. Preserve partial results

### 4.3 Graceful Degradation

**FALLBACK_MODE Pattern**:

When external services become unavailable, the system degrades gracefully:

{{ comparison(mode1_title="Normal Mode", mode1_steps="Phase 1: MCP Resolve,Phase 3: Dup Check,Phase 6: Create Issue", mode2_title="Fallback Mode", mode2_steps="Phase 1: Skip,Phase 3: Skip,Phase 6: Local File", shared_title="Intelligence Layer (Always Active)", shared_steps="Phase 4: Reasoning,Phase 5: Formatting") }}

The intelligence layers (Phases 4-5) function identically in both modes. Core reasoning is preserved even when I/O capabilities are reduced.

---

## 5. Framework Design Implications

### 5.1 Tool Access Philosophy

**Recommendation**: Prefer explicit tool declarations over implicit inheritance.

The inheritance paradox demonstrates that implicit models create unexpected scope boundaries. Explicit declarations, while verbose, produce predictable behavior:

```yaml
# Explicit (recommended)
tools:
  - Read
  - Write
  - Grep

# Implicit (problematic)
tools: inherit  # Behavior varies by context
```

### 5.2 Documentation Fidelity

**Requirement**: Implementation must match documentation.

The gap between documented and actual MCP behavior consumed significant debugging effort. Automated testing of documented behaviors would catch such discrepancies before they reach users.

### 5.3 Testing in Real Contexts

**Requirement**: Test with actual platform constraints.

MCP access works in isolation testing but fails in plugin contexts. Integration tests must execute in production-like environments with actual scope boundaries.

### 5.4 Developer Experience Considerations

**Observation**: Complex deployment requirements discourage experimentation.

The three-location sync requirement, lack of hot reload, and strict schema validation add friction to the development cycle. Each constraint adds approximately 2-5 minutes per change cycle versus seconds for hot-reload systems.

**Trade-off Analysis**:

| Constraint | Benefit | Cost |
|------------|---------|------|
| Three-location sync | Version consistency | Manual sync overhead |
| No hot reload | State predictability | Restart delay |
| Strict schema | Early error detection | Debugging difficulty |

---

## 6. Conclusion

### Summary of Contributions

This empirical study of Claude Code plugin development reveals patterns applicable to multi-agent AI system design:

1. **The Inheritance Paradox**: Tool access inheritance models documented in specifications may not function across all scope boundaries. Explicit contracts prevent unexpected behavior.

2. **Topology-Driven Architecture**: Platform-enforced constraints (like single-level nesting) drive the emergence of specific patterns (hub-and-spoke) that may be superior to unconstrained designs.

3. **Naming as Behavior**: In AI agent systems, naming conventions carry functional implications beyond labeling.

4. **I/O Separation**: Separating I/O from intelligence creates portable, testable, gracefully-degrading systems.

### Limitations

This study is based on observations from a single platform (Claude Code) during a specific development period. Findings may not generalize to all agent frameworks. Additionally, platform behavior may change as bugs are resolved.

### Future Research Directions

1. Comparative analysis of tool inheritance models across agent platforms
2. Formal specification of scope contracts for multi-agent systems
3. Empirical studies of naming-behavior coupling in other AI systems
4. Framework design patterns that explicitly leverage topology constraints

---

## Appendix: Evidence Summary

### GitHub Issues Referenced

| Issue | Description |
|-------|-------------|
| #13605 | Custom plugin agents can't access MCP |
| #15810 | Subagents don't inherit MCP from plugin-defined agents |
| #14496 | Inconsistent MCP access with complex prompts |
| #7296 | Scope inheritance failure for Task-launched agents |

### Research Metrics

- **Observation Period**: January 3-4, 2026
- **Token Investment**: ~265,000 tokens across sessions
- **Distinct Observations**: 13 documented findings
- **Finding Types**: 4 Decisions, 8 Discoveries, 1 Change

### Methodology

Observations were collected through development sessions using the claude-mem persistent memory system. Each finding was cross-referenced against documentation and, where applicable, GitHub issue reports. Workarounds were developed through iterative experimentation.

---

## Get the Plugin

The plugin discussed in this research is open source: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Use the [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) tab to request features, report bugs, or discuss improvements.

---

**Series Navigation:**
- **Part 0**: [Agent Team Creator](/posts/claude-code-plugin-journey-part0/) — What the plugin does and how to use it
- **Part 1**: [The Hybrid Architecture Pattern](/posts/claude-code-plugin-journey-part1/) — Building the plugin, lessons learned
- **Part 2** (You are here): Research insights, patterns

---

*This article is based on empirical observations from developing the agent-team-creator Claude Code plugin. For practical implementation guidance, see Part 1.*
