<script lang="ts">
  import type { JiraIssueType } from '../../types';
  import Tooltip from './Tooltip.svelte';

  interface Props {
    issueType: JiraIssueType;
    size?: number;
  }

  let { issueType, size = 16 }: Props = $props();

  // Use iconUrl from JIRA API if available
  const hasIconUrl = $derived(!!issueType.iconUrl);
</script>

<Tooltip text={issueType.name}>
  {#if hasIconUrl}
    <img src={issueType.iconUrl} alt={issueType.name} width={size} height={size} class="shrink-0" />
  {:else}
    <!-- Fallback: generic icon -->
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="shrink-0"
      role="img"
      aria-label={issueType.name}
    >
      <path
        fill="#6B7280"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm-.5 2a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z"
      />
    </svg>
  {/if}
</Tooltip>
