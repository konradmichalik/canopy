<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
  import DialogPortal from './dialog-portal.svelte';
  import DialogOverlay from './dialog-overlay.svelte';
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { ComponentProps, Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    portalProps,
    class: className,
    children,
    ...restProps
  }: DialogPrimitive.ContentProps & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
    children?: Snippet;
  } = $props();
</script>

<DialogPortal {...portalProps}>
  <DialogOverlay />
  <DialogPrimitive.Content
    bind:ref
    class={cn(
      'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </DialogPrimitive.Content>
</DialogPortal>
