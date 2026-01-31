<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { TreeNode } from '../../types';
  import {
    FLAG_COLORS,
    flagsState,
    toggleFlag,
    removeFlag,
    type FlagColor
  } from '../../stores/flags.svelte';
  import { getIssueUrl } from '../../stores/issues.svelte';
  import { openExternalUrl } from '../../utils/external-link';
  import {
    isSelected,
    getSelectedKeys,
    getSelectedCount,
    clearSelection,
    buildBulkEditUrl,
    copySelectedKeys
  } from '../../stores/selection.svelte';
  import { connectionState } from '../../stores/connection.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    node: TreeNode;
    children: Snippet;
  }

  let { node, children }: Props = $props();

  const currentFlag = $derived(flagsState.flags[node.issue.key] ?? null);
  const isNodeSelected = $derived(isSelected(node.issue.key));
  const selectedCount = $derived(getSelectedCount());
  const showBulkActions = $derived(isNodeSelected && selectedCount > 1);

  function handleFlagSelect(color: FlagColor): void {
    toggleFlag(node.issue.key, color);
  }

  function handleRemoveFlag(): void {
    removeFlag(node.issue.key);
  }

  function handleCopyKey(): void {
    navigator.clipboard.writeText(node.issue.key);
  }

  function handleCopyUrl(): void {
    const url = getIssueUrl(node.issue.key);
    if (url) {
      navigator.clipboard.writeText(url);
    }
  }

  function handleOpenInJira(): void {
    const url = getIssueUrl(node.issue.key);
    if (url) {
      openExternalUrl(url);
    }
  }

  function handleBulkEdit(): void {
    const baseUrl = connectionState.config?.baseUrl;
    if (!baseUrl) return;
    const keys = getSelectedKeys();
    const { url } = buildBulkEditUrl(baseUrl, keys);
    if (url.length > 8000) return;
    openExternalUrl(url);
  }

  async function handleBulkCopyKeys(): Promise<void> {
    const keys = getSelectedKeys();
    await copySelectedKeys(keys);
  }
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="w-full">
    {@render children()}
  </ContextMenu.Trigger>

  <ContextMenu.Content class="w-52">
    <!-- Flag Color Selection -->
    <ContextMenu.Label class="text-xs text-muted-foreground">Flag</ContextMenu.Label>
    <div class="flex items-center gap-1.5 px-2 py-1.5">
      {#each FLAG_COLORS as flagColor (flagColor.id)}
        <button
          type="button"
          onclick={() => handleFlagSelect(flagColor.id)}
          class="w-6 h-6 rounded-full transition-all cursor-pointer border-2
            {currentFlag === flagColor.id
            ? 'scale-110 border-foreground shadow-sm'
            : 'border-transparent hover:scale-110 hover:border-border'}"
          style="background-color: {flagColor.color}"
          title={flagColor.label}
        ></button>
      {/each}
    </div>

    {#if currentFlag}
      <ContextMenu.Item onclick={handleRemoveFlag}>
        <AtlaskitIcon name="cross" size={14} class="mr-2" />
        Remove flag
      </ContextMenu.Item>
    {/if}

    <ContextMenu.Separator />

    <!-- Bulk Actions (when multiple issues selected) -->
    {#if showBulkActions}
      <ContextMenu.Label class="text-xs text-muted-foreground">
        Bulk actions ({selectedCount})
      </ContextMenu.Label>
      <ContextMenu.Item onclick={handleBulkEdit}>
        <AtlaskitIcon name="link-external" size={14} class="mr-2" />
        Bulk edit in Jira ({selectedCount})
      </ContextMenu.Item>
      <ContextMenu.Item onclick={handleBulkCopyKeys}>
        <AtlaskitIcon name="copy" size={14} class="mr-2" />
        Copy keys ({selectedCount})
      </ContextMenu.Item>
      <ContextMenu.Item onclick={clearSelection}>
        <AtlaskitIcon name="cross" size={14} class="mr-2" />
        Clear selection
      </ContextMenu.Item>
      <ContextMenu.Separator />
    {/if}

    <!-- Actions -->
    <ContextMenu.Item onclick={handleOpenInJira}>
      <AtlaskitIcon name="link-external" size={14} class="mr-2" />
      Open in Jira
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleCopyKey}>
      <AtlaskitIcon name="copy" size={14} class="mr-2" />
      Copy key
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleCopyUrl}>
      <AtlaskitIcon name="link" size={14} class="mr-2" />
      Copy URL
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
