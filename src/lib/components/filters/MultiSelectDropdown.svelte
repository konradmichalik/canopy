<script lang="ts">
  import { ChevronDown, Check } from 'lucide-svelte';
  import type { ExtendedQuickFilter } from '../../stores/filters.svelte';
  import type { Component } from 'svelte';

  interface Props {
    label: string;
    filters: ExtendedQuickFilter[];
    onToggle: (id: string) => void;
    getIcon: (iconName: string | undefined) => Component;
  }

  let { label, filters, onToggle, getIcon }: Props = $props();

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | null = $state(null);

  const activeCount = $derived(filters.filter((f) => f.isActive).length);

  function handleClickOutside(event: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  function handleOptionClick(id: string): void {
    onToggle(id);
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
    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
      {activeCount > 0
      ? 'bg-brand-subtlest border-border-brand text-text-brand font-medium'
      : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
  >
    <span>{label}</span>
    {#if activeCount > 0}
      <span
        class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-brand text-text-inverse"
      >
        {activeCount}
      </span>
    {/if}
    <ChevronDown class="w-3 h-3 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      class="absolute top-full left-0 mt-1 min-w-[160px] bg-surface-overlay border border-border rounded-lg shadow-lg z-50"
    >
      <div class="py-1">
        {#each filters as filter (filter.id)}
          {@const IconComponent = getIcon(filter.icon)}
          <button
            onclick={() => handleOptionClick(filter.id)}
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-surface-hovered transition-colors"
          >
            <span class="w-4 h-4 flex items-center justify-center">
              {#if filter.isActive}
                <Check class="w-3.5 h-3.5 text-text-brand" />
              {/if}
            </span>
            {#if filter.avatarUrl}
              <img
                src={filter.avatarUrl}
                alt=""
                class="w-5 h-5 rounded-full flex-shrink-0 {filter.color ? 'ring-1' : ''}"
                style={filter.color ? `--tw-ring-color: ${filter.color}` : ''}
              />
            {:else if filter.color}
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                style="background-color: {filter.color}"
              ></span>
            {:else}
              <IconComponent class="w-3.5 h-3.5 text-text-subtle" />
            {/if}
            <span class={filter.isActive ? 'text-text-brand font-medium' : 'text-text'}
              >{filter.label}</span
            >
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
