<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { SavedQuery } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import { downloadSingleQuery } from '../../utils/storage';

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

  function handleExport(e: Event): void {
    e.stopPropagation();
    downloadSingleQuery(query);
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
  class="group w-full text-left px-2 py-2 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer relative
    {isActive
    ? 'bg-accent text-accent-foreground'
    : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'}
    {isDragging ? 'opacity-50 scale-95' : ''}
    {isDragOver ? 'ring-2 ring-primary ring-offset-1' : ''}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <!-- Active indicator -->
  {#if isActive}
    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary"></div>
  {/if}

  <div class="flex items-center min-w-0 pl-1 gap-2">
    <!-- Color dot -->
    <span class="w-2 h-2 rounded-full flex-shrink-0 {colorClass || 'bg-muted-foreground/30'}"></span>
    <!-- Text -->
    <span class="truncate text-sm font-medium">{query.title}</span>
  </div>

  <!-- Actions - visible on hover -->
  <div
    class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
  >
    <Tooltip text="Drag to reorder">
      <div
        draggable="true"
        ondragstart={handleDragStart}
        ondragend={onDragEnd}
        class="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground rounded hover:bg-accent"
        role="button"
        tabindex="-1"
        onclick={(e: MouseEvent) => e.stopPropagation()}
        onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
      >
        <AtlaskitIcon name="drag-handle" size={14} />
      </div>
    </Tooltip>
    <Tooltip text="Edit query">
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        onclick={handleEdit}
      >
        <AtlaskitIcon name="edit" size={14} />
      </Button>
    </Tooltip>
    <Tooltip text="Export query">
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        onclick={handleExport}
      >
        <AtlaskitIcon name="download" size={14} />
      </Button>
    </Tooltip>
    <Tooltip text="Delete query">
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
        onclick={handleDelete}
      >
        <AtlaskitIcon name="delete" size={14} />
      </Button>
    </Tooltip>
  </div>
</div>
