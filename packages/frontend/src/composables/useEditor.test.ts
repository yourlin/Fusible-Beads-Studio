import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDesignStore } from '@/stores/design';
import { useEditor } from './useEditor';

function seed() {
  const store = useDesignStore();
  store.commitConversion({
    grid: [
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
    ],
    counts: [],
  });
  return store;
}

describe('useEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('brush paints a single cell and undo/redo works', () => {
    const store = seed();
    const editor = useEditor();
    editor.selectColor(2);
    editor.setTool('brush');

    editor.onCellDown({ row: 0, col: 0 });
    editor.endStroke();
    expect(store.cellAt(0, 0)).toBe(2);
    expect(editor.canUndo.value).toBe(true);

    editor.undo();
    expect(store.cellAt(0, 0)).toBe(0);
    editor.redo();
    expect(store.cellAt(0, 0)).toBe(2);
  });

  it('brush drag across cells records one history entry', () => {
    const store = seed();
    const editor = useEditor();
    editor.selectColor(2);
    editor.setTool('brush');

    editor.onCellDown({ row: 0, col: 0 });
    editor.onCellDrag({ row: 0, col: 1 });
    editor.onCellDrag({ row: 0, col: 2 });
    editor.endStroke();

    expect(store.cellAt(0, 0)).toBe(2);
    expect(store.cellAt(0, 2)).toBe(2);

    // single undo reverts the whole stroke
    editor.undo();
    expect(store.cellAt(0, 0)).toBe(0);
    expect(store.cellAt(0, 2)).toBe(0);
    expect(editor.canUndo.value).toBe(false);
  });

  it('bucket fills a connected region in one action', () => {
    const store = seed();
    const editor = useEditor();
    editor.selectColor(2);
    editor.setTool('bucket');

    editor.onCellDown({ row: 0, col: 0 }); // bucket auto-ends
    // the top 0-region is 6 cells
    expect(store.cellAt(0, 0)).toBe(2);
    expect(store.cellAt(1, 2)).toBe(2);
    expect(store.cellAt(2, 0)).toBe(1); // unchanged

    editor.undo();
    expect(store.cellAt(0, 0)).toBe(0);
  });

  it('brush size 3 paints a 3×3 area centered on the cursor (clipped to grid)', () => {
    const store = seed();
    const editor = useEditor();
    editor.selectColor(2);
    editor.setTool('brush');
    editor.setBrushSize(3);

    // 中心 (1,1)：3×3 覆盖整个上方 0 区域 + (2,*) 行
    editor.onCellDown({ row: 1, col: 1 });
    editor.endStroke();
    expect(store.cellAt(0, 0)).toBe(2);
    expect(store.cellAt(1, 1)).toBe(2);
    expect(store.cellAt(2, 2)).toBe(2);

    // 单次撤销回退整个笔刷
    editor.undo();
    expect(store.cellAt(0, 0)).toBe(0);
    expect(store.cellAt(2, 2)).toBe(1);
    expect(editor.canUndo.value).toBe(false);
  });

  it('brush size clips at grid corner (no out-of-bounds)', () => {
    const store = seed();
    const editor = useEditor();
    editor.selectColor(2);
    editor.setTool('brush');
    editor.setBrushSize(3);

    // 角落 (0,0)：3×3 仅覆盖网格内的 (0,0)(0,1)(1,0)(1,1)
    editor.onCellDown({ row: 0, col: 0 });
    editor.endStroke();
    expect(store.cellAt(0, 0)).toBe(2);
    expect(store.cellAt(0, 1)).toBe(2);
    expect(store.cellAt(1, 1)).toBe(2);
    expect(store.cellAt(0, 2)).toBe(0); // 超出半径，未改
  });

  it('eyedropper selects the color under the cursor without editing', () => {
    seed();
    const editor = useEditor();
    editor.setTool('eyedropper');
    editor.onCellDown({ row: 2, col: 0 }); // value 1
    expect(editor.selectedIndex.value).toBe(1);
    expect(editor.canUndo.value).toBe(false);
  });

  it('eraser restores the original grid value', () => {
    const store = seed();
    const editor = useEditor();
    // paint over (2,0) which was originally 1
    editor.selectColor(0);
    editor.setTool('brush');
    editor.onCellDown({ row: 2, col: 0 });
    editor.endStroke();
    expect(store.cellAt(2, 0)).toBe(0);

    editor.setTool('eraser');
    editor.onCellDown({ row: 2, col: 0 });
    editor.endStroke();
    expect(store.cellAt(2, 0)).toBe(1); // restored to original
  });
});
