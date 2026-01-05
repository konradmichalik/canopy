<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Sidebar from './Sidebar.svelte';
  import SidebarResizer from './SidebarResizer.svelte';
  import TreeView from '../tree/TreeView.svelte';
  import SettingsDropdown from '../common/SettingsDropdown.svelte';
  import Avatar from '../common/Avatar.svelte';
  import Logo from '../common/Logo.svelte';
  import { routerState, toggleSidebar, setSidebarWidth } from '../../stores/router.svelte';
  import { connectionState } from '../../stores/connection.svelte';
  import { getQueryById } from '../../stores/jql.svelte';
  import { QUERY_COLORS } from '../../types/tree';

  const activeQuery = $derived(
    routerState.activeQueryId ? getQueryById(routerState.activeQueryId) : null
  );
  const queryTitle = $derived(activeQuery?.title || null);
  const colorClass = $derived(
    activeQuery?.color ? QUERY_COLORS.find((c) => c.id === activeQuery.color)?.bg : null
  );
</script>

<div class="h-screen flex bg-surface overflow-hidden">
  <!-- Sidebar -->
  {#if routerState.sidebarOpen}
    <Sidebar width={routerState.sidebarWidth} onClose={toggleSidebar} />
    <SidebarResizer currentWidth={routerState.sidebarWidth} onResize={setSidebarWidth} />
  {/if}

  <!-- Main Content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Header -->
    <header class="h-14 border-b border-border-bold bg-surface-raised flex-shrink-0 shadow-sm">
      <div class="h-full px-4 flex items-center">
        <!-- Left: Toggle + Logo + App Name -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <button
            onclick={toggleSidebar}
            class="p-2 rounded-lg hover:bg-surface-hovered text-text-subtle transition-colors"
            title={routerState.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <AtlaskitIcon
              name="panel-left"
              size={20}
              class="transition-transform duration-200 {routerState.sidebarOpen ? '' : '-scale-x-100'}"
            />
          </button>
          <div class="h-6 w-px bg-border"></div>
          <Logo size="sm" showText={true} />
        </div>

        <!-- Center: Query Name -->
        <div class="flex-1 flex items-center justify-center min-w-0 px-4">
          {#if queryTitle}
            <div class="flex items-center gap-2 max-w-md">
              {#if colorClass}
                <span class="w-3 h-3 rounded-full flex-shrink-0 {colorClass}"></span>
              {/if}
              <span class="text-base font-medium text-text truncate">
                {queryTitle}
              </span>
            </div>
          {/if}
        </div>

        <!-- Right: User + Settings -->
        <div class="flex items-center gap-2 flex-shrink-0">
          {#if connectionState.currentUser}
            <div class="flex items-center gap-2">
              <Avatar user={connectionState.currentUser} size="md" />
              <span class="text-sm text-text-subtle hidden sm:block">
                {connectionState.currentUser.displayName}
              </span>
            </div>
            <div class="h-6 w-px bg-border mx-1"></div>
          {/if}
          <SettingsDropdown />
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden bg-surface-sunken">
      {#if routerState.activeQueryId}
        <TreeView />
      {:else}
        <!-- Empty State -->
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center max-w-md px-4">
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-hovered flex items-center justify-center"
            >
              <AtlaskitIcon name="folder-open" size={32} color="var(--color-text-subtle)" />
            </div>
            <h2 class="text-xl font-semibold text-text mb-2">No Query Selected</h2>
            <p class="text-text-subtle">
              {#if routerState.sidebarOpen}
                Select a query from the sidebar to view issues, or create a new one.
              {:else}
                Open the sidebar to select or create a query.
              {/if}
            </p>
            {#if !routerState.sidebarOpen}
              <button
                onclick={toggleSidebar}
                class="mt-4 px-4 py-2 bg-brand text-text-inverse rounded-lg font-medium hover:bg-brand-hovered transition-colors"
              >
                Open Sidebar
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>
