<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import AuthImage from '../common/AuthImage.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import type { ExtendedQuickFilter } from '../../stores/filters.svelte';

  interface Props {
    label: string;
    filters: ExtendedQuickFilter[];
    onToggle: (id: string) => void;
    getIconName: (iconName: string | undefined) => AtlaskitIconName;
  }

  let { label, filters, onToggle, getIconName }: Props = $props();

  let open = $state(false);

  const activeCount = $derived(filters.filter((f) => f.isActive).length);
</script>

<DropdownMenu.Root bind:open>
  <DropdownMenu.Trigger
    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
      {activeCount > 0
      ? 'bg-accent border-primary text-primary font-medium'
      : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-accent'}"
  >
    <span>{label}</span>
    {#if activeCount > 0}
      <span
        class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground"
      >
        {activeCount}
      </span>
    {/if}
    <AtlaskitIcon
      name="chevron-down"
      size={12}
      class="transition-transform {open ? 'rotate-180' : ''}"
    />
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="start" class="min-w-[160px]">
    {#each filters as filter (filter.id)}
      <DropdownMenu.Item
        onclick={() => onToggle(filter.id)}
        class="flex items-center gap-2 text-xs"
      >
        <span class="w-4 h-4 flex items-center justify-center">
          {#if filter.isActive}
            <AtlaskitIcon name="check-mark" size={14} class="text-primary" />
          {/if}
        </span>
        {#if filter.avatarUrl}
          <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <AuthImage
              src={filter.avatarUrl}
              alt=""
              class="w-5 h-5 rounded-full {filter.color ? 'ring-1' : ''}"
              style={filter.color ? `--tw-ring-color: ${filter.color}` : ''}
            >
              {#snippet fallback()}
                <AtlaskitIcon
                  name={getIconName(filter.icon)}
                  size={16}
                  class="text-muted-foreground"
                />
              {/snippet}
            </AuthImage>
          </span>
        {:else if filter.iconUrl}
          <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <AuthImage src={filter.iconUrl} alt="" class="w-4 h-4">
              {#snippet fallback()}
                <AtlaskitIcon
                  name={getIconName(filter.icon)}
                  size={14}
                  class="text-muted-foreground"
                />
              {/snippet}
            </AuthImage>
          </span>
        {:else if filter.icon && filter.color}
          <AtlaskitIcon name={getIconName(filter.icon)} size={14} color={filter.color} />
        {:else if filter.color}
          <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            style="background-color: {filter.color}"
          ></span>
        {:else}
          <AtlaskitIcon
            name={getIconName(filter.icon)}
            size={14}
            class="text-muted-foreground"
          />
        {/if}
        <span class={filter.isActive ? 'text-primary font-medium' : 'text-foreground'}>
          {filter.label}
        </span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
