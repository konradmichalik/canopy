<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { JiraInstanceType, ConnectionFormData } from '../../types';
  import { connect, connectionState } from '../../stores/connection.svelte';
  import { detectInstanceType } from '../../api';

  interface Props {
    onConnected?: () => void;
  }

  let { onConnected }: Props = $props();

  // Form state
  let formData = $state<ConnectionFormData>({
    instanceType: 'cloud',
    baseUrl: '',
    email: '',
    apiToken: '',
    username: '',
    password: '',
    personalAccessToken: '',
    authMethod: 'pat',
    proxyUrl: ''
  });

  let showProxyInput = $state(false);
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
      const config = buildConfig();
      const success = await connect(config);

      if (success) {
        onConnected?.();
      } else {
        formError = connectionState.error || 'Connection failed';
      }
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Connection failed';
    } finally {
      isSubmitting = false;
    }
  }

  function buildConfig() {
    const baseUrl = formData.baseUrl.replace(/\/$/, ''); // Remove trailing slash

    if (formData.instanceType === 'cloud') {
      return {
        instanceType: 'cloud' as const,
        baseUrl,
        credentials: {
          type: 'cloud' as const,
          email: formData.email,
          apiToken: formData.apiToken
        },
        proxyUrl: formData.proxyUrl || undefined
      };
    }

    return {
      instanceType: 'server' as const,
      baseUrl,
      credentials: {
        type: 'server' as const,
        authMethod: formData.authMethod,
        username: formData.authMethod === 'basic' ? formData.username : undefined,
        password: formData.authMethod === 'basic' ? formData.password : undefined,
        personalAccessToken:
          formData.authMethod === 'pat' ? formData.personalAccessToken : undefined
      },
      proxyUrl: formData.proxyUrl || undefined
    };
  }

  const isCloud = $derived(formData.instanceType === 'cloud');
  const isBasicAuth = $derived(formData.authMethod === 'basic');

  // Warn if localhost is entered in JIRA URL field (should be in proxy field)
  const isLocalhostInBaseUrl = $derived(
    formData.baseUrl.includes('localhost') || formData.baseUrl.includes('127.0.0.1')
  );
</script>

<form onsubmit={handleSubmit} class="space-y-6">
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
          type="url"
          bind:value={formData.proxyUrl}
          placeholder="http://localhost:3001/jira (optional)"
        />
        <p class="text-xs text-muted-foreground">
          If you're having CORS issues, run the included proxy server and enter its URL here.
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
      Connecting...
    {:else}
      <AtlaskitIcon name="flask" size={16} />
      Connect
    {/if}
  </Button>
</form>
