<script lang="ts">
  import { Switch as SwitchPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    ...restProps
  }: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props();
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  class={cn(
    'data-[state=checked]:bg-brand data-[state=unchecked]:bg-neutral focus-visible:ring-2 focus-visible:ring-border-focused peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    class={cn(
      'bg-white pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5'
    )}
  />
</SwitchPrimitive.Root>
