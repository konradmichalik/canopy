<script lang="ts">
  import { Pencil, Trash2 } from 'lucide-svelte';
  import type { SavedQuery } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';

  interface Props {
    query: SavedQuery;
    isActive: boolean;
    onSelect: (query: SavedQuery) => void;
    onEdit: (query: SavedQuery) => void;
    onDelete: (query: SavedQuery) => void;
  }

  let { query, isActive, onSelect, onEdit, onDelete }: Props = $props();

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
  class="group w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer
    {isActive
    ? 'bg-brand-subtlest border-l-2 border-brand text-text'
    : 'hover:bg-surface-hovered text-text-subtle hover:text-text'}"
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <div class="flex items-center gap-2 min-w-0">
    {#if colorClass}
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 {colorClass}"></span>
    {/if}
    <span class="truncate text-sm font-medium">{query.title}</span>
  </div>

  <div
    class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
  >
    <button
      type="button"
      onclick={handleEdit}
      class="p-1 rounded hover:bg-surface-hovered text-text-subtle hover:text-text"
      title="Edit query"
    >
      <Pencil class="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onclick={handleDelete}
      class="p-1 rounded hover:bg-danger-subtlest text-text-subtle hover:text-text-danger"
      title="Delete query"
    >
      <Trash2 class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
