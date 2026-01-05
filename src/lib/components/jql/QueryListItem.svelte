<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { SavedQuery } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';

  interface Props {
    query: SavedQuery;
    isActive: boolean;
    index: number;
    isDragging: boolean;
    isDragOver: boolean;
    onSelect: (query: SavedQuery) => void;
    onEdit: (query: SavedQuery) => void;
    onDelete: (query: SavedQuery) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: DragEvent, index: number) => void;
    onDrop: (index: number) => void;
    onDragEnd: () => void;
  }

  let {
    query,
    isActive,
    index,
    isDragging,
    isDragOver,
    onSelect,
    onEdit,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  }: Props = $props();

  function handleDragStart(e: DragEvent): void {
    e.dataTransfer?.setData('text/plain', index.toString());
    onDragStart(index);
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    onDragOver(e, index);
  }

  function handleDrop(e: DragEvent): void {
    e.preventDefault();
    onDrop(index);
  }

  function handleDelete(e: Event): void {
    e.stopPropagation();
    if (confirm(`Delete query "${query.title}"?`)) {
      onDelete(query);
    }
  }

  function handleEdit(e: Event): void {
    e.stopPropagation();
    onEdit(query);
  }

  function handleClick(): void {
    onSelect(query);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(query);
    }
  }

  const colorClass = $derived(
    query.color ? QUERY_COLORS.find((c) => c.id === query.color)?.bg : null
  );
</script>

<div
  role="button"
  tabindex="0"
  class="group w-full text-left px-1 py-2 transition-colors flex items-center justify-between gap-1 cursor-pointer
    {isActive
    ? 'bg-brand-subtlest border-l-2 border-brand text-text'
    : 'hover:bg-surface-hovered text-text-subtle hover:text-text'}
    {isDragging ? 'opacity-50' : ''}
    {isDragOver ? 'border-t-2 border-brand' : ''}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <div class="flex items-center gap-1 min-w-0">
    <div
      draggable="true"
      ondragstart={handleDragStart}
      ondragend={onDragEnd}
      class="p-1 cursor-grab active:cursor-grabbing text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      title="Drag to reorder"
      role="button"
      tabindex="-1"
      onclick={(e: MouseEvent) => e.stopPropagation()}
      onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
    >
      <AtlaskitIcon name="drag-handle" size={12} />
    </div>
    {#if colorClass}
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 {colorClass}"></span>
    {/if}
    <span class="truncate text-sm font-medium">{query.title}</span>
  </div>

  <div
    class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pr-2"
  >
    <button
      type="button"
      onclick={handleEdit}
      class="p-1 rounded hover:bg-surface-hovered text-text-subtle hover:text-text"
      title="Edit query"
    >
      <AtlaskitIcon name="edit" size={14} />
    </button>
    <button
      type="button"
      onclick={handleDelete}
      class="p-1 rounded hover:bg-danger-subtlest text-text-subtle hover:text-text-danger"
      title="Delete query"
    >
      <AtlaskitIcon name="delete" size={14} />
    </button>
  </div>
</div>
