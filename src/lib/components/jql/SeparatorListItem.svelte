<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import type { QuerySeparator } from '../../types';

  interface Props {
    separator: QuerySeparator;
    index: number;
    isDragging: boolean;
    isDragOver: boolean;
    onEdit: (separator: QuerySeparator) => void;
    onDelete: (separator: QuerySeparator) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: DragEvent, index: number) => void;
    onDrop: (index: number) => void;
    onDragEnd: () => void;
  }

  let {
    separator,
    index,
    isDragging,
    isDragOver,
    onEdit,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  }: Props = $props();

  let dropdownOpen = $state(false);
  let isEditing = $state(false);
  let editValue = $state('');
  let inputElement = $state<HTMLInputElement | null>(null);

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
    onDelete(separator);
  }

  function startEdit(): void {
    editValue = separator.title || '';
    isEditing = true;
    // Focus input after DOM update
    requestAnimationFrame(() => {
      inputElement?.focus();
      inputElement?.select();
    });
  }

  function saveEdit(): void {
    const newTitle = editValue.trim() || undefined;
    if (newTitle !== separator.title) {
      onEdit({ ...separator, title: newTitle });
    }
    isEditing = false;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isEditing = false;
    }
  }
</script>

<div
  role="listitem"
  class="group relative py-2 px-2
    {isDragging ? 'opacity-50 scale-95' : ''}
    {isDragOver ? 'ring-2 ring-primary ring-offset-1' : ''}"
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  {#if isEditing}
    <!-- Inline Edit Mode -->
    <div class="flex items-center gap-2">
      <input
        bind:this={inputElement}
        type="text"
        bind:value={editValue}
        onkeydown={handleKeydown}
        onblur={saveEdit}
        placeholder="Section title (optional)"
        class="flex-1 text-xs px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  {:else}
    <!-- Display Mode -->
    <div class="flex items-center gap-2">
      {#if separator.title}
        <!-- Labeled Separator -->
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <span
            class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
          >
            {separator.title}
          </span>
          <div class="flex-1 h-px bg-border"></div>
        </div>
      {:else}
        <!-- Line Separator -->
        <div class="flex-1 h-px bg-border"></div>
      {/if}

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
            <DropdownMenu.Item onclick={startEdit}>
              <AtlaskitIcon name="edit" size={14} class="mr-2" />
              Edit
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onclick={handleDelete}
              class="text-destructive focus:text-destructive"
            >
              <AtlaskitIcon name="delete" size={14} class="mr-2" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  {/if}
</div>
