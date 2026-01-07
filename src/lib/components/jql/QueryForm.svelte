<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import type { SavedQuery, QueryColor } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import { validateJql, validateJqlExtended } from '../../utils/jql-helpers';

  interface Props {
    query?: SavedQuery | null;
    onSave: (title: string, jql: string, color?: QueryColor, showEntryNode?: boolean) => void;
    onCancel: () => void;
  }

  let { query = null, onSave, onCancel }: Props = $props();

  let title = $state(query?.title || '');
  let jql = $state(query?.jql || '');
  let color = $state<QueryColor | undefined>(query?.color);
  let showEntryNode = $state(query?.showEntryNode ?? false);
  let error = $state<string | null>(null);

  // Real-time JQL validation
  const jqlValidation = $derived(validateJqlExtended(jql));
  const hasJqlWarning = $derived(!jqlValidation.isValid && jql.trim().length > 0);

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

    onSave(trimmedTitle, trimmedJql, color, showEntryNode);
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
        <AtlaskitIcon name="cross" size={20} />
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
          class="w-full px-3 py-2 bg-input border rounded-lg text-text placeholder-text-subtlest focus:outline-none focus:ring-2 focus:border-transparent font-mono text-sm resize-none transition-colors
            {hasJqlWarning
            ? 'border-border-danger focus:ring-border-danger'
            : 'border-border focus:ring-border-focused'}"
        ></textarea>
        {#if hasJqlWarning}
          <div class="flex items-center gap-1.5 mt-1.5 text-xs text-text-warning">
            <AtlaskitIcon name="warning" size={14} />
            <span>{jqlValidation.error}</span>
          </div>
        {:else}
          <p class="mt-1 text-xs text-text-subtle">
            Enter a valid JQL query. The app will automatically build the hierarchy from the
            results.
          </p>
        {/if}
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

      <!-- Entry Node Option -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" bind:checked={showEntryNode} class="sr-only peer" />
          <div
            class="w-9 h-5 bg-neutral rounded-full peer peer-checked:bg-brand peer-focus:ring-2 peer-focus:ring-border-focused transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"
          ></div>
        </label>
        <div class="flex items-center gap-1.5">
          <span class="text-sm text-text">Show summary header</span>
          <Tooltip
            text="Wraps all issues in a collapsible header showing aggregated time and completion stats"
          >
            <AtlaskitIcon name="status-information" size={14} class="text-text-subtlest" />
          </Tooltip>
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
          <AtlaskitIcon name="save" size={16} />
          {isEdit ? 'Save Changes' : 'Create Query'}
        </button>
      </div>
    </form>
  </div>
</div>
