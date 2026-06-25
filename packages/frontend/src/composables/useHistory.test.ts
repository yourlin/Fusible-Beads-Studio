import { describe, it, expect, vi } from 'vitest';
import { useHistory, type HistoryEntry } from './useHistory';

type Change = { id: number; value: string };

function entry(redo: Change[], undo: Change[]): HistoryEntry<Change> {
  return { redo, undo };
}

describe('useHistory', () => {
  it('starts empty', () => {
    const h = useHistory<Change>(() => {});
    expect(h.canUndo.value).toBe(false);
    expect(h.canRedo.value).toBe(false);
  });

  it('records and undoes/redoes applying the right changes', () => {
    const apply = vi.fn();
    const h = useHistory<Change>(apply);
    h.record(entry([{ id: 1, value: 'a' }], [{ id: 1, value: 'old' }]));
    expect(h.canUndo.value).toBe(true);
    expect(h.canRedo.value).toBe(false);

    h.undo();
    expect(apply).toHaveBeenLastCalledWith([{ id: 1, value: 'old' }]);
    expect(h.canUndo.value).toBe(false);
    expect(h.canRedo.value).toBe(true);

    h.redo();
    expect(apply).toHaveBeenLastCalledWith([{ id: 1, value: 'a' }]);
    expect(h.canRedo.value).toBe(false);
  });

  it('truncates the redo branch when recording after an undo', () => {
    const h = useHistory<Change>(() => {});
    h.record(entry([{ id: 1, value: 'a' }], [{ id: 1, value: 'x' }]));
    h.record(entry([{ id: 2, value: 'b' }], [{ id: 2, value: 'y' }]));
    h.undo();
    expect(h.canRedo.value).toBe(true);
    h.record(entry([{ id: 3, value: 'c' }], [{ id: 3, value: 'z' }]));
    expect(h.canRedo.value).toBe(false);
    expect(h.depth.value).toBe(2);
  });

  it('caps depth at the configured limit', () => {
    const h = useHistory<Change>(() => {}, 3);
    for (let i = 0; i < 5; i++) {
      h.record(entry([{ id: i, value: 'r' }], [{ id: i, value: 'u' }]));
    }
    expect(h.depth.value).toBe(3);
  });

  it('clear resets the stack', () => {
    const h = useHistory<Change>(() => {});
    h.record(entry([{ id: 1, value: 'a' }], [{ id: 1, value: 'x' }]));
    h.clear();
    expect(h.canUndo.value).toBe(false);
    expect(h.depth.value).toBe(0);
  });
});
