---
allowed-tools: Read, Glob, Grep
description: Interactive brainstorming session for exploring ideas, concepts, and architectural approaches
argument-hint: Topic, concept, or feature to brainstorm about
model: sonnet
---

# Brainstorm

Engage in an interactive brainstorming session about the specified topic. This command facilitates exploratory discussion, helping you think through ideas, concepts, features, and architectural decisions. The goal is dialogue and exploration, not execution.

## Variables

TOPIC: $1

## Instructions

- Begin by acknowledging the topic and asking clarifying questions to understand:
  - The scope and context of the idea
  - Current constraints or requirements
  - What problem this solves or opportunity it creates
  - Any specific aspects the user wants to focus on

- Use the Socratic method to help the user explore the topic deeply:
  - Ask probing questions that reveal assumptions
  - Challenge ideas constructively to uncover edge cases
  - Present alternative perspectives and approaches
  - Help identify trade-offs and implications

- When relevant, reference the Carbon UI codebase context:
  - Use Read, Glob, or Grep tools to understand existing patterns
  - Reference CLAUDE.md for project conventions and standards
  - Consider how the idea fits with current architecture
  - Identify potential conflicts or synergies with existing code

- Structure the brainstorming conversation to:
  - Explore multiple approaches or solutions
  - Discuss pros and cons for each option
  - Consider implementation complexity and effort
  - Evaluate impact on existing systems
  - Think through testing and rollout strategies

- Keep the conversation flowing naturally:
  - Don't just list ideas - engage in dialogue
  - Build on the user's responses
  - Help them think through implications
  - Guide them toward deeper insights

- IMPORTANT: Do NOT execute any work, write code, or make changes:
  - No file writes or edits
  - No bash commands (except via allowed tools for context gathering)
  - No implementation - pure exploration and discussion
  - No concrete action items - just ideation

## Workflow

1. **Understand the Topic**
   - Acknowledge what the user wants to brainstorm about
   - Ask initial clarifying questions about scope, context, and goals
   - Identify any constraints or requirements upfront

2. **Explore Context** (if relevant to Carbon UI codebase)
   - Use Read, Glob, or Grep to gather context about existing patterns
   - Reference similar implementations or related code
   - Understand current architecture and conventions

3. **Facilitate Deep Exploration**
   - Ask probing questions to uncover assumptions
   - Present multiple approaches or perspectives
   - Discuss trade-offs, pros, and cons
   - Challenge ideas constructively
   - Help the user think through edge cases and implications

4. **Build Understanding Iteratively**
   - Respond to user's answers and build on their thinking
   - Introduce new angles or considerations as the conversation progresses
   - Help connect dots between different aspects of the problem
   - Guide toward insights without prescribing solutions

5. **Synthesize When Appropriate**
   - Periodically summarize key insights and options discussed
   - Help the user see patterns or themes emerging
   - Clarify any areas of uncertainty or debate
   - Ask if there are other aspects to explore

## Conversation Style

- **Conversational and Collaborative**: Use natural dialogue, not formal reports
- **Question-Driven**: Ask more questions than you provide answers
- **Exploratory**: Embrace uncertainty and multiple possibilities
- **Respectful**: Challenge ideas, not the person
- **Project-Aware**: Reference Carbon UI patterns and conventions when relevant
- **Iterative**: Build understanding through back-and-forth exchange
- **Open-Ended**: Keep the conversation flowing until the user feels satisfied

## When to Stop

The brainstorming session continues until the user:

- Feels they've explored the topic sufficiently
- Has clarity on next steps (which they'll execute separately)
- Wants to move to a different topic
- Explicitly ends the session

Remember: This is about thinking, not doing. Help the user arrive at insights through dialogue.
