<script lang="ts">
  import ConnectionForm from '../connection/ConnectionForm.svelte';
  import SettingsDropdown from '../common/SettingsDropdown.svelte';
  import Logo from '../common/Logo.svelte';
</script>

<div class="min-h-screen bg-surface">
  <!-- Header -->
  <header class="border-b border-border bg-surface-raised">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <Logo size="md" />
      <SettingsDropdown minimal />
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-5xl mx-auto px-4 py-8">
    <!-- Connection Form -->
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text mb-2">Connect to Jira</h2>
        <p class="text-text-subtle">Enter your Jira credentials to get started</p>
      </div>

      <div class="bg-surface-raised border border-border rounded-xl p-6">
        <ConnectionForm />
      </div>
    </div>
  </main>
</div>
