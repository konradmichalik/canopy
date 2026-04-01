<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { ConnectionFormData, StoredConnection } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import {
    addConnection,
    updateConnection,
    connectionRegistry
  } from '../../stores/connection.svelte';
  import { detectInstanceType } from '../../api';
  import { isTauri, deriveLabelFromUrl } from '../../utils/storage';

  interface Props {
    onConnected?: () => void;
    /** If provided, the form is in edit mode */
    editingConnection?: StoredConnection;
    /** Compact layout for inline use (e.g. Settings tab) */
    compact?: boolean;
  }

  let { onConnected, editingConnection, compact = false }: Props = $props();

  const isEditMode = $derived(!!editingConnection);

  // Pre-fill proxy URL based on environment (empty for Tauri desktop)
  const defaultProxyUrl = isTauri() ? '' : __DEFAULT_PROXY_URL__;

  // Derive initial form values from editing connection
  function getInitialFormData(): ConnectionFormData {
    if (editingConnection) {
      const creds = editingConnection.credentials;
      return {
        instanceType: editingConnection.instanceType,
        baseUrl: editingConnection.baseUrl,
        label: editingConnection.label,
        color: editingConnection.color,
        email: creds.type === 'cloud' ? creds.email : '',
        apiToken: creds.type === 'cloud' ? creds.apiToken : '',
        username:
          creds.type === 'server' && creds.authMethod === 'basic' ? (creds.username ?? '') : '',
        password:
          creds.type === 'server' && creds.authMethod === 'basic' ? (creds.password ?? '') : '',
        personalAccessToken:
          creds.type === 'server' && creds.authMethod === 'pat'
            ? (creds.personalAccessToken ?? '')
            : '',
        authMethod: creds.type === 'server' ? creds.authMethod : 'pat',
        proxyUrl: editingConnection.proxyUrl ?? defaultProxyUrl
      };
    }
    return {
      instanceType: 'cloud',
      baseUrl: '',
      label: '',
      email: '',
      apiToken: '',
      username: '',
      password: '',
      personalAccessToken: '',
      authMethod: 'pat',
      proxyUrl: defaultProxyUrl
    };
  }

  // Form state
  let formData = $state<ConnectionFormData>(getInitialFormData());

  let showProxyInput = $state(!!formData.proxyUrl);
  let isSubmitting = $state(false);
  let formError = $state<string | null>(null);

  // Auto-detect instance type from URL
  function handleUrlChange(): void {
    const detected = detectInstanceType(formData.baseUrl);
    if (detected) {
      formData.instanceType = detected;
    }
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    formError = null;
    isSubmitting = true;

    try {
      const config = buildStoredConfig();

      if (isEditMode && editingConnection) {
        // Update existing connection
        await updateConnection(editingConnection.id, config);
        const updated = connectionRegistry.connections.find((c) => c.id === editingConnection.id);
        if (updated?.status === 'error') {
          formError = updated.error || 'Connection failed';
          return;
        }
        onConnected?.();
      } else {
        // Add new connection (returns ID after connect attempt)
        const newId = await addConnection(config);
        const newConn = connectionRegistry.connections.find((c) => c.id === newId);
        if (newConn?.status === 'error') {
          formError = newConn.error || 'Connection failed';
        } else {
          onConnected?.();
        }
      }
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Connection failed';
    } finally {
      isSubmitting = false;
    }
  }

  function buildStoredConfig(): StoredConnection {
    const baseUrl = formData.baseUrl.trim().replace(/\/$/, '');
    const label = formData.label.trim() || deriveLabelFromUrl(baseUrl);

    const base = {
      id: editingConnection?.id ?? crypto.randomUUID(),
      label,
      baseUrl,
      proxyUrl: formData.proxyUrl || undefined,
      color: formData.color
    };

    if (formData.instanceType === 'cloud') {
      return {
        ...base,
        instanceType: 'cloud' as const,
        credentials: {
          type: 'cloud' as const,
          email: formData.email,
          apiToken: formData.apiToken
        }
      };
    }

    return {
      ...base,
      instanceType: 'server' as const,
      credentials: {
        type: 'server' as const,
        authMethod: formData.authMethod,
        username: formData.authMethod === 'basic' ? formData.username : undefined,
        password: formData.authMethod === 'basic' ? formData.password : undefined,
        personalAccessToken:
          formData.authMethod === 'pat' ? formData.personalAccessToken : undefined
      }
    };
  }

  const isCloud = $derived(formData.instanceType === 'cloud');
  const isBasicAuth = $derived(formData.authMethod === 'basic');

  // Warn if localhost is entered in JIRA URL field (should be in proxy field)
  const isLocalhostInBaseUrl = $derived(
    formData.baseUrl.includes('localhost') || formData.baseUrl.includes('127.0.0.1')
  );
</script>

<form onsubmit={handleSubmit} class={compact ? 'space-y-3' : 'space-y-6'}>
  <!-- Connection Label -->
  <div class="space-y-2">
    <Label for="label">Connection Name</Label>
    <Input
      id="label"
      type="text"
      bind:value={formData.label}
      placeholder="e.g. Cloud Production, Server Legacy"
      autocomplete="off"
    />
    <p class="text-xs text-muted-foreground">Optional. Auto-derived from URL if empty.</p>
  </div>

  <!-- Connection Color -->
  <div class="space-y-2">
    <Label>Color</Label>
    <div class="flex gap-2 flex-wrap">
      {#each QUERY_COLORS as colorOption (colorOption.id)}
        <button
          type="button"
          class="w-6 h-6 rounded-full border-2 transition-all {colorOption.bg} {formData.color ===
          colorOption.id
            ? 'border-foreground scale-110'
            : 'border-transparent opacity-70 hover:opacity-100'}"
          title={colorOption.label}
          onclick={() =>
            (formData.color = formData.color === colorOption.id ? undefined : colorOption.id)}
        ></button>
      {/each}
    </div>
  </div>

  <!-- Instance Type -->
  <fieldset>
    <legend class="block text-sm font-medium text-text mb-2"> Jira Instance Type </legend>
    <div class="flex gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="instanceType"
          value="cloud"
          bind:group={formData.instanceType}
          class="text-brand focus:ring-border-focused"
        />
        <span class="text-sm text-text">Cloud</span>
        <span class="text-xs text-text-subtle">(*.atlassian.net)</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="instanceType"
          value="server"
          bind:group={formData.instanceType}
          class="text-brand focus:ring-border-focused"
        />
        <span class="text-sm text-text">Server / Data Center</span>
      </label>
    </div>
  </fieldset>

  <!-- Base URL -->
  <div class="space-y-2">
    <Label for="baseUrl">Jira URL</Label>
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <AtlaskitIcon name="link" size={16} />
      </span>
      <Input
        id="baseUrl"
        type="url"
        bind:value={formData.baseUrl}
        oninput={handleUrlChange}
        placeholder={isCloud
          ? 'https://your-domain.atlassian.net'
          : 'https://jira.your-company.com'}
        required
        autocomplete="url"
        class="pl-10 {isLocalhostInBaseUrl ? 'border-warning focus-visible:ring-warning' : ''}"
      />
    </div>
    {#if isLocalhostInBaseUrl}
      <p class="text-xs text-text-warning">
        This looks like a proxy URL. Enter your actual Jira URL here (e.g.
        https://your-domain.atlassian.net) and put the proxy URL in "Advanced: CORS Proxy" below.
      </p>
    {/if}
  </div>

  <!-- Cloud Credentials -->
  {#if isCloud}
    <div class="space-y-2">
      <Label for="email">Email</Label>
      <Input
        id="email"
        type="email"
        bind:value={formData.email}
        placeholder="your-email@company.com"
        required
        autocomplete="email"
      />
    </div>

    <div class="space-y-2">
      <Label for="apiToken">
        API Token
        <a
          href="https://id.atlassian.com/manage-profile/security/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-primary hover:underline"
        >
          Create token
        </a>
      </Label>
      <Input
        id="apiToken"
        type="password"
        bind:value={formData.apiToken}
        placeholder="Your API token"
        required
        autocomplete="current-password"
      />
    </div>
  {:else}
    <!-- Server Credentials -->
    <fieldset>
      <legend class="block text-sm font-medium text-text mb-2"> Authentication Method </legend>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="authMethod"
            value="pat"
            bind:group={formData.authMethod}
            class="text-brand focus:ring-border-focused"
          />
          <span class="text-sm text-text">Personal Access Token</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="authMethod"
            value="basic"
            bind:group={formData.authMethod}
            class="text-brand focus:ring-border-focused"
          />
          <span class="text-sm text-text">Basic Auth</span>
        </label>
      </div>
    </fieldset>

    {#if isBasicAuth}
      <div class="space-y-2">
        <Label for="username">Username</Label>
        <Input
          id="username"
          type="text"
          bind:value={formData.username}
          placeholder="Your Jira username"
          required
          autocomplete="username"
        />
      </div>

      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          type="password"
          bind:value={formData.password}
          placeholder="Your password"
          required
          autocomplete="current-password"
        />
      </div>
    {:else}
      <div class="space-y-2">
        <Label for="pat">Personal Access Token</Label>
        <Input
          id="pat"
          type="password"
          bind:value={formData.personalAccessToken}
          placeholder="Your personal access token"
          required
          autocomplete="current-password"
        />
      </div>
    {/if}
  {/if}

  <!-- Proxy URL (Advanced) -->
  <div>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onclick={() => (showProxyInput = !showProxyInput)}
      class="text-muted-foreground hover:text-foreground px-0"
    >
      <span class="text-xs">{showProxyInput ? '▼' : '▶'}</span>
      Advanced: CORS Proxy
    </Button>

    {#if showProxyInput}
      <div class="mt-2 space-y-2">
        <Input
          type="text"
          bind:value={formData.proxyUrl}
          placeholder="/api/jira or http://localhost:3001/jira"
        />
        <p class="text-xs text-muted-foreground">
          Use <code class="bg-muted px-1 rounded">/api/jira</code> for Vercel deployment, or run the
          local proxy and use <code class="bg-muted px-1 rounded">http://localhost:3001/jira</code>.
        </p>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if formError}
    <div class="p-3 bg-danger-subtlest border border-border-danger rounded-lg">
      <p class="text-sm text-text-danger">{formError}</p>
    </div>
  {/if}

  <!-- Submit Button -->
  <Button type="submit" disabled={isSubmitting} class="w-full">
    {#if isSubmitting}
      <AtlaskitIcon name="refresh" size={16} class="animate-spin" />
      {isEditMode ? 'Saving...' : 'Connecting...'}
    {:else}
      <AtlaskitIcon name="flask" size={16} />
      {isEditMode ? 'Save & Reconnect' : 'Connect'}
    {/if}
  </Button>

  {#if !compact}
    <!-- Privacy Info -->
    <div class="p-3 bg-information-subtlest border border-border-information rounded-lg">
      <div class="flex gap-2">
        <AtlaskitIcon
          name="status-information"
          size={16}
          class="text-icon-information shrink-0 mt-0.5"
        />
        <div class="text-xs text-text-subtle">
          <p class="font-medium text-text-subtle">Your data stays local</p>
          <p class="mt-1">
            All credentials and settings are stored only in your browser's local storage. No data is
            sent to any server except your Jira instance.
          </p>
        </div>
      </div>
    </div>
  {/if}
</form>
