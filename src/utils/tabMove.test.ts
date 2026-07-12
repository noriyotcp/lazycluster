import { describe, it, expect } from 'vitest';
import { buildMoveSegments, type MoveSegment } from './tabMove';

// Helper to create a minimal chrome.tabs.Tab. `groupId` accepts undefined so we
// can exercise the `gid !== undefined` guard.
function makeTab(id: number, groupId: number | undefined, index = 0): chrome.tabs.Tab {
  return {
    id,
    // Cast keeps the shape faithful while permitting `undefined` for testing.
    groupId: groupId as number,
    index,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    frozen: false,
  };
}

function makeTabMap(tabs: chrome.tabs.Tab[]): Map<number, chrome.tabs.Tab> {
  return new Map(tabs.map(t => [t.id!, t]));
}

describe('buildMoveSegments', () => {
  it('returns an empty array for an empty selection', () => {
    const result = buildMoveSegments([], makeTabMap([]), new Set());
    expect(result).toEqual([]);
  });

  it('produces a single ungrouped segment for one ungrouped tab', () => {
    const tabs = [makeTab(1, -1)];
    const result = buildMoveSegments([1], makeTabMap(tabs), new Set());
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1] }]);
  });

  it('produces a single group segment for one preserved-group tab', () => {
    const tabs = [makeTab(1, 100)];
    const result = buildMoveSegments([1], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([{ type: 'group', groupId: 100, tabIds: [1] }]);
  });

  it('treats a grouped tab whose group is NOT in preservedGroupIds as ungrouped', () => {
    const tabs = [makeTab(1, 100)];
    const result = buildMoveSegments([1], makeTabMap(tabs), new Set());
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1] }]);
  });

  it('merges consecutive tabs belonging to the SAME preserved group', () => {
    const tabs = [makeTab(1, 100), makeTab(2, 100), makeTab(3, 100)];
    const result = buildMoveSegments([1, 2, 3], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([{ type: 'group', groupId: 100, tabIds: [1, 2, 3] }]);
  });

  it('merges consecutive ungrouped tabs into one ungrouped segment', () => {
    const tabs = [makeTab(1, -1), makeTab(2, -1), makeTab(3, -1)];
    const result = buildMoveSegments([1, 2, 3], makeTabMap(tabs), new Set());
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1, 2, 3] }]);
  });

  it('opens a new segment when transitioning from a preserved group to ungrouped', () => {
    const tabs = [makeTab(1, 100), makeTab(2, 100), makeTab(3, -1), makeTab(4, -1)];
    const result = buildMoveSegments([1, 2, 3, 4], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'group', groupId: 100, tabIds: [1, 2] },
      { type: 'ungrouped', tabIds: [3, 4] },
    ]);
  });

  it('opens a new segment when transitioning from ungrouped to a preserved group', () => {
    const tabs = [makeTab(1, -1), makeTab(2, -1), makeTab(3, 100), makeTab(4, 100)];
    const result = buildMoveSegments([1, 2, 3, 4], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'ungrouped', tabIds: [1, 2] },
      { type: 'group', groupId: 100, tabIds: [3, 4] },
    ]);
  });

  it('opens a new group segment when adjacent tabs belong to DIFFERENT preserved groups', () => {
    const tabs = [makeTab(1, 100), makeTab(2, 200)];
    const result = buildMoveSegments([1, 2], makeTabMap(tabs), new Set([100, 200]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'group', groupId: 100, tabIds: [1] },
      { type: 'group', groupId: 200, tabIds: [2] },
    ]);
  });

  it('handles a mixed run: group A, ungrouped, group B → three segments', () => {
    const tabs = [makeTab(1, 100), makeTab(2, -1), makeTab(3, 200)];
    const result = buildMoveSegments([1, 2, 3], makeTabMap(tabs), new Set([100, 200]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'group', groupId: 100, tabIds: [1] },
      { type: 'ungrouped', tabIds: [2] },
      { type: 'group', groupId: 200, tabIds: [3] },
    ]);
  });

  it('does not coalesce non-adjacent tabs of the same group across a gap of another kind', () => {
    // Interleaved: A, B, A — never merged back into a single group segment.
    const tabs = [makeTab(1, 100), makeTab(2, 200), makeTab(3, 100)];
    const result = buildMoveSegments([1, 2, 3], makeTabMap(tabs), new Set([100, 200]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'group', groupId: 100, tabIds: [1] },
      { type: 'group', groupId: 200, tabIds: [2] },
      { type: 'group', groupId: 100, tabIds: [3] },
    ]);
  });

  it('silently skips tab IDs missing from tabMap', () => {
    // Tab id 2 is not in the map: it should be dropped rather than crashing.
    const tabs = [makeTab(1, -1), makeTab(3, -1)];
    const result = buildMoveSegments([1, 2, 3], makeTabMap(tabs), new Set());
    // Since the skipped tab keeps the currentSeg open, 1 and 3 stay merged.
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1, 3] }]);
  });

  it('treats groupId === undefined as ungrouped', () => {
    const tabs = [makeTab(1, undefined)];
    const result = buildMoveSegments([1], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1] }]);
  });

  it('treats groupId === -1 as ungrouped even when preservedGroupIds contains -1', () => {
    // Guard `gid !== -1` short-circuits before the Set lookup.
    const tabs = [makeTab(1, -1)];
    const result = buildMoveSegments([1], makeTabMap(tabs), new Set([-1]));
    expect(result).toEqual<MoveSegment[]>([{ type: 'ungrouped', tabIds: [1] }]);
  });

  it('preserves the input order of tabIds (does not sort)', () => {
    // Input order 3, 1, 2 is preserved verbatim across the resulting segments.
    const tabs = [makeTab(1, 100), makeTab(2, -1), makeTab(3, 100)];
    const result = buildMoveSegments([3, 1, 2], makeTabMap(tabs), new Set([100]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'group', groupId: 100, tabIds: [3, 1] },
      { type: 'ungrouped', tabIds: [2] },
    ]);
  });

  it('handles a large selection: two groups sandwiched around ungrouped runs', () => {
    const tabs = [
      makeTab(1, -1),
      makeTab(2, 100),
      makeTab(3, 100),
      makeTab(4, -1),
      makeTab(5, -1),
      makeTab(6, 200),
      makeTab(7, 200),
      makeTab(8, -1),
    ];
    const result = buildMoveSegments([1, 2, 3, 4, 5, 6, 7, 8], makeTabMap(tabs), new Set([100, 200]));
    expect(result).toEqual<MoveSegment[]>([
      { type: 'ungrouped', tabIds: [1] },
      { type: 'group', groupId: 100, tabIds: [2, 3] },
      { type: 'ungrouped', tabIds: [4, 5] },
      { type: 'group', groupId: 200, tabIds: [6, 7] },
      { type: 'ungrouped', tabIds: [8] },
    ]);
  });
});
