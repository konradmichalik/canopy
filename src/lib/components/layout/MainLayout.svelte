<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import Sidebar from './Sidebar.svelte';
  import SidebarResizer from './SidebarResizer.svelte';
  import TreeView from '../tree/TreeView.svelte';
  import SettingsModal from '../common/SettingsModal.svelte';
  import Avatar from '../common/Avatar.svelte';
  import Logo from '../common/Logo.svelte';
  import HelpModal from '../help/HelpModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { routerState, toggleSidebar, setSidebarWidth } from '../../stores/router.svelte';
  import { connectionState } from '../../stores/connection.svelte';
  import { getQueryById } from '../../stores/jql.svelte';

  const activeQuery = $derived(
    routerState.activeQueryId ? getQueryById(routerState.activeQueryId) : null
  );
  const queryTitle = $derived(activeQuery?.title || null);
</script>

<svelte:head>
  <title>{queryTitle ? `${queryTitle} - Canopy` : 'Canopy'}</title>
</svelte:head>

<div class="h-screen flex flex-col bg-muted/40">
  <!-- Full-Width Header -->
  <header class="h-14 border-b bg-card flex-shrink-0 sticky top-0 z-10">
    <div class="h-full px-4 flex items-center gap-2">
      <!-- Left: Toggle + Breadcrumb -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <Tooltip text={routerState.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
          <Button variant="ghost" size="icon" onclick={toggleSidebar} class="h-8 w-8">
            <AtlaskitIcon
              name="panel-left"
              size={18}
              class="transition-transform duration-200 {routerState.sidebarOpen
                ? ''
                : '-scale-x-100'}"
            />
          </Button>
        </Tooltip>

        <div class="h-4 w-px bg-border"></div>

        <Logo size="sm" showText={true} />

        {#if queryTitle}
          <AtlaskitIcon name="chevron-right" size={14} class="text-muted-foreground" />
          <span class="text-sm font-medium text-foreground truncate max-w-[200px]">
            {queryTitle}
          </span>
        {/if}
      </div>

      <div class="flex-1"></div>

      <!-- Right: User + Settings -->
      <div class="flex items-center gap-2 flex-shrink-0">
        {#if connectionState.currentUser}
          <div class="flex items-center gap-2 px-2">
            <Avatar user={connectionState.currentUser} size="sm" />
            <span class="text-sm text-muted-foreground hidden sm:block">
              {connectionState.currentUser.displayName}
            </span>
          </div>
          <div class="h-4 w-px bg-border"></div>
        {/if}
        <SettingsModal />
      </div>
    </div>
  </header>

  <!-- Content Area: Sidebar + Main -->
  <div class="flex-1 flex min-h-0">
    <!-- Sidebar (hidden via CSS to preserve state) -->
    <div class:hidden={!routerState.sidebarOpen} class="contents">
      <Sidebar width={routerState.sidebarWidth} onClose={toggleSidebar} />
      <SidebarResizer currentWidth={routerState.sidebarWidth} onResize={setSidebarWidth} />
    </div>

    <!-- Main Content -->
    <main
      class="flex-1 overflow-hidden p-4 min-w-0"
      style="background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px); background-size: 16px 16px;"
    >
      {#if routerState.activeQueryId}
        <div class="h-full bg-card rounded-xl border shadow-sm overflow-hidden">
          <TreeView />
        </div>
      {:else}
        <!-- Empty State -->
        <div
          class="h-full bg-card rounded-xl border shadow-sm flex items-center justify-center"
        >
          <div class="text-center max-w-md px-4">
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"
            >
              <AtlaskitIcon name="folder-open" size={32} class="text-muted-foreground" />
            </div>
            <h2 class="text-xl font-semibold text-foreground mb-2">No Query Selected</h2>
            <p class="text-muted-foreground mb-6">
              {#if routerState.sidebarOpen}
                Select a query from the sidebar to view issues, or create a new one.
              {:else}
                Open the sidebar to select or create a query.
              {/if}
            </p>
            {#if !routerState.sidebarOpen}
              <Button onclick={toggleSidebar}>
                <AtlaskitIcon name="panel-left" size={16} />
                Open Sidebar
              </Button>
            {/if}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<HelpModal />
