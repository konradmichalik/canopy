<script lang="ts">
  import ConnectionForm from '../connection/ConnectionForm.svelte';
  import SettingsModal from '../common/SettingsModal.svelte';
  import Logo from '../common/Logo.svelte';
  import HelpModal from '../help/HelpModal.svelte';
  import Avatar from '../common/Avatar.svelte';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { openHelpModal } from '../../stores/helpModal.svelte';
  import {
    connectionRegistry,
    removeConnection,
    reconnectConnection
  } from '../../stores/connection.svelte';
  import { jqlState } from '../../stores/jql.svelte';
  import type { StoredConnection } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';

  interface Props {
    /** If provided, shows a "Back to Dashboard" button */
    onBack?: () => void;
  }

  let { onBack }: Props = $props();

  let showAddForm = $state(false);
  let editingConnection = $state<StoredConnection | undefined>(undefined);
  let confirmingDelete = $state<string | null>(null);

  const hasConnectedInstance = $derived(
    connectionRegistry.connections.some((c) => c.status === 'connected')
  );

  function handleFormDone() {
    showAddForm = false;
    editingConnection = undefined;
  }

  function startEdit(config: StoredConnection) {
    editingConnection = config;
    showAddForm = false;
  }

  function startAdd() {
    showAddForm = true;
    editingConnection = undefined;
  }

  function cancelForm() {
    showAddForm = false;
    editingConnection = undefined;
  }

  async function handleDelete(connectionId: string) {
    await removeConnection(connectionId);
    confirmingDelete = null;
  }

  function getColorClasses(color?: string): string {
    const found = QUERY_COLORS.find((c) => c.id === color);
    return found ? found.bg : 'bg-muted';
  }
</script>

<div class="min-h-screen bg-muted/40 flex flex-col">
  <!-- Header -->
  <header class="border-b border-border bg-background">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <Logo size="md" />
      <div class="flex items-center gap-2">
        <Tooltip text="Help">
          <Button variant="ghost" size="icon" onclick={openHelpModal} class="h-8 w-8">
            <AtlaskitIcon name="question-circle" size={18} />
          </Button>
        </Tooltip>
        <SettingsModal minimal />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex items-start justify-center p-4 pt-8">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-2">Jira Connections</h2>
        <p class="text-muted-foreground">
          {#if connectionRegistry.connections.length === 0}
            Add a Jira connection to get started
          {:else}
            Manage your Jira connections
          {/if}
        </p>
      </div>

      <!-- Existing Connections -->
      {#if connectionRegistry.connections.length > 0}
        <div class="space-y-3 mb-6">
          {#each connectionRegistry.connections as conn (conn.id)}
            <div class="bg-background border border-border rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-3">
                <!-- Color dot -->
                <div
                  class="w-3 h-3 rounded-full shrink-0 {getColorClasses(conn.config.color)}"
                ></div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-foreground truncate">{conn.config.label}</span>
                    <span
                      class="text-xs px-1.5 py-0.5 rounded-full {conn.status === 'connected'
                        ? 'bg-success-subtlest text-text-success'
                        : conn.status === 'connecting'
                          ? 'bg-warning-subtlest text-text-warning'
                          : conn.status === 'error'
                            ? 'bg-danger-subtlest text-text-danger'
                            : 'bg-muted text-muted-foreground'}"
                    >
                      {conn.status === 'connected'
                        ? 'Connected'
                        : conn.status === 'connecting'
                          ? 'Connecting...'
                          : conn.status === 'error'
                            ? 'Error'
                            : 'Disconnected'}
                    </span>
                  </div>
                  <div class="text-xs text-muted-foreground truncate mt-0.5">
                    {conn.config.baseUrl}
                    <span class="text-text-subtle">
                      ({conn.config.instanceType === 'cloud' ? 'Cloud' : 'Server'})
                    </span>
                  </div>
                  {#if conn.currentUser}
                    <div class="flex items-center gap-1.5 mt-1.5">
                      <Avatar user={conn.currentUser} size="sm" />
                      <span class="text-xs text-muted-foreground"
                        >{conn.currentUser.displayName}</span
                      >
                    </div>
                  {/if}
                  {#if conn.error}
                    <p class="text-xs text-text-danger mt-1">{conn.error}</p>
                  {/if}
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  {#if conn.status === 'error'}
                    <Tooltip text="Reconnect">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-7 w-7"
                        onclick={() => reconnectConnection(conn.id)}
                      >
                        <AtlaskitIcon name="refresh" size={14} />
                      </Button>
                    </Tooltip>
                  {/if}
                  <Tooltip text="Edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7"
                      onclick={() => startEdit(conn.config)}
                    >
                      <AtlaskitIcon name="edit" size={14} />
                    </Button>
                  </Tooltip>
                  <Tooltip text="Remove">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-text-danger hover:bg-danger-subtlest"
                      onclick={() => (confirmingDelete = conn.id)}
                    >
                      <AtlaskitIcon name="delete" size={14} />
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <!-- Delete Confirmation -->
              {#if confirmingDelete === conn.id}
                {@const itemCount = jqlState.items.filter(
                  (i) => (i as { connectionId?: string }).connectionId === conn.id
                ).length}
                <div class="mt-3 p-3 bg-danger-subtlest border border-border-danger rounded-lg">
                  <p class="text-sm text-text-danger font-medium">Remove this connection?</p>
                  {#if itemCount > 0}
                    <p class="text-xs text-text-danger mt-1">
                      This will also delete {itemCount} saved {itemCount === 1
                        ? 'query'
                        : 'queries and separators'}.
                    </p>
                  {/if}
                  <div class="flex gap-2 mt-2">
                    <Button size="sm" variant="destructive" onclick={() => handleDelete(conn.id)}>
                      Remove
                    </Button>
                    <Button size="sm" variant="ghost" onclick={() => (confirmingDelete = null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <!-- Add / Edit Form -->
      {#if showAddForm || editingConnection}
        <div class="bg-background border border-border rounded-xl p-6 shadow-sm mb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-foreground">
              {editingConnection ? 'Edit Connection' : 'Add Connection'}
            </h3>
            <Button variant="ghost" size="icon" class="h-7 w-7" onclick={cancelForm}>
              <AtlaskitIcon name="cross" size={14} />
            </Button>
          </div>
          <ConnectionForm {editingConnection} onConnected={handleFormDone} />
        </div>
      {:else}
        <Button variant="outline" class="w-full" onclick={startAdd}>
          <AtlaskitIcon name="add" size={16} />
          Add Connection
        </Button>
      {/if}

      <!-- Back to Dashboard -->
      {#if hasConnectedInstance && !showAddForm && !editingConnection && onBack}
        <div class="mt-6">
          <Button class="w-full" onclick={onBack}>
            <AtlaskitIcon name="chevron-left" size={16} />
            Back to Dashboard
          </Button>
        </div>
      {/if}
    </div>
  </main>
</div>

<HelpModal />
