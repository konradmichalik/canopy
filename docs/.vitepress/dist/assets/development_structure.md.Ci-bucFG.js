import{_ as n,c as a,o as e,ag as p}from"./chunks/framework.BfE-mKMG.js";const d=JSON.parse('{"title":"Project Structure","description":"File and folder organization in Canopy","frontmatter":{"title":"Project Structure","description":"File and folder organization in Canopy"},"headers":[],"relativePath":"development/structure.md","filePath":"development/structure.md","lastUpdated":null}'),l={name:"development/structure.md"};function i(r,s,t,c,o,b){return e(),a("div",null,[...s[0]||(s[0]=[p(`<h1 id="project-structure" tabindex="-1">Project Structure <a class="header-anchor" href="#project-structure" aria-label="Permalink to &quot;Project Structure&quot;">​</a></h1><p>Overview of the codebase organization.</p><h2 id="root-directory" tabindex="-1">Root Directory <a class="header-anchor" href="#root-directory" aria-label="Permalink to &quot;Root Directory&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>jira-hierarchy-viewer/</span></span>
<span class="line"><span>├── src/                  # Application source code</span></span>
<span class="line"><span>├── src-tauri/            # Tauri desktop app (Rust)</span></span>
<span class="line"><span>├── proxy/                # CORS proxy server</span></span>
<span class="line"><span>├── docs/                 # Documentation (VitePress)</span></span>
<span class="line"><span>├── public/               # Static assets</span></span>
<span class="line"><span>├── package.json          # Node.js dependencies</span></span>
<span class="line"><span>├── vite.config.ts        # Vite configuration</span></span>
<span class="line"><span>├── tailwind.config.ts    # Tailwind CSS configuration</span></span>
<span class="line"><span>└── tsconfig.json         # TypeScript configuration</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><h2 id="source-code-src" tabindex="-1">Source Code (<code>src/</code>) <a class="header-anchor" href="#source-code-src" aria-label="Permalink to &quot;Source Code (\`src/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>src/</span></span>
<span class="line"><span>├── lib/</span></span>
<span class="line"><span>│   ├── api/              # Jira API clients</span></span>
<span class="line"><span>│   ├── components/       # Svelte components</span></span>
<span class="line"><span>│   ├── stores/           # State management</span></span>
<span class="line"><span>│   ├── types/            # TypeScript types</span></span>
<span class="line"><span>│   └── utils/            # Utility functions</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── App.svelte            # Root component</span></span>
<span class="line"><span>└── main.ts               # Entry point</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><h2 id="api-layer-src-lib-api" tabindex="-1">API Layer (<code>src/lib/api/</code>) <a class="header-anchor" href="#api-layer-src-lib-api" aria-label="Permalink to &quot;API Layer (\`src/lib/api/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>api/</span></span>
<span class="line"><span>├── JiraClient.ts         # Abstract base class</span></span>
<span class="line"><span>├── JiraCloudClient.ts    # Jira Cloud implementation</span></span>
<span class="line"><span>├── JiraServerClient.ts   # Jira Server implementation</span></span>
<span class="line"><span>└── factory.ts            # Client factory function</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><h2 id="components-src-lib-components" tabindex="-1">Components (<code>src/lib/components/</code>) <a class="header-anchor" href="#components-src-lib-components" aria-label="Permalink to &quot;Components (\`src/lib/components/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>components/</span></span>
<span class="line"><span>├── ui/                   # shadcn-svelte base components</span></span>
<span class="line"><span>│   ├── button/</span></span>
<span class="line"><span>│   ├── input/</span></span>
<span class="line"><span>│   ├── dialog/</span></span>
<span class="line"><span>│   └── ...</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── tree/                 # Tree view components</span></span>
<span class="line"><span>│   ├── TreeView.svelte</span></span>
<span class="line"><span>│   ├── TreeNode.svelte</span></span>
<span class="line"><span>│   └── IssueCard.svelte</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── filters/              # Filter components</span></span>
<span class="line"><span>│   ├── QuickFilters.svelte</span></span>
<span class="line"><span>│   ├── DynamicFilters.svelte</span></span>
<span class="line"><span>│   └── FilterBar.svelte</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── jql/                  # Query management</span></span>
<span class="line"><span>│   ├── QueryList.svelte</span></span>
<span class="line"><span>│   └── QueryEditor.svelte</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── connection/           # Connection form</span></span>
<span class="line"><span>│   └── ConnectionForm.svelte</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>├── layout/               # Layout components</span></span>
<span class="line"><span>│   ├── Header.svelte</span></span>
<span class="line"><span>│   └── Sidebar.svelte</span></span>
<span class="line"><span>│</span></span>
<span class="line"><span>└── screens/              # Full-page screens</span></span>
<span class="line"><span>    ├── ConnectionScreen.svelte</span></span>
<span class="line"><span>    ├── DashboardScreen.svelte</span></span>
<span class="line"><span>    └── TreeScreen.svelte</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br></div></div><h2 id="stores-src-lib-stores" tabindex="-1">Stores (<code>src/lib/stores/</code>) <a class="header-anchor" href="#stores-src-lib-stores" aria-label="Permalink to &quot;Stores (\`src/lib/stores/\`)&quot;">​</a></h2><p>Store files use <code>.svelte.ts</code> extension for Svelte 5 runes:</p><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>stores/</span></span>
<span class="line"><span>├── connection.svelte.ts    # Jira connection state</span></span>
<span class="line"><span>├── issues.svelte.ts        # Loaded issues and tree</span></span>
<span class="line"><span>├── jql.svelte.ts           # Saved queries</span></span>
<span class="line"><span>├── filters.svelte.ts       # Filter states</span></span>
<span class="line"><span>├── router.svelte.ts        # Screen navigation</span></span>
<span class="line"><span>├── theme.svelte.ts         # Light/dark mode</span></span>
<span class="line"><span>├── colorTheme.svelte.ts    # Accent color</span></span>
<span class="line"><span>├── displayDensity.svelte.ts</span></span>
<span class="line"><span>├── fieldConfig.svelte.ts</span></span>
<span class="line"><span>├── sortConfig.svelte.ts</span></span>
<span class="line"><span>├── grouping.svelte.ts</span></span>
<span class="line"><span>├── changeTracking.svelte.ts</span></span>
<span class="line"><span>├── autoRefresh.svelte.ts</span></span>
<span class="line"><span>└── keyboardNavigation.svelte.ts</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br></div></div><h2 id="types-src-lib-types" tabindex="-1">Types (<code>src/lib/types/</code>) <a class="header-anchor" href="#types-src-lib-types" aria-label="Permalink to &quot;Types (\`src/lib/types/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>types/</span></span>
<span class="line"><span>├── index.ts              # Core app types (TreeNode, filters, UI)</span></span>
<span class="line"><span>└── jira.ts               # Jira API response types</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br></div></div><h2 id="utilities-src-lib-utils" tabindex="-1">Utilities (<code>src/lib/utils/</code>) <a class="header-anchor" href="#utilities-src-lib-utils" aria-label="Permalink to &quot;Utilities (\`src/lib/utils/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>utils/</span></span>
<span class="line"><span>├── hierarchy-builder.ts  # Tree construction algorithm</span></span>
<span class="line"><span>├── storage.ts            # localStorage helpers</span></span>
<span class="line"><span>├── logger.ts             # Debug logging</span></span>
<span class="line"><span>└── date.ts               # Date formatting</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><h2 id="desktop-app-src-tauri" tabindex="-1">Desktop App (<code>src-tauri/</code>) <a class="header-anchor" href="#desktop-app-src-tauri" aria-label="Permalink to &quot;Desktop App (\`src-tauri/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>src-tauri/</span></span>
<span class="line"><span>├── src/</span></span>
<span class="line"><span>│   └── lib.rs            # Rust entry point</span></span>
<span class="line"><span>├── capabilities/         # Permission definitions</span></span>
<span class="line"><span>├── icons/                # App icons</span></span>
<span class="line"><span>├── tauri.conf.json       # Tauri configuration</span></span>
<span class="line"><span>└── Cargo.toml            # Rust dependencies</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br></div></div><h2 id="documentation-docs" tabindex="-1">Documentation (<code>docs/</code>) <a class="header-anchor" href="#documentation-docs" aria-label="Permalink to &quot;Documentation (\`docs/\`)&quot;">​</a></h2><div class="language- vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>docs/</span></span>
<span class="line"><span>├── .vitepress/</span></span>
<span class="line"><span>│   └── config.ts         # VitePress configuration</span></span>
<span class="line"><span>├── getting-started/      # Getting started guides</span></span>
<span class="line"><span>├── guide/                # Feature documentation</span></span>
<span class="line"><span>├── desktop/              # Desktop app docs</span></span>
<span class="line"><span>├── reference/            # Reference material</span></span>
<span class="line"><span>├── development/          # Developer docs</span></span>
<span class="line"><span>├── images/               # Screenshots and logo</span></span>
<span class="line"><span>├── public/               # Static assets</span></span>
<span class="line"><span>└── index.md              # Landing page</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br></div></div>`,21)])])}const m=n(l,[["render",i]]);export{d as __pageData,m as default};
