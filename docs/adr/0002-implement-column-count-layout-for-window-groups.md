## Title

Implement column-count layout for Window Groups

## Status

Accepted

## Context

The Window Groups were initially displayed in a single column, leading to a long vertical scroll when many groups were present. We needed a way to display the Window Groups in multiple columns to better utilize screen space and improve user experience.

We initially attempted to use Flexbox and Grid layouts, but these proved to be more complex than necessary for this specific use case.

## Decision

We decided to use the `column-count` CSS property to create a multi-column layout for the Window Groups. This approach provides a simple and effective way to divide the Window Groups into multiple columns without requiring complex Flexbox or Grid configurations.

The `columns-2` class was added to the outer div in `src/components/WindowGroupList.tsx`.

## Consequences

### Positive

- Improved screen space utilization for displaying Window Groups.
- Simplified layout implementation compared to Flexbox or Grid.
- Reduced vertical scrolling for users with many Window Groups.

### Negative

- Less flexibility compared to Flexbox or Grid for more complex layout requirements.
- May not be suitable for all screen sizes or resolutions.
