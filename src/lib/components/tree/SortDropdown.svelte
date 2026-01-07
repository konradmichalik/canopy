<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import {
    sortConfigState,
    setSortField,
    toggleSortDirection,
    SORT_FIELDS
  } from '../../stores/sortConfig.svelte';
  import type { SortField } from '../../types/tree';
  import { hasJqlOrderBy } from '../../stores/issues.svelte';

  let open = $state(false);

  const selectedLabel = $derived(
    SORT_FIELDS.find((f) => f.id === sortConfigState.config.field)?.label ?? 'Key'
  );

  const isAscending = $derived(sortConfigState.config.direction === 'asc');

  // Disable when JQL has ORDER BY clause
  const isDisabled = $derived(hasJqlOrderBy());

  function handleFieldSelect(field: SortField): void {
    if (field === sortConfigState.config.field) {
      toggleSortDirection();
    } else {
      setSortField(field);
    }
    open = false;
  }

  function handleDirectionToggle(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!isDisabled) {
      toggleSortDirection();
    }
  }
</script>

<DropdownMenu.Root bind:open>
  <Tooltip text={isDisabled ? 'Sorting disabled - JQL contains ORDER BY clause' : 'Sort issues'}>
    <DropdownMenu.Trigger
      disabled={isDisabled}
      class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors
        {isDisabled
        ? 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
        : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-accent'}"
    >
      <AtlaskitIcon name="sort" size={16} />
      <span class="hidden sm:inline">Sort: {selectedLabel}</span>
      <span
        onclick={handleDirectionToggle}
        onkeydown={(e) => e.key === 'Enter' && handleDirectionToggle(e as unknown as MouseEvent)}
        role="button"
        tabindex={isDisabled ? -1 : 0}
        class="p-0.5 rounded hover:bg-muted {isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
        title={isDisabled
          ? 'Sorting disabled'
          : isAscending
            ? 'Ascending (click to change)'
            : 'Descending (click to change)'}
      >
        <AtlaskitIcon name={isAscending ? 'arrow-up' : 'arrow-down'} size={12} />
      </span>
      <AtlaskitIcon
        name="chevron-down"
        size={12}
        class="transition-transform {open ? 'rotate-180' : ''}"
      />
    </DropdownMenu.Trigger>
  </Tooltip>

  <DropdownMenu.Content align="end" class="min-w-[160px]">
    <DropdownMenu.Label>Sort By</DropdownMenu.Label>
    <DropdownMenu.Separator />
    {#each SORT_FIELDS as field (field.id)}
      <DropdownMenu.Item
        onclick={() => handleFieldSelect(field.id)}
        class="flex items-center justify-between gap-2"
      >
        <span class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {#if field.id === sortConfigState.config.field}
              <AtlaskitIcon name="check-mark" size={14} class="text-primary" />
            {/if}
          </span>
          <span
            class={field.id === sortConfigState.config.field
              ? 'text-primary font-medium'
              : 'text-foreground'}
          >
            {field.label}
          </span>
        </span>
        {#if field.id === sortConfigState.config.field}
          <AtlaskitIcon
            name={isAscending ? 'arrow-up' : 'arrow-down'}
            size={12}
            class="text-muted-foreground"
          />
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
