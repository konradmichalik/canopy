<script lang="ts">
  import { X, Save } from 'lucide-svelte';
  import type { SavedQuery, QueryColor } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import { validateJql } from '../../utils/jql-helpers';

  interface Props {
    query?: SavedQuery | null;
    onSave: (title: string, jql: string, color?: QueryColor) => void;
    onCancel: () => void;
  }

  let { query = null, onSave, onCancel }: Props = $props();

  let title = $state(query?.title || '');
  let jql = $state(query?.jql || '');
  let color = $state<QueryColor | undefined>(query?.color);
  let error = $state<string | null>(null);

  function handleSubmit(e: Event): void {
    e.preventDefault();
    error = null;

    const trimmedTitle = title.trim();
    const trimmedJql = jql.trim();

    if (!trimmedTitle) {
      error = 'Title is required';
      return;
    }

    const validation = validateJql(trimmedJql);
    if (!validation.isValid) {
      error = validation.error || 'Invalid JQL';
      return;
    }

    onSave(trimmedTitle, trimmedJql, color);
  }

  function selectColor(c: QueryColor): void {
    color = color === c ? undefined : c;
  }

  const isEdit = $derived(!!query);
</script>

<!-- Modal Backdrop -->
<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  onclick={onCancel}
  onkeydown={(e) => e.key === 'Escape' && onCancel()}
  role="dialog"
  aria-modal="true"
>
  <!-- Modal Content -->
  <div
    class="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="document"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h2 class="text-lg font-semibold text-text">
        {isEdit ? 'Edit Query' : 'New Query'}
      </h2>
      <button onclick={onCancel} class="p-1 rounded hover:bg-surface-hovered text-text-subtle">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="p-4 space-y-4">
      <div>
        <label for="queryTitle" class="block text-sm font-medium text-text mb-1"> Title </label>
        <input
          id="queryTitle"
          type="text"
          bind:value={title}
          placeholder="e.g., Sprint 42 Backlog"
          class="w-full px-3 py-2 bg-input border border-border rounded-lg text-text placeholder-text-subtlest focus:outline-none focus:ring-2 focus:ring-border-focused focus:border-transparent"
        />
      </div>

      <div>
        <label for="queryJql" class="block text-sm font-medium text-text mb-1"> JQL Query </label>
        <textarea
          id="queryJql"
          bind:value={jql}
          placeholder="project = MYPROJECT AND sprint in openSprints()"
          rows="4"
          class="w-full px-3 py-2 bg-input border border-border rounded-lg text-text placeholder-text-subtlest focus:outline-none focus:ring-2 focus:ring-border-focused focus:border-transparent font-mono text-sm resize-none"
        ></textarea>
        <p class="mt-1 text-xs text-text-subtle">
          Enter a valid JQL query. The app will automatically build the hierarchy from the results.
        </p>
      </div>

      <!-- Color Selection -->
      <div>
        <label class="block text-sm font-medium text-text mb-2"> Color (optional) </label>
        <div class="flex flex-wrap gap-2">
          {#each QUERY_COLORS as c (c.id)}
            <button
              type="button"
              onclick={() => selectColor(c.id)}
              class="w-8 h-8 rounded-full {c.bg} transition-all
                {color === c.id
                ? 'ring-2 ring-offset-2 ring-offset-surface ring-text scale-110'
                : 'hover:scale-110 opacity-70 hover:opacity-100'}"
              title={c.label}
              aria-label={c.label}
              aria-pressed={color === c.id}
            ></button>
          {/each}
        </div>
      </div>

      {#if error}
        <div class="p-3 bg-danger-subtlest border border-border-danger rounded-lg">
          <p class="text-sm text-text-danger">{error}</p>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onclick={onCancel}
          class="px-4 py-2 text-sm font-medium text-text hover:bg-surface-hovered rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-inverse bg-brand hover:bg-brand-hovered rounded-lg transition-colors"
        >
          <Save class="w-4 h-4" />
          {isEdit ? 'Save Changes' : 'Create Query'}
        </button>
      </div>
    </form>
  </div>
</div>
