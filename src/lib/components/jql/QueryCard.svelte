<script lang="ts">
  import { Play, Pencil, Trash2 } from 'lucide-svelte';
  import type { SavedQuery } from '../../types';
  import { truncateJql } from '../../utils/jql-helpers';

  interface Props {
    query: SavedQuery;
    onOpen: (query: SavedQuery) => void;
    onEdit: (query: SavedQuery) => void;
    onDelete: (query: SavedQuery) => void;
  }

  let { query, onOpen, onEdit, onDelete }: Props = $props();

  function handleDelete(e: Event): void {
    e.stopPropagation();
    if (confirm(`Delete query "${query.title}"?`)) {
      onDelete(query);
    }
  }
</script>

<div
  class="group bg-surface-raised border border-border rounded-lg p-4 hover:border-border-brand transition-colors cursor-pointer"
  onclick={() => onOpen(query)}
  onkeydown={(e) => e.key === 'Enter' && onOpen(query)}
  role="button"
  tabindex="0"
>
  <div class="flex items-start justify-between gap-2 mb-2">
    <h3 class="font-medium text-text truncate">
      {query.title}
    </h3>
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onclick={(e) => {
          e.stopPropagation();
          onEdit(query);
        }}
        class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle hover:text-text"
        title="Edit query"
      >
        <Pencil class="w-4 h-4" />
      </button>
      <button
        onclick={handleDelete}
        class="p-1.5 rounded hover:bg-danger-subtlest text-text-subtle hover:text-text-danger"
        title="Delete query"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>

  <p class="text-sm text-text-subtle font-mono break-all">
    {truncateJql(query.jql, 80)}
  </p>

  <div class="mt-3 flex items-center justify-between">
    <span class="text-xs text-text-subtle">
      Updated {new Date(query.updatedAt).toLocaleDateString()}
    </span>
    <button
      onclick={(e) => {
        e.stopPropagation();
        onOpen(query);
      }}
      class="flex items-center gap-1 px-3 py-1 text-sm font-medium text-text-brand hover:bg-brand-subtlest rounded transition-colors"
    >
      <Play class="w-4 h-4" />
      Open
    </button>
  </div>
</div>
