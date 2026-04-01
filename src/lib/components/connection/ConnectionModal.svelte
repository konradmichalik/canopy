<script lang="ts">
  import ConnectionForm from './ConnectionForm.svelte';
  import Avatar from '../common/Avatar.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import {
    connectionRegistry,
    removeConnection,
    reconnectConnection
  } from '../../stores/connection.svelte';
  import { jqlState } from '../../stores/jql.svelte';
  import type { StoredConnection } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';

  interface Props {
    open: boolean;
    /** If true, the modal cannot be dismissed (no connections yet) */
    required?: boolean;
  }

  let { open = $bindable(), required = false }: Props = $props();

  let showAddForm = $state(false);
  let editingConnection = $state<StoredConnection | undefined>(undefined);
  let confirmingDelete = $state<string | null>(null);

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

<Dialog.Root
  bind:open
  onOpenChange={(v) => {
    if (!v && required) open = true;
  }}
>
  <Dialog.Content
    class="max-w-lg max-h-[85vh] overflow-y-auto p-6"
    onInteractOutside={(e) => required && e.preventDefault()}
    onEscapeKeydown={(e) => required && e.preventDefault()}
  >
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-foreground">
          {#if connectionRegistry.connections.length === 0}
            Connect to Jira
          {:else}
            Manage Connections
          {/if}
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          {#if connectionRegistry.connections.length === 0}
            Add a Jira connection to get started
          {:else}
            Add, edit, or remove Jira connections
          {/if}
        </p>
      </div>
      {#if !required}
        <Dialog.Close />
      {/if}
    </div>

    <!-- Existing Connections -->
    {#if connectionRegistry.connections.length > 0}
      <div class="space-y-3 mb-4">
        {#each connectionRegistry.connections as conn (conn.id)}
          <div class="border border-border rounded-lg p-3">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full shrink-0 {getColorClasses(conn.config.color)}"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-foreground truncate text-sm"
                    >{conn.config.label}</span
                  >
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full {conn.status === 'connected'
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
                  <div class="flex items-center gap-1.5 mt-1">
                    <Avatar user={conn.currentUser} size="sm" />
                    <span class="text-xs text-muted-foreground">{conn.currentUser.displayName}</span
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
      <div class="border border-border rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-foreground text-sm">
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
  </Dialog.Content>
</Dialog.Root>
