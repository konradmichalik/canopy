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
  class="group w-full text-left px-2 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer relative
    {isActive
    ? 'bg-brand-subtlest shadow-sm ring-1 ring-brand/20 text-text'
    : 'hover:bg-surface-hovered text-text-subtle hover:text-text hover:shadow-sm'}
    {isDragging ? 'opacity-50 scale-95' : ''}
    {isDragOver ? 'ring-2 ring-brand ring-offset-1' : ''}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <!-- Active indicator -->
  {#if isActive}
    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand"></div>
  {/if}

  <div class="flex items-center min-w-0 pl-1">
    <!-- Farbpunkt - immer 20px breit für konsistente Ausrichtung -->
    <div class="w-5 flex-shrink-0 flex items-center justify-center">
      <span class="w-2.5 h-2.5 rounded-full {colorClass || 'bg-text-disabled/30'}"></span>
    </div>
    <!-- Text -->
    <span class="truncate text-sm font-medium">{query.title}</span>
  </div>

  <!-- Aktionen - immer sichtbar bei hover -->
  <div
    class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
  >
    <div
      draggable="true"
      ondragstart={handleDragStart}
      ondragend={onDragEnd}
      class="p-1.5 cursor-grab active:cursor-grabbing text-text-disabled hover:text-text-subtle rounded-md hover:bg-neutral transition-colors"
      title="Drag to reorder"
      role="button"
      tabindex="-1"
      onclick={(e: MouseEvent) => e.stopPropagation()}
      onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
    >
      <AtlaskitIcon name="drag-handle" size={14} />
    </div>
    <button
      type="button"
      onclick={handleEdit}
      class="p-1.5 rounded-md hover:bg-neutral text-text-subtle hover:text-text transition-colors"
      title="Edit query"
    >
      <AtlaskitIcon name="edit" size={14} />
    </button>
    <button
      type="button"
      onclick={handleDelete}
      class="p-1.5 rounded-md hover:bg-danger-subtlest text-text-subtle hover:text-text-danger transition-colors"
      title="Delete query"
    >
      <AtlaskitIcon name="delete" size={14} />
    </button>
  </div>
</div>
