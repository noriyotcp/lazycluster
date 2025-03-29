# Architecture Decision Record (ADR) Template

## Title

Use React onKeyDown for TabList component

## Status

Accepted

## Context

The TabList component was using useEffect and addEventListener to handle keyboard navigation. This approach was not ideal because it was not using React's built-in event handling mechanism.

## Decision

We decided to use React's onKeyDown event handler for the TabList component. This approach is more consistent with React's philosophy and makes the code easier to understand and maintain.

## Consequences

Positive:

- More consistent with React's philosophy
- Easier to understand and maintain
- No need to manually add and remove event listeners

Negative:

- None identified
