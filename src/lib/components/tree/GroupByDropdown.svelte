<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import {
    groupingState,
    setGroupBy,
    GROUP_BY_OPTIONS,
    type GroupByOption
  } from '../../stores/grouping.svelte';

  let open = $state(false);

  const selectedOption = $derived(
    GROUP_BY_OPTIONS.find((o) => o.id === groupingState.groupBy) ?? GROUP_BY_OPTIONS[0]
  );

  function selectOption(option: GroupByOption): void {
    setGroupBy(option);
    open = false;
  }
</script>

<DropdownMenu.Root bind:open>
  <Tooltip text="Group by">
    <DropdownMenu.Trigger
      class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors bg-card border-border text-muted-foreground hover:border-border hover:bg-accent"
    >
      <AtlaskitIcon name="layers" size={16} />
      <span class="hidden sm:inline">Group: {selectedOption.label}</span>
      <AtlaskitIcon
        name="chevron-down"
        size={12}
        class="transition-transform {open ? 'rotate-180' : ''}"
      />
    </DropdownMenu.Trigger>
  </Tooltip>

  <DropdownMenu.Content align="end" class="min-w-[160px]">
    <DropdownMenu.Label>Group By</DropdownMenu.Label>
    <DropdownMenu.Separator />
    {#each GROUP_BY_OPTIONS as option (option.id)}
      <DropdownMenu.Item onclick={() => selectOption(option.id)} class="flex items-center gap-2">
        <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {#if groupingState.groupBy === option.id}
            <AtlaskitIcon name="check-mark" size={14} class="text-primary" />
          {/if}
        </span>
        <AtlaskitIcon
          name={option.icon as AtlaskitIconName}
          size={16}
          class="text-muted-foreground"
        />
        <span
          class={groupingState.groupBy === option.id
            ? 'text-primary font-medium'
            : 'text-foreground'}
        >
          {option.label}
        </span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
