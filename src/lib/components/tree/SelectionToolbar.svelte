<script lang="ts">
	import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
	import FlashMessage from '../common/FlashMessage.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		getSelectedKeys,
		getSelectedCount,
		hasSelection,
		clearSelection,
		buildBulkEditUrl,
		copySelectedKeys
	} from '../../stores/selection.svelte';
	import { connectionState } from '../../stores/connection.svelte';
	import { openExternalUrl } from '../../utils/external-link';

	let flashMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | null = null;

	const selectedCount = $derived(getSelectedCount());

	function showFlash(type: 'success' | 'error', text: string): void {
		if (flashTimer) clearTimeout(flashTimer);
		flashMessage = { type, text };
		flashTimer = setTimeout(() => {
			flashMessage = null;
			flashTimer = null;
		}, 2500);
	}

	function handleBulkEdit(): void {
		const baseUrl = connectionState.config?.baseUrl;
		if (!baseUrl) return;

		const keys = getSelectedKeys();
		const { url, warning } = buildBulkEditUrl(baseUrl, keys);

		if (url.length > 8000) {
			showFlash('error', warning ?? 'URL too long');
			return;
		}

		if (warning) {
			showFlash('success', warning);
		}

		openExternalUrl(url);
	}

	async function handleCopyKeys(): Promise<void> {
		try {
			const keys = getSelectedKeys();
			await copySelectedKeys(keys);
			showFlash('success', `${keys.length} keys copied`);
		} catch {
			showFlash('error', 'Copy failed');
		}
	}
</script>

{#if hasSelection()}
	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
			bg-surface shadow-lg border border-border rounded-full px-4 py-2
			flex items-center gap-3 animate-slide-up"
	>
		<span class="text-sm font-medium whitespace-nowrap">
			{selectedCount}
			{selectedCount === 1 ? 'issue' : 'issues'} selected
		</span>

		<div class="w-px h-5 bg-border"></div>

		<Button variant="ghost" size="sm" onclick={handleBulkEdit} class="gap-1.5 whitespace-nowrap">
			<AtlaskitIcon name="link-external" size={14} />
			Bulk edit
		</Button>

		<Button variant="ghost" size="sm" onclick={handleCopyKeys} class="gap-1.5 whitespace-nowrap">
			<AtlaskitIcon name="copy" size={14} />
			Copy keys
		</Button>

		<div class="w-px h-5 bg-border"></div>

		<Button variant="ghost" size="icon" onclick={clearSelection} class="h-7 w-7">
			<AtlaskitIcon name="cross" size={14} />
		</Button>
	</div>
{/if}

<FlashMessage message={flashMessage} />
