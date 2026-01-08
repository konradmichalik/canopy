<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import ConfirmDeleteModal from '../common/ConfirmDeleteModal.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
    onDuplicate: (query: SavedQuery) => void;
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
    onDuplicate,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  }: Props = $props();

  let showDeleteModal = $state(false);

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
    showDeleteModal = true;
  }

  function confirmDelete(): void {
    onDelete(query);
  }

  function handleEdit(e: Event): void {
    e.stopPropagation();
    onEdit(query);
  }

  function handleExport(e: Event): void {
    e.stopPropagation();
    downloadSingleQuery(query);
  }

  function handleDuplicate(e: Event): void {
    e.stopPropagation();
    onDuplicate(query);
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

  // Dropdown state
  let dropdownOpen = $state(false);
</script>

<div
  role="button"
  tabindex="0"
  class="group w-full text-left py-2 pr-2 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer relative overflow-hidden
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
  <!-- Color bar on left edge -->
  <div
    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all {colorClass ||
      'bg-muted-foreground/30'}"
    class:opacity-100={isActive}
    class:opacity-70={!isActive}
  ></div>

  <div class="flex items-center min-w-0 pl-3 gap-2">
    <!-- Text -->
    <span class="truncate text-sm font-medium">{query.title}</span>
    {#if query.cachedIssueCount !== undefined}
      <span
        class="inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded bg-muted text-muted-foreground flex-shrink-0"
      >
        {query.cachedIssueCount}
      </span>
    {/if}
  </div>

  <!-- Actions - visible on hover -->
  <div
    class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
    class:opacity-100={dropdownOpen}
  >
    <!-- Drag Handle -->
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

    <!-- Actions Dropdown -->
    <DropdownMenu.Root bind:open={dropdownOpen}>
      <DropdownMenu.Trigger
        class="p-1 cursor-pointer text-muted-foreground hover:text-foreground rounded hover:bg-accent"
        onclick={(e: MouseEvent) => e.stopPropagation()}
      >
        <AtlaskitIcon name="more" size={14} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" class="w-36">
        <DropdownMenu.Item onclick={handleEdit}>
          <AtlaskitIcon name="edit" size={14} class="mr-2" />
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleExport}>
          <AtlaskitIcon name="download" size={14} class="mr-2" />
          Export
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleDuplicate}>
          <AtlaskitIcon name="copy" size={14} class="mr-2" />
          Duplicate
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleDelete} class="text-destructive focus:text-destructive">
          <AtlaskitIcon name="delete" size={14} class="mr-2" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>

<ConfirmDeleteModal bind:open={showDeleteModal} itemName={query.title} onConfirm={confirmDelete} />
