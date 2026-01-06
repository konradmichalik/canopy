<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import {
    sortConfigState,
    setSortField,
    toggleSortDirection,
    SORT_FIELDS
  } from '../../stores/sortConfig.svelte';
  import type { SortField } from '../../types/tree';
  import { hasJqlOrderBy } from '../../stores/issues.svelte';

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | null = $state(null);

  const selectedLabel = $derived(
    SORT_FIELDS.find((f) => f.id === sortConfigState.config.field)?.label ?? 'Key'
  );

  const isAscending = $derived(sortConfigState.config.direction === 'asc');

  // Disable when JQL has ORDER BY clause
  const isDisabled = $derived(hasJqlOrderBy());

  function handleClickOutside(event: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function toggleDropdown(): void {
    if (!isDisabled) {
      isOpen = !isOpen;
    }
  }

  function handleFieldSelect(field: SortField): void {
    if (field === sortConfigState.config.field) {
      // Same field selected - toggle direction
      toggleSortDirection();
    } else {
      // New field selected
      setSortField(field);
    }
    isOpen = false;
  }

  function handleDirectionToggle(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!isDisabled) {
      toggleSortDirection();
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative" bind:this={dropdownRef}>
  <button
    onclick={toggleDropdown}
    disabled={isDisabled}
    class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors
      {isDisabled
      ? 'bg-surface-sunken border-border text-text-disabled cursor-not-allowed opacity-50'
      : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
    title={isDisabled ? 'Sorting disabled - JQL contains ORDER BY clause' : 'Sort issues'}
  >
    <AtlaskitIcon name="sort" size={16} />
    <span class="hidden sm:inline">Sort: {selectedLabel}</span>
    <span
      onclick={handleDirectionToggle}
      onkeydown={(e) => e.key === 'Enter' && handleDirectionToggle(e as unknown as MouseEvent)}
      role="button"
      tabindex={isDisabled ? -1 : 0}
      class="p-0.5 rounded hover:bg-surface-sunken {isDisabled
        ? 'cursor-not-allowed'
        : 'cursor-pointer'}"
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
      class="transition-transform {isOpen ? 'rotate-180' : ''}"
    />
  </button>

  {#if isOpen && !isDisabled}
    <div
      class="absolute top-full right-0 mt-1 min-w-[160px] bg-surface-overlay border border-border rounded-lg shadow-lg z-50"
    >
      <div class="px-3 py-2 border-b border-border">
        <span class="text-xs font-medium text-text-subtle">Sort By</span>
      </div>
      <div class="py-1">
        {#each SORT_FIELDS as field (field.id)}
          <button
            onclick={() => handleFieldSelect(field.id)}
            class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-surface-hovered transition-colors"
          >
            <span class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {#if field.id === sortConfigState.config.field}
                  <AtlaskitIcon name="check-mark" size={14} color="var(--color-text-brand)" />
                {/if}
              </span>
              <span
                class={field.id === sortConfigState.config.field
                  ? 'text-text-brand font-medium'
                  : 'text-text'}
              >
                {field.label}
              </span>
            </span>
            {#if field.id === sortConfigState.config.field}
              <AtlaskitIcon
                name={isAscending ? 'arrow-up' : 'arrow-down'}
                size={12}
                color="var(--color-text-subtle)"
              />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
