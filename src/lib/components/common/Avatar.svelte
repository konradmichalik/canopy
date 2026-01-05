<script lang="ts">
  import type { JiraUser } from '../../types';
  import Tooltip from './Tooltip.svelte';

  interface Props {
    user: JiraUser | null | undefined;
    size?: 'sm' | 'md' | 'lg';
  }

  let { user, size = 'sm' }: Props = $props();

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const avatarSize = {
    sm: '16x16',
    md: '24x24',
    lg: '32x32'
  } as const;

  // Color palette for avatar borders
  const AVATAR_COLORS = [
    '#0052CC', // Blue
    '#00875A', // Green
    '#FF5630', // Red
    '#6554C0', // Purple
    '#FF991F', // Orange
    '#00B8D9', // Cyan
    '#36B37E', // Teal
    '#E91E63', // Pink
    '#8777D9', // Violet
    '#FFAB00'  // Yellow
  ];

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getUserColor(user: JiraUser): string {
    const identifier = user.accountId || user.emailAddress || user.displayName || '';
    const hash = hashString(identifier);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const avatarUrl = $derived(user?.avatarUrls?.[avatarSize[size]] || user?.avatarUrls?.['24x24']);
  const initials = $derived(user?.displayName ? getInitials(user.displayName) : '?');
  const borderColor = $derived(user ? getUserColor(user) : 'transparent');
</script>

{#if user}
  <Tooltip text={user.displayName}>
    <div
      class="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden flex-shrink-0 box-content {sizeClasses[
        size
      ]}"
      style="border: 2px solid {borderColor}"
    >
      {#if avatarUrl}
        <img
          src={avatarUrl}
          alt={user.displayName}
          class="w-full h-full object-cover"
          onerror={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <span class="hidden font-medium text-[var(--color-text-secondary)]">
          {initials}
        </span>
      {:else}
        <span class="font-medium text-[var(--color-text-secondary)]">
          {initials}
        </span>
      {/if}
    </div>
  </Tooltip>
{:else}
  <Tooltip text="Unassigned">
    <div
      class="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] flex-shrink-0 border-2 border-dashed {sizeClasses[
        size
      ]}"
      style="border-color: var(--ds-border-bold)"
    >
      <span class="text-[var(--color-text-secondary)]">-</span>
    </div>
  </Tooltip>
{/if}
