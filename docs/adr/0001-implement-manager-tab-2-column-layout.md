# Architecture Decision Record (ADR) Template

## Title

Implement 2-Column Layout for Manager Tab

## Status

Accepted

## Context

The manager tab in LazyCluster displays a list of open and saved windows. On wider screens, the single-column layout doesn't efficiently utilize the available space. We want to improve the user experience by displaying more window groups at once, making it easier to manage tabs.

## Decision

Implement a responsive 2-column layout for the WindowGroupList component in the manager tab. This layout will be activated when the browser window is wider than a certain breakpoint (md:). We will use Tailwind CSS grid layout to achieve this.

## Consequences

Positive:

- Improved user experience on wider screens by displaying more window groups at once.
- Better utilization of screen real estate.
- Responsive design adapts to different screen sizes.

Negative:

- Increased complexity in the App.tsx component.
- Potential for layout issues if the content within window groups varies significantly in height.
