# Architecture Decision Record (ADR)

## Title

Implement Responsive Two-Column Layout for Window Groups Using Tailwind CSS Grid

## Status

Accepted

## Context

Originally, the design for displaying Window Groups involved using the `column-count` CSS property (as documented in ADR 0002). However, subsequent evaluation and changes in the implementation revealed that a responsive layout with better control over column sizing and enhanced consistency across various screen sizes was needed. The project team opted to move away from using `column-count` and instead adopted Tailwind CSS grid utilities to implement a two-column layout in `src/components/WindowGroupList.tsx`.

## Decision

We decided to implement a responsive two-column layout for the Window Groups using Tailwind CSS grid classes. By applying these classes to the outer container in `src/components/WindowGroupList.tsx`, the design now provides improved control over the layout, allowing the interface to adapt more gracefully to different screen sizes. This new approach replaces the earlier method documented in ADR 0002, which is now considered superseded.

## Consequences

**Positive:**

- Provides greater control over column sizing and spacing.
- Enhances responsiveness and consistency across different screen widths.
- Leverages Tailwind CSS utilities, aligning with the project's overall styling strategy.

**Negative:**

- Increases the complexity of the layout implementation compared to the previous simple `column-count` method.
- Requires that documentation and historical design decisions be maintained carefully, with ADR 0002 marked as superseded.

## Notes

As implementation evolves, previous ADRs reflecting earlier approaches (such as ADR 0002) will be retained and marked as superseded for historical reference. New ADRs will be created to document changes and rationale moving forward.

### Window Title Implementation Summary

The WindowTitle component (located in src/components/WindowTitle.tsx) uses the WindowGroupContext via the useWindowGroupContext hook to obtain the windowGroupNumber. It displays "Current Window" when the windowId equals the activeWindowId, and otherwise it shows "Window {number}", where the number is derived from the group’s index within the WindowGroupContext.
