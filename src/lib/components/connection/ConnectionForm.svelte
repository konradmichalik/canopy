<script lang="ts">
  import { Loader2, Link, TestTube2 } from 'lucide-svelte';
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
        personalAccessToken: formData.authMethod === 'pat' ? formData.personalAccessToken : undefined
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
  <div>
    <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
      JIRA Instance Type
    </label>
    <div class="flex gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="instanceType"
          value="cloud"
          bind:group={formData.instanceType}
          class="text-jira-blue focus:ring-jira-blue"
        />
        <span class="text-sm text-[var(--color-text-primary)]">Cloud</span>
        <span class="text-xs text-[var(--color-text-secondary)]">(*.atlassian.net)</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="instanceType"
          value="server"
          bind:group={formData.instanceType}
          class="text-jira-blue focus:ring-jira-blue"
        />
        <span class="text-sm text-[var(--color-text-primary)]">Server / Data Center</span>
      </label>
    </div>
  </div>

  <!-- Base URL -->
  <div>
    <label for="baseUrl" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
      JIRA URL
    </label>
    <div class="relative">
      <Link class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
      <input
        id="baseUrl"
        type="url"
        bind:value={formData.baseUrl}
        oninput={handleUrlChange}
        placeholder={isCloud ? 'https://your-domain.atlassian.net' : 'https://jira.your-company.com'}
        required
        autocomplete="url"
        class="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent
          {isLocalhostInBaseUrl ? 'border-amber-500 focus:ring-amber-500' : ''}"
      />
    </div>
    {#if isLocalhostInBaseUrl}
      <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
        ⚠️ This looks like a proxy URL. Enter your actual JIRA URL here (e.g. https://your-domain.atlassian.net) and put the proxy URL in "Advanced: CORS Proxy" below.
      </p>
    {/if}
  </div>

  <!-- Cloud Credentials -->
  {#if isCloud}
    <div>
      <label for="email" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        Email
      </label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        placeholder="your-email@company.com"
        required
        autocomplete="email"
        class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
      />
    </div>

    <div>
      <label for="apiToken" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        API Token
        <a
          href="https://id.atlassian.com/manage-profile/security/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-2 text-xs text-jira-blue hover:underline"
        >
          Create token
        </a>
      </label>
      <input
        id="apiToken"
        type="password"
        bind:value={formData.apiToken}
        placeholder="Your API token"
        required
        autocomplete="current-password"
        class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
      />
    </div>
  {:else}
    <!-- Server Credentials -->
    <div>
      <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        Authentication Method
      </label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="authMethod"
            value="pat"
            bind:group={formData.authMethod}
            class="text-jira-blue focus:ring-jira-blue"
          />
          <span class="text-sm text-[var(--color-text-primary)]">Personal Access Token</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="authMethod"
            value="basic"
            bind:group={formData.authMethod}
            class="text-jira-blue focus:ring-jira-blue"
          />
          <span class="text-sm text-[var(--color-text-primary)]">Basic Auth</span>
        </label>
      </div>
    </div>

    {#if isBasicAuth}
      <div>
        <label for="username" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          bind:value={formData.username}
          placeholder="Your JIRA username"
          required
          autocomplete="username"
          class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          placeholder="Your password"
          required
          autocomplete="current-password"
          class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
        />
      </div>
    {:else}
      <div>
        <label for="pat" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Personal Access Token
        </label>
        <input
          id="pat"
          type="password"
          bind:value={formData.personalAccessToken}
          placeholder="Your personal access token"
          required
          autocomplete="current-password"
          class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent"
        />
      </div>
    {/if}
  {/if}

  <!-- Proxy URL (Advanced) -->
  <div>
    <button
      type="button"
      onclick={() => (showProxyInput = !showProxyInput)}
      class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
    >
      <span class="text-xs">{showProxyInput ? '▼' : '▶'}</span>
      Advanced: CORS Proxy
    </button>

    {#if showProxyInput}
      <div class="mt-2">
        <input
          type="url"
          bind:value={formData.proxyUrl}
          placeholder="http://localhost:3001/jira (optional)"
          class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent text-sm"
        />
        <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
          If you're having CORS issues, run the included proxy server and enter its URL here.
        </p>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if formError}
    <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-sm text-red-600 dark:text-red-400">{formError}</p>
    </div>
  {/if}

  <!-- Submit Button -->
  <button
    type="submit"
    disabled={isSubmitting}
    class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-jira-blue text-white rounded-lg font-medium hover:bg-jira-blue/90 focus:outline-none focus:ring-2 focus:ring-jira-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {#if isSubmitting}
      <Loader2 class="w-4 h-4 animate-spin" />
      Connecting...
    {:else}
      <TestTube2 class="w-4 h-4" />
      Connect
    {/if}
  </button>
</form>
