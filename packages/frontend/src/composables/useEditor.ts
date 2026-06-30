import { ref } from 'vue';
import { useDesignStore, type CellChange } from '@/stores/design';
import { useHistory } from '@/composables/useHistory';
import { floodFill } from '@/utils/floodFill';

export type Tool = 'brush' | 'eraser' | 'bucket' | 'eyedropper' | 'pan';

export interface CellPos {
  col: number;
  row: number;
}

/**
 * 编辑器 composable：管理当前工具、选中色，并把笔画提交到撤销栈。
 * 一次完整笔画（按下→拖拽→抬起）合并为单条历史记录。
 */
export function useEditor() {
  const store = useDesignStore();
  const tool = ref<Tool>('pan');
  const selectedIndex = ref(0);

  const history = useHistory<CellChange>((changes) => {
    store.applyCellChanges(changes);
  }, 50);

  // 当前笔画累积：保留每格最早的 before 与最新的 after
  let undoMap = new Map<string, CellChange>();
  let redoMap = new Map<string, CellChange>();
  let stroking = false;

  function key(row: number, col: number): string {
    return `${row},${col}`;
  }

  function paint(changes: CellChange[]) {
    const inverse = store.applyCellChanges(changes);
    for (const inv of inverse) {
      const k = key(inv.row, inv.col);
      if (!undoMap.has(k)) undoMap.set(k, inv);
      redoMap.set(k, { row: inv.row, col: inv.col, index: store.cellAt(inv.row, inv.col) });
    }
  }

  function applyToolAt(pos: CellPos) {
    if (!store.grid) return;
    const { row, col } = pos;
    switch (tool.value) {
      case 'brush':
        paint([{ row, col, index: selectedIndex.value }]);
        break;
      case 'eraser': {
        const orig = store.originalGrid?.[row]?.[col] ?? -1;
        paint([{ row, col, index: orig }]);
        break;
      }
      case 'bucket': {
        const changed = floodFill(store.grid, row, col, selectedIndex.value);
        paint(changed.map((c) => ({ row: c.row, col: c.col, index: selectedIndex.value })));
        break;
      }
      case 'eyedropper': {
        const idx = store.cellAt(row, col);
        if (idx >= 0) selectedIndex.value = idx;
        break;
      }
      case 'pan':
        // 平移工具不修改网格（由画布处理平移）
        break;
    }
  }

  /** 指针按下：开始一次笔画并立即作用于该格。 */
  function onCellDown(pos: CellPos) {
    beginStroke();
    applyToolAt(pos);
    // 单击型工具（油漆桶/取色器）按下即可结束
    if (tool.value === 'bucket' || tool.value === 'eyedropper') {
      endStroke();
    }
  }

  /** 拖拽经过新格：仅画笔/橡皮持续作用。 */
  function onCellDrag(pos: CellPos) {
    if (!stroking) return;
    if (tool.value === 'brush' || tool.value === 'eraser') {
      applyToolAt(pos);
    }
  }

  function beginStroke() {
    stroking = true;
    undoMap = new Map();
    redoMap = new Map();
  }

  /** 指针抬起：把累积的变更记录为一条历史。 */
  function endStroke() {
    if (!stroking) return;
    stroking = false;
    if (redoMap.size > 0) {
      history.record({ redo: [...redoMap.values()], undo: [...undoMap.values()] });
    }
    undoMap = new Map();
    redoMap = new Map();
  }

  /**
   * 以一张新网格整体替换当前网格，并记为**单条**撤销历史（架构 AD-9）。
   * 用于库存模式的「以库存色板重匹配」(FR-5) 与「应用感知替代」(FR-8)——
   * 二者都是整图级写回，但不得裸调 commitConversion（会丢历史且重置 originalGrid）。
   * 通过 diff → applyCellChanges 实现，保持三不变量与可整体回退。
   */
  function applyFullGrid(nextGrid: number[][]) {
    const grid = store.grid;
    if (!grid) return;
    const changes: CellChange[] = [];
    for (let row = 0; row < nextGrid.length; row++) {
      const nr = nextGrid[row];
      const cr = grid[row];
      if (!nr || !cr) continue;
      for (let col = 0; col < nr.length; col++) {
        if (nr[col] !== cr[col]) changes.push({ row, col, index: nr[col] });
      }
    }
    if (changes.length === 0) return;
    // 已逐格 diff，故每条变更都会真正应用，inverse 与 changes 一一对应。
    const inverse = store.applyCellChanges(changes);
    history.record({ redo: changes, undo: inverse });
  }

  function setTool(t: Tool) {
    tool.value = t;
  }

  function selectColor(index: number) {
    selectedIndex.value = index;
  }

  return {
    tool,
    selectedIndex,
    setTool,
    selectColor,
    onCellDown,
    onCellDrag,
    endStroke,
    applyFullGrid,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    clearHistory: history.clear,
  };
}
