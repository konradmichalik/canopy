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
  import type { Snippet } from 'svelte';

  interface Props {
    node: TreeNode;
    children: Snippet;
  }

  let { node, children }: Props = $props();

  const currentFlag = $derived(flagsState.flags[node.issue.key] ?? null);

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
        Flag entfernen
      </ContextMenu.Item>
    {/if}

    <ContextMenu.Separator />

    <!-- Actions -->
    <ContextMenu.Item onclick={handleOpenInJira}>
      <AtlaskitIcon name="link-external" size={14} class="mr-2" />
      In Jira öffnen
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleCopyKey}>
      <AtlaskitIcon name="copy" size={14} class="mr-2" />
      Key kopieren
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleCopyUrl}>
      <AtlaskitIcon name="link" size={14} class="mr-2" />
      URL kopieren
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
