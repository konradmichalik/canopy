<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import {
    fieldConfigState,
    toggleField,
    type DisplayFieldId
  } from '../../stores/fieldConfig.svelte';

  let open = $state(false);

  const enabledCount = $derived(fieldConfigState.fields.filter((f) => f.isEnabled).length);
</script>

<DropdownMenu.Root bind:open>
  <Tooltip text="Configure visible fields">
    <DropdownMenu.Trigger
      class="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors bg-card border-border text-muted-foreground hover:border-border hover:bg-accent"
    >
      <AtlaskitIcon name="layout-three-columns" size={16} />
      <span class="hidden sm:inline">Fields</span>
      <span
        class="inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded bg-muted text-muted-foreground"
      >
        {enabledCount}
      </span>
      <AtlaskitIcon
        name="chevron-down"
        size={12}
        class="transition-transform {open ? 'rotate-180' : ''}"
      />
    </DropdownMenu.Trigger>
  </Tooltip>

  <DropdownMenu.Content align="end" class="min-w-[200px] max-h-[300px] overflow-y-auto">
    <DropdownMenu.Label>Display Fields</DropdownMenu.Label>
    <DropdownMenu.Separator />
    {#each fieldConfigState.fields as field (field.id)}
      <DropdownMenu.CheckboxItem
        checked={field.isEnabled}
        onCheckedChange={() => toggleField(field.id)}
      >
        {field.label}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
