<script lang="ts">
  import type { JiraUser } from '../../types';

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
</script>

{#if user}
  <div
    class="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden flex-shrink-0 {sizeClasses[size]}"
    title={user.displayName}
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
{:else}
  <div
    class="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] flex-shrink-0 {sizeClasses[size]}"
    title="Unassigned"
  >
    <span class="text-[var(--color-text-secondary)]">-</span>
  </div>
{/if}
