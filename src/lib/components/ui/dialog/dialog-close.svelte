<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import AtlaskitIcon from "../../common/AtlaskitIcon.svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.CloseProps = $props();
</script>

<DialogPrimitive.Close
	bind:ref
	class={cn(
		"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		className
	)}
	{...restProps}
>
	<AtlaskitIcon name="cross" size={16} />
	<span class="sr-only">Close</span>
</DialogPrimitive.Close>
