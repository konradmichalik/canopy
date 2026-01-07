<script lang="ts">
  import { getAvatarUrl, getCachedAvatarUrl } from '../../utils/avatar-cache';

  interface Props {
    src: string | undefined | null;
    alt?: string;
    class?: string;
    style?: string;
    fallback?: import('svelte').Snippet;
  }

  let { src, alt = '', class: className = '', style = '', fallback }: Props = $props();

  let loadedUrl = $state<string | null>(null);
  let _isLoading = $state(false);
  let _loadFailed = $state(false);

  $effect(() => {
    const url = src;
    if (!url) {
      loadedUrl = null;
      _loadFailed = false;
      return;
    }

    // Check cache first
    const cached = getCachedAvatarUrl(url);
    if (cached) {
      loadedUrl = cached;
      _loadFailed = false;
      return;
    }

    // Load with auth
    _isLoading = true;
    _loadFailed = false;

    getAvatarUrl(url).then((blobUrl) => {
      _isLoading = false;
      if (blobUrl) {
        loadedUrl = blobUrl;
      } else {
        _loadFailed = true;
        loadedUrl = null;
      }
    });
  });
</script>

{#if loadedUrl}
  <img src={loadedUrl} {alt} class={className} {style} />
{:else if fallback}
  {@render fallback()}
{/if}
