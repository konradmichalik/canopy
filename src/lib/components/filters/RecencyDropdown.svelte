<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import { RECENCY_FILTER_OPTIONS, type RecencyFilterOption } from '../../types/tree';

  interface Props {
    selectedOption: RecencyFilterOption;
    onSelect: (option: RecencyFilterOption) => void;
  }

  let { selectedOption, onSelect }: Props = $props();

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | null = $state(null);

  const selectedLabel = $derived(
    selectedOption
      ? (RECENCY_FILTER_OPTIONS.find((o) => o.id === selectedOption)?.label ?? 'Recency')
      : 'Recency'
  );

  const hasSelection = $derived(selectedOption !== null);

  function handleClickOutside(event: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  function handleOptionClick(option: RecencyFilterOption): void {
    // Toggle: if same option is selected, deselect it
    if (option === selectedOption) {
      onSelect(null);
    } else {
      onSelect(option);
    }
    isOpen = false;
  }

  function getIconName(iconName: string): AtlaskitIconName {
    switch (iconName) {
      case 'add':
        return 'add';
      case 'edit':
        return 'edit';
      case 'comment':
        return 'comment';
      default:
        return 'clock';
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
    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
      {hasSelection
      ? 'bg-brand-subtlest border-border-brand text-text-brand font-medium'
      : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
  >
    <AtlaskitIcon name="clock" size={12} />
    <span>{selectedLabel}</span>
    <AtlaskitIcon
      name="chevron-down"
      size={12}
      class="transition-transform {isOpen ? 'rotate-180' : ''}"
    />
  </button>

  {#if isOpen}
    <div
      class="absolute top-full left-0 mt-1 min-w-[180px] bg-surface-overlay border border-border rounded-lg shadow-lg z-50"
    >
      <div class="py-1">
        {#each RECENCY_FILTER_OPTIONS as option (option.id)}
          <button
            onclick={() => handleOptionClick(option.id)}
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-surface-hovered transition-colors"
          >
            <span class="w-4 h-4 flex items-center justify-center">
              {#if option.id === selectedOption}
                <AtlaskitIcon name="check-mark" size={14} color="var(--color-text-brand)" />
              {/if}
            </span>
            <AtlaskitIcon
              name={getIconName(option.icon)}
              size={14}
              color="var(--color-text-subtle)"
            />
            <span
              class={option.id === selectedOption ? 'text-text-brand font-medium' : 'text-text'}
            >
              {option.label}
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
