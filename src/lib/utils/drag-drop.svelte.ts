/**
 * Reusable drag-and-drop state and handlers for list reordering
 * Uses Svelte 5 runes for reactive state management
 */

export function createDragDrop(onReorder: (fromIndex: number, toIndex: number) => void) {
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  return {
    get draggedIndex() {
      return draggedIndex;
    },
    get dragOverIndex() {
      return dragOverIndex;
    },

    isDragging(index: number): boolean {
      return draggedIndex === index;
    },

    isDragOver(index: number): boolean {
      return dragOverIndex === index && draggedIndex !== index;
    },

    handleDragStart(index: number): void {
      draggedIndex = index;
    },

    handleDragOver(e: DragEvent, index: number): void {
      e.preventDefault();
      dragOverIndex = index;
    },

    handleDrop(index: number): void {
      if (draggedIndex !== null && draggedIndex !== index) {
        onReorder(draggedIndex, index);
      }
      draggedIndex = null;
      dragOverIndex = null;
    },

    handleDragEnd(): void {
      draggedIndex = null;
      dragOverIndex = null;
    }
  };
}
