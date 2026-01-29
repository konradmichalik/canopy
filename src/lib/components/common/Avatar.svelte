<script lang="ts">
  import type { JiraUser } from '../../types';
  import AuthImage from './AuthImage.svelte';
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
    '#FFAB00' // Yellow
  ];

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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

  /**
   * Check if the avatar URL is a Jira default/anonymous avatar
   * These often look broken or generic, so we prefer showing initials instead
   */
  function isDefaultAvatar(url: string | undefined | null): boolean {
    if (!url) return true;

    const lowerUrl = url.toLowerCase();

    // Jira's built-in default avatars
    if (lowerUrl.includes('universal_avatar')) return true;
    if (lowerUrl.includes('isdefault=true')) return true;
    if (lowerUrl.includes('avatartype=issuetype')) return false; // Issue type avatars are fine
    if (lowerUrl.includes('/avatar/') && lowerUrl.includes('default')) return true;

    // Gravatar default images (mystery person, identicon, etc.)
    if (lowerUrl.includes('gravatar.com') && lowerUrl.includes('d=')) return true;
    if (lowerUrl.includes('secsgravatar.com')) return true;

    return false;
  }

  const rawAvatarUrl = $derived(
    user?.avatarUrls?.[avatarSize[size]] || user?.avatarUrls?.['24x24']
  );
  const avatarUrl = $derived(isDefaultAvatar(rawAvatarUrl) ? null : rawAvatarUrl);
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
      <AuthImage src={avatarUrl} alt={user.displayName} class="w-full h-full object-cover">
        {#snippet fallback()}
          <span class="font-medium text-[var(--color-text-secondary)]">
            {initials}
          </span>
        {/snippet}
      </AuthImage>
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
