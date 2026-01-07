<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import {
    fieldConfigState,
    toggleField,
    type DisplayFieldId
  } from '../../stores/fieldConfig.svelte';

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | null = $state(null);

  const enabledCount = $derived(fieldConfigState.fields.filter((f) => f.isEnabled).length);

  function handleClickOutside(event: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  function handleOptionClick(id: DisplayFieldId): void {
    toggleField(id);
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
  <Tooltip text="Configure visible fields">
    <button
      onclick={toggleDropdown}
      class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors
        {enabledCount > 0
        ? 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'
        : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
    >
      <AtlaskitIcon name="layout-three-columns" size={16} />
      <span class="hidden sm:inline">Fields</span>
      <span
        class="inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded bg-surface-sunken text-text-subtle"
      >
        {enabledCount}
      </span>
      <AtlaskitIcon
        name="chevron-down"
        size={12}
        class="transition-transform {isOpen ? 'rotate-180' : ''}"
      />
    </button>
  </Tooltip>

  {#if isOpen}
    <div
      class="absolute top-full right-0 mt-1 min-w-[200px] bg-surface-overlay border border-border rounded-lg shadow-lg z-50"
    >
      <div class="px-3 py-2 border-b border-border">
        <span class="text-xs font-medium text-text-subtle">Display Fields</span>
      </div>
      <div class="py-1 max-h-[300px] overflow-y-auto">
        {#each fieldConfigState.fields as field (field.id)}
          <button
            onclick={() => handleOptionClick(field.id)}
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-hovered transition-colors"
          >
            <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {#if field.isEnabled}
                <AtlaskitIcon name="check-mark" size={14} color="var(--color-text-brand)" />
              {/if}
            </span>
            <span class={field.isEnabled ? 'text-text-brand font-medium' : 'text-text'}>
              {field.label}
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
