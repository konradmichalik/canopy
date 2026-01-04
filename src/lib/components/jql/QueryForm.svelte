<script lang="ts">
  import { X, Save } from 'lucide-svelte';
  import type { SavedQuery } from '../../types';
  import { validateJql } from '../../utils/jql-helpers';

  interface Props {
    query?: SavedQuery | null;
    onSave: (title: string, jql: string) => void;
    onCancel: () => void;
  }

  let { query = null, onSave, onCancel }: Props = $props();

  let title = $state(query?.title || '');
  let jql = $state(query?.jql || '');
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

    onSave(trimmedTitle, trimmedJql);
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
    class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-lg"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="document"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
      <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
        {isEdit ? 'Edit Query' : 'New Query'}
      </h2>
      <button
        onclick={onCancel}
        class="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="p-4 space-y-4">
      <div>
        <label for="queryTitle" class="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Title
        </label>
        <input
          id="queryTitle"
          type="text"
          bind:value={title}
          placeholder="e.g., Sprint 42 Backlog"
          class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
        />
      </div>

      <div>
        <label for="queryJql" class="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          JQL Query
        </label>
        <textarea
          id="queryJql"
          bind:value={jql}
          placeholder="project = MYPROJECT AND sprint in openSprints()"
          rows="4"
          class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent font-mono text-sm resize-none"
        ></textarea>
        <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
          Enter a valid JQL query. The app will automatically build the hierarchy from the results.
        </p>
      </div>

      {#if error}
        <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onclick={onCancel}
          class="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-jira-blue hover:bg-jira-blue/90 rounded-lg transition-colors"
        >
          <Save class="w-4 h-4" />
          {isEdit ? 'Save Changes' : 'Create Query'}
        </button>
      </div>
    </form>
  </div>
</div>
