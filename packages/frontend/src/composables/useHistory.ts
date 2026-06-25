import { computed, ref, shallowRef } from 'vue';

/** 一条可撤销/重做的命令：正向与反向的格变更集合。 */
export interface HistoryEntry<T> {
  /** 重做时应用的变更 */
  redo: T[];
  /** 撤销时应用的变更 */
  undo: T[];
}

/**
 * 命令栈，支持撤销/重做，限制最大深度（默认 50）。
 * 通过注入的 apply 回调把变更施加到外部状态（如 store）。
 */
export function useHistory<T>(apply: (changes: T[]) => void, limit = 50) {
  const entries = shallowRef<HistoryEntry<T>[]>([]);
  // 指向「下一次 undo 将处理」的条目索引；-1 表示无可撤销。
  const pointer = ref(-1);

  const canUndo = computed(() => pointer.value >= 0);
  const canRedo = computed(() => pointer.value < entries.value.length - 1);

  /** 记录一次已经发生的操作（不会自动 apply，调用方负责先行 apply）。 */
  function record(entry: HistoryEntry<T>) {
    // 丢弃当前指针之后的重做分支
    const next =
      pointer.value < entries.value.length - 1
        ? entries.value.slice(0, pointer.value + 1)
        : entries.value.slice();
    next.push(entry);
    // 限制深度：超出则丢弃最旧的
    if (next.length > limit) next.shift();
    entries.value = next;
    pointer.value = next.length - 1;
  }

  function undo(): boolean {
    if (!canUndo.value) return false;
    const entry = entries.value[pointer.value];
    apply(entry.undo);
    pointer.value -= 1;
    return true;
  }

  function redo(): boolean {
    if (!canRedo.value) return false;
    const entry = entries.value[pointer.value + 1];
    apply(entry.redo);
    pointer.value += 1;
    return true;
  }

  function clear() {
    entries.value = [];
    pointer.value = -1;
  }

  return {
    canUndo,
    canRedo,
    record,
    undo,
    redo,
    clear,
    depth: computed(() => entries.value.length),
  };
}
