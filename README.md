# JIRA Tree Viewer

Eine Web-Anwendung zur hierarchischen Darstellung von JIRA-Tickets in einer Baumstruktur (Epic -> Story -> Task).

## Features

- **Hierarchische Baumansicht**: Tickets mit korrekten Parent-Child-Beziehungen anzeigen
- **Mehrere JQL-Abfragen**: Speichern und Verwalten mehrerer JQL-Abfragen
- **Schnellfilter**: "Assigned to me" und "Unresolved" Filter
- **Dark Mode**: Unterstützung für helles und dunkles Theme
- **JIRA Cloud & Server**: Unterstützung für JIRA Cloud und Server/Data Center
- **Local Storage**: Verbindungseinstellungen und Abfragen werden im Browser gespeichert

## Erste Schritte

### Voraussetzungen

- Node.js 18+
- npm oder yarn

### Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## CORS Proxy

Aufgrund von Browser-CORS-Einschränkungen kann es erforderlich sein, einen Proxy-Server zu betreiben.

### Enthaltenen Proxy verwenden

```bash
cd proxy
npm install
export JIRA_BASE_URL=https://your-domain.atlassian.net
npm start
```

Konfigurieren Sie dann die App, um `http://localhost:3001/jira` als Proxy-URL zu verwenden.

## Konfiguration

### JIRA Cloud

1. Gehen Sie zu https://id.atlassian.com/manage-profile/security/api-tokens
2. Erstellen Sie ein API-Token
3. Geben Sie Ihre JIRA Cloud URL ein (z.B. `https://your-domain.atlassian.net`)
4. Geben Sie Ihre E-Mail und das API-Token ein

### JIRA Server/Data Center

1. Erstellen Sie ein Personal Access Token in den JIRA-Einstellungen
2. Geben Sie Ihre JIRA Server URL ein
3. Geben Sie Ihren Benutzernamen und PAT ein (oder verwenden Sie Basic Auth)

## Tech Stack

- **Svelte 5** mit TypeScript
- **Tailwind CSS** für Styling
- **Vite** als Build-Tool
- **Lucide** für Icons

## Projektstruktur

```
src/
├── lib/
│   ├── api/          # JIRA API Clients
│   ├── components/   # Svelte Komponenten
│   ├── stores/       # State Management
│   ├── types/        # TypeScript Typen
│   └── utils/        # Hilfsfunktionen
├── App.svelte        # Root-Komponente
└── main.ts           # Einstiegspunkt

proxy/                # Optionaler CORS-Proxy
└── server.js
```

## Screenshots

### Dashboard
Übersicht und Verwaltung der gespeicherten JQL-Abfragen.

### Baumansicht
Hierarchische Darstellung der JIRA-Tickets mit auf-/zuklappbaren Knoten.

## Lizenz

MIT
