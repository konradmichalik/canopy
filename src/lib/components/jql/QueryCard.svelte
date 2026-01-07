<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import type { SavedQuery } from '../../types';
  import { truncateJql } from '../../utils/jql-helpers';
  import { downloadSingleQuery } from '../../utils/storage';

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

  function handleExport(e: Event): void {
    e.stopPropagation();
    downloadSingleQuery(query);
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
      <Tooltip text="Edit query">
        <button
          onclick={(e) => {
            e.stopPropagation();
            onEdit(query);
          }}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle hover:text-text"
        >
          <AtlaskitIcon name="edit" size={16} />
        </button>
      </Tooltip>
      <Tooltip text="Export query">
        <button
          onclick={handleExport}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle hover:text-text"
        >
          <AtlaskitIcon name="download" size={16} />
        </button>
      </Tooltip>
      <Tooltip text="Delete query">
        <button
          onclick={handleDelete}
          class="p-1.5 rounded hover:bg-danger-subtlest text-text-subtle hover:text-text-danger"
        >
          <AtlaskitIcon name="delete" size={16} />
        </button>
      </Tooltip>
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
      <AtlaskitIcon name="video-play" size={16} />
      Open
    </button>
  </div>
</div>
