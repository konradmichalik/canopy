<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import {
    groupingState,
    setGroupBy,
    GROUP_BY_OPTIONS,
    type GroupByOption
  } from '../../stores/grouping.svelte';

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | null = $state(null);

  const selectedOption = $derived(
    GROUP_BY_OPTIONS.find((o) => o.id === groupingState.groupBy) ?? GROUP_BY_OPTIONS[0]
  );

  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  function selectOption(option: GroupByOption): void {
    setGroupBy(option);
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleClickOutside(e: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative" bind:this={dropdownRef}>
  <button
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered"
    title="Group by"
  >
    <AtlaskitIcon name="layers" size={16} />
    <span class="hidden sm:inline">Group: {selectedOption.label}</span>
    <AtlaskitIcon
      name="chevron-down"
      size={12}
      class="transition-transform {isOpen ? 'rotate-180' : ''}"
    />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 top-full mt-1 min-w-[160px] bg-surface-overlay border border-border rounded-lg shadow-lg z-50"
    >
      <div class="px-3 py-2 border-b border-border">
        <span class="text-xs font-medium text-text-subtle">Group By</span>
      </div>
      <div class="py-1">
        {#each GROUP_BY_OPTIONS as option (option.id)}
          <button
            onclick={() => selectOption(option.id)}
            class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-surface-hovered transition-colors"
          >
            <span class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {#if groupingState.groupBy === option.id}
                  <AtlaskitIcon name="check-mark" size={14} color="var(--color-text-brand)" />
                {/if}
              </span>
              <AtlaskitIcon
                name={option.icon as AtlaskitIconName}
                size={16}
                class="text-text-subtle"
              />
              <span
                class={groupingState.groupBy === option.id
                  ? 'text-text-brand font-medium'
                  : 'text-text'}
              >
                {option.label}
              </span>
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
