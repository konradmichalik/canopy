<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { SavedQuery, QueryColor } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import { validateJql, validateJqlExtended } from '../../utils/jql-helpers';
  import { isTitleUnique } from '../../stores/jql.svelte';
  import { generateSlug } from '../../utils/slug';
  import { getClient, connectionState } from '../../stores/connection.svelte';

  interface Props {
    query?: SavedQuery | null;
    onSave: (title: string, jql: string, color?: QueryColor, showEntryNode?: boolean) => void;
    onCancel: () => void;
  }

  let { query = null, onSave, onCancel }: Props = $props();

  // These intentionally capture initial values only - the modal is opened with fixed query data
  // svelte-ignore state_referenced_locally
  let title = $state(query?.title || '');
  // svelte-ignore state_referenced_locally
  let jql = $state(query?.jql || '');
  // svelte-ignore state_referenced_locally
  let color = $state<QueryColor | undefined>(query?.color);
  // svelte-ignore state_referenced_locally
  let showEntryNode = $state(query?.showEntryNode ?? true);
  let error = $state<string | null>(null);

  // JQL validation state
  let isCheckingJql = $state(false);
  let jqlCheckResult = $state<{ valid: true; count: number } | { valid: false; error: string } | null>(null);

  // Real-time JQL validation
  const jqlValidation = $derived(validateJqlExtended(jql));
  const hasJqlWarning = $derived(!jqlValidation.isValid && jql.trim().length > 0);

  // Real-time title validation
  const titleSlug = $derived(generateSlug(title.trim()));
  const isTitleDuplicate = $derived(
    title.trim().length > 0 && !isTitleUnique(title.trim(), query?.id)
  );
  const hasTitleWarning = $derived(isTitleDuplicate);

  function handleSubmit(e: Event): void {
    e.preventDefault();
    error = null;

    const trimmedTitle = title.trim();
    const trimmedJql = jql.trim();

    if (!trimmedTitle) {
      error = 'Title is required';
      return;
    }

    if (!isTitleUnique(trimmedTitle, query?.id)) {
      error = 'A query with this title already exists';
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

  async function checkJql(): Promise<void> {
    const client = getClient();
    if (!client) return;

    isCheckingJql = true;
    jqlCheckResult = null;

    try {
      const count = await client.getIssueCount(jql.trim());
      jqlCheckResult = { valid: true, count };
    } catch (e) {
      jqlCheckResult = { valid: false, error: e instanceof Error ? e.message : 'Unknown error' };
    } finally {
      isCheckingJql = false;
    }
  }

  const isEdit = $derived(!!query);
</script>

<!-- Modal Backdrop -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  onclick={onCancel}
  onkeydown={(e) => e.key === 'Escape' && onCancel()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <!-- Modal Content -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="document"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h2 class="text-lg font-semibold text-foreground">
        {isEdit ? 'Edit Query' : 'New Query'}
      </h2>
      <Button variant="ghost" size="icon-sm" onclick={onCancel}>
        <AtlaskitIcon name="cross" size={20} />
      </Button>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="p-4 space-y-4">
      <div class="space-y-2">
        <Label for="queryTitle">Title</Label>
        <Input
          id="queryTitle"
          type="text"
          bind:value={title}
          placeholder="e.g., Sprint 42 Backlog"
          class={hasTitleWarning ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {#if hasTitleWarning}
          <div class="flex items-center gap-1.5 text-xs text-destructive">
            <AtlaskitIcon name="warning" size={14} />
            <span>A query with this title already exists</span>
          </div>
        {:else if titleSlug}
          <p class="text-xs text-muted-foreground">
            URL: /query/<span class="font-mono">{titleSlug}</span>
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="queryJql">JQL Query</Label>
          {#if connectionState.isConnected}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={checkJql}
              disabled={isCheckingJql || !jql.trim()}
              class="h-7 text-xs"
            >
              {#if isCheckingJql}
                <AtlaskitIcon name="refresh" size={14} class="animate-spin" />
                Checking...
              {:else}
                <AtlaskitIcon name="check-circle" size={14} />
                Check JQL
              {/if}
            </Button>
          {/if}
        </div>
        <textarea
          id="queryJql"
          bind:value={jql}
          placeholder="project = MYPROJECT AND sprint in openSprints()"
          rows="4"
          class="flex w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none
            focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
            {hasJqlWarning
            ? 'border-destructive focus-visible:ring-destructive/20'
            : 'border-input'}"
          onchange={() => jqlCheckResult = null}
        ></textarea>
        {#if jqlCheckResult}
          {#if jqlCheckResult.valid}
            <div class="flex items-center gap-1.5 text-xs text-text-success">
              <AtlaskitIcon name="check-circle" size={14} />
              <span>Valid JQL - {jqlCheckResult.count} {jqlCheckResult.count === 1 ? 'result' : 'results'}</span>
            </div>
          {:else}
            <div class="flex items-center gap-1.5 text-xs text-text-danger">
              <AtlaskitIcon name="cross" size={14} />
              <span>{jqlCheckResult.error}</span>
            </div>
          {/if}
        {:else if hasJqlWarning}
          <div class="flex items-center gap-1.5 text-xs text-text-warning">
            <AtlaskitIcon name="warning" size={14} />
            <span>{jqlValidation.error}</span>
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">
            Enter a valid JQL query. The app will automatically build the hierarchy from the
            results.
            <a
              href="https://www.atlassian.com/software/jira/guides/jql/overview"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand hover:underline"
            >
              Learn JQL
            </a>
          </p>
        {/if}
      </div>

      <!-- Color Selection -->
      <fieldset>
        <legend class="block text-sm font-medium text-text mb-2"> Color (optional) </legend>
        <div class="flex flex-wrap gap-2">
          {#each QUERY_COLORS as c (c.id)}
            <Tooltip text={c.label}>
              <button
                type="button"
                onclick={() => selectColor(c.id)}
                class="w-8 h-8 rounded-full {c.bg} transition-all
                  {color === c.id
                  ? 'ring-2 ring-offset-2 ring-offset-surface ring-text scale-110'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'}"
                aria-label={c.label}
                aria-pressed={color === c.id}
              ></button>
            </Tooltip>
          {/each}
        </div>
      </fieldset>

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
        <Button type="button" variant="ghost" onclick={onCancel}>Cancel</Button>
        <Button type="submit">
          <AtlaskitIcon name="save" size={16} />
          {isEdit ? 'Save Changes' : 'Create Query'}
        </Button>
      </div>
    </form>
  </div>
</div>
