<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { RECENCY_FILTER_OPTIONS, type RecencyFilterOption } from '../../types/tree';

  interface Props {
    selectedOption: RecencyFilterOption;
    onSelect: (option: RecencyFilterOption) => void;
  }

  let { selectedOption, onSelect }: Props = $props();

  let open = $state(false);

  const selectedLabel = $derived(
    selectedOption
      ? (RECENCY_FILTER_OPTIONS.find((o) => o.id === selectedOption)?.label ?? 'Recency')
      : 'Recency'
  );

  const hasSelection = $derived(selectedOption !== null);

  function handleOptionClick(option: RecencyFilterOption): void {
    // Toggle: if same option is selected, deselect it
    if (option === selectedOption) {
      onSelect(null);
    } else {
      onSelect(option);
    }
    open = false;
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
</script>

<DropdownMenu.Root bind:open>
  <DropdownMenu.Trigger
    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
      {hasSelection
      ? 'bg-accent border-primary text-primary font-medium'
      : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-accent'}"
  >
    <AtlaskitIcon name="clock" size={12} />
    <span>{selectedLabel}</span>
    <AtlaskitIcon
      name="chevron-down"
      size={12}
      class="transition-transform {open ? 'rotate-180' : ''}"
    />
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="start" class="min-w-[180px]">
    {#each RECENCY_FILTER_OPTIONS as option (option.id)}
      <DropdownMenu.Item
        onclick={() => handleOptionClick(option.id)}
        class="flex items-center gap-2 text-xs"
      >
        <span class="w-4 h-4 flex items-center justify-center">
          {#if option.id === selectedOption}
            <AtlaskitIcon name="check-mark" size={14} class="text-primary" />
          {/if}
        </span>
        <AtlaskitIcon
          name={getIconName(option.icon)}
          size={14}
          class="text-muted-foreground"
        />
        <span class={option.id === selectedOption ? 'text-primary font-medium' : 'text-foreground'}>
          {option.label}
        </span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
