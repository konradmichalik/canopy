import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Canopy',
  description: 'Hierarchical Jira Issue Viewer - Display tickets in a tree structure',

  base: '/canopy/',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/canopy/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#1868db' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Canopy Documentation' }],
    ['meta', { property: 'og:description', content: 'Hierarchical Jira Issue Viewer' }],
    ['meta', { property: 'og:image', content: '/canopy/images/jira-hierarchy-tree-demo.jpg' }]
  ],

  markdown: {
    lineNumbers: true
  },

  themeConfig: {
    logo: {
      light: '/logo.svg',
      dark: '/logo-dark.svg'
    },
    siteTitle: false,

    nav: [
      { text: 'Guide', link: '/getting-started/' },
      { text: 'Features', link: '/guide/' },
      { text: 'macOS App', link: '/desktop/' },
      { text: 'Reference', link: '/reference/keyboard' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/konradmichalik/canopy' },
          { text: 'Report Issue', link: 'https://github.com/konradmichalik/canopy/issues' }
        ]
      }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start', link: '/getting-started/quick-start' }
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Overview', link: '/guide/' },
            { text: 'Tree View', link: '/guide/tree-view' },
            { text: 'Filtering', link: '/guide/filtering' },
            { text: 'Grouping', link: '/guide/grouping' },
            { text: 'Query Management', link: '/guide/queries' },
            { text: 'Change Tracking', link: '/guide/change-tracking' },
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        }
      ],
      '/desktop/': [
        {
          text: 'macOS App',
          items: [
            { text: 'Overview', link: '/desktop/' },
            { text: 'Installation', link: '/desktop/installation' },
            { text: 'Building', link: '/desktop/building' },
            { text: 'Web vs Desktop', link: '/desktop/differences' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Keyboard Shortcuts', link: '/reference/keyboard' },
            { text: 'Data Storage', link: '/reference/storage' },
            { text: 'Troubleshooting', link: '/reference/troubleshooting' }
          ]
        }
      ],
      '/development/': [
        {
          text: 'Development',
          items: [
            { text: 'Architecture', link: '/development/' },
            { text: 'Project Structure', link: '/development/structure' },
            { text: 'State Management', link: '/development/state' },
            { text: 'API Layer', link: '/development/api' },
            { text: 'Contributing', link: '/development/contributing' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/konradmichalik/canopy' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/konradmichalik/canopy/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next'
    }
  },

  srcExclude: [
    'canopy-feature-roadmap.md',
    'change-tracking-improvements.md',
    'INSTALLATION.md',
    'CONFIGURATION.md',
    'FEATURES.md',
    'DEVELOPMENT.md',
    'DESKTOP-APP.md'
  ]
})
