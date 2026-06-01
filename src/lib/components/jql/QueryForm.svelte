<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import type { SavedQuery, QueryColor } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import { validateJql, validateJqlExtended } from '../../utils/jql-helpers';
  import { isTitleUnique } from '../../stores/jql.svelte';
  import { generateSlug } from '../../utils/slug';
  import { getClient, connectionRegistry } from '../../stores/connection.svelte';
  import { issuesState } from '../../stores/issues.svelte';

  interface Props {
    query?: SavedQuery | null;
    onSave: (
      title: string,
      jql: string,
      color?: QueryColor,
      showEntryNode?: boolean,
      connectionId?: string
    ) => void;
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

  // Connection selection (shown when multiple connections exist, for both new and edit)
  const connections = $derived(connectionRegistry.connections);
  const showConnectionSelector = $derived(connections.length > 1);
  // svelte-ignore state_referenced_locally
  // Default to active connection, then first healthy, then first overall
  let selectedConnectionId = $state<string>(
    query?.connectionId ??
      (issuesState.currentConnectionId &&
      connections.some((c) => c.id === issuesState.currentConnectionId && c.status !== 'error')
        ? issuesState.currentConnectionId
        : (connections.find((c) => c.status !== 'error')?.id ?? connections[0]?.id ?? ''))
  );

  // JQL validation state
  let isCheckingJql = $state(false);
  let jqlCheckResult = $state<
    { valid: true; count: number } | { valid: false; error: string } | null
  >(null);

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

    onSave(trimmedTitle, trimmedJql, color, showEntryNode, selectedConnectionId || undefined);
  }

  function selectColor(c: QueryColor): void {
    color = color === c ? undefined : c;
  }

  // Resolve client for the query's connection (for JQL validation)
  const jqlClient = $derived(
    getClient(
      selectedConnectionId || query?.connectionId || issuesState.currentConnectionId || undefined
    )
  );

  async function checkJql(): Promise<void> {
    const client = jqlClient;
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
      {#if showConnectionSelector}
        <div class="space-y-1.5">
          <label
            for="queryConnection"
            class="text-[11px] font-bold text-text-subtlest uppercase tracking-wider"
            >Connection</label
          >
          <select
            id="queryConnection"
            bind:value={selectedConnectionId}
            onchange={() => (jqlCheckResult = null)}
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {#each connections as conn (conn.id)}
              <option value={conn.id} disabled={conn.status === 'error'}>
                {conn.config.label}
                {conn.status === 'error' ? ' (disconnected)' : ''}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="space-y-1.5">
        <label
          for="queryTitle"
          class="text-[11px] font-bold text-text-subtlest uppercase tracking-wider">Title</label
        >
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
            URL: <span class="font-data text-text-subtlest">/query/{titleSlug}</span>
          </p>
        {/if}
      </div>

      <div class="space-y-1.5">
        <label
          for="queryJql"
          class="text-[11px] font-bold text-text-subtlest uppercase tracking-wider">JQL Query</label
        >
        <div class="relative">
          <textarea
            id="queryJql"
            bind:value={jql}
            placeholder="project = MYPROJECT AND sprint in openSprints()"
            rows="4"
            class="flex w-full min-w-0 rounded-md border bg-surface-sunken/50 shadow-inner px-3 pr-24 py-2 text-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-data text-xs leading-relaxed resize-none
              focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
              {hasJqlWarning
              ? 'border-destructive focus-visible:ring-destructive/20'
              : 'border-input'}"
            oninput={() => (jqlCheckResult = null)}
          ></textarea>
          {#if jqlClient}
            <button
              type="button"
              onclick={checkJql}
              disabled={isCheckingJql || !jql.trim()}
              class="absolute top-2 right-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-background border border-border/50 shadow-sm hover:bg-surface-hovered px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isCheckingJql}
                <AtlaskitIcon name="refresh" size={12} class="animate-spin" />
                Checking...
              {:else}
                <AtlaskitIcon name="check-circle" size={12} />
                Check JQL
              {/if}
            </button>
          {/if}
        </div>
        {#if jqlCheckResult}
          {#if jqlCheckResult.valid}
            <div class="flex items-center gap-1.5 text-xs text-text-success">
              <AtlaskitIcon name="check-circle" size={14} />
              <span
                >Valid JQL — <span class="font-data font-bold">{jqlCheckResult.count}</span>
                {jqlCheckResult.count === 1 ? 'result' : 'results'}</span
              >
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
          <p class="text-[11px] text-text-subtlest">
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
        <legend class="text-[11px] font-bold text-text-subtlest uppercase tracking-wider mb-2"
          >Color (optional)</legend
        >
        <div class="flex flex-wrap gap-2.5">
          {#each QUERY_COLORS as c (c.id)}
            <Tooltip text={c.label}>
              <button
                type="button"
                onclick={() => selectColor(c.id)}
                class="w-7 h-7 rounded-full {c.bg} transition-all duration-200 cursor-pointer
                  {color === c.id
                  ? 'ring-2 ring-offset-2 ring-offset-surface ring-muted-foreground scale-110'
                  : 'hover:scale-110 opacity-60 hover:opacity-100'}"
                aria-label={c.label}
                aria-pressed={color === c.id}
              ></button>
            </Tooltip>
          {/each}
        </div>
      </fieldset>

      <!-- Entry Node Option -->
      <div class="flex items-center gap-3">
        <Switch bind:checked={showEntryNode} />
        <div class="flex items-center gap-1.5">
          <span class="text-sm text-text">Show summary header</span>
          <Tooltip
            text="Wraps all issues in a collapsible header showing aggregated time and completion stats"
          >
            <AtlaskitIcon
              name="status-information"
              size={14}
              class="text-text-subtlest/50 hover:text-text-subtlest cursor-help transition-colors"
            />
          </Tooltip>
        </div>
      </div>

      {#if error}
        <div class="p-3 bg-danger-subtlest border border-border-danger rounded-lg">
          <p class="text-sm text-text-danger">{error}</p>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onclick={onCancel}
          class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hovered transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-brand-hovered shadow-sm transition-colors"
        >
          {isEdit ? 'Save Changes' : 'Create Query'}
        </button>
      </div>
    </form>
  </div>
</div>
