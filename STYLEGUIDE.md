# Style Guide (Canopy & Roots)

## Tech Stack
- **Svelte 5** mit Runes (`$state`, `$derived`, `$effect`)
- **Tailwind CSS v4** (Utility-First)
- **bits-ui** (Headless Primitives) + **shadcn-svelte** (gestylte Wrapper)
- **tailwind-variants** (`tv()`) für Komponenten-Varianten
- **cn()** aus `$lib/utils` für Class Merging (`clsx` + `tailwind-merge`)

## Fonts

| Font | Klasse | Verwendung |
|------|--------|------------|
| **Inter** | `font-sans` (Standard) | UI-Text, Labels, Buttons |
| **JetBrains Mono** | `font-data` | IDs, Zahlen, Daten, Prozente, Zeiten |

Geladen via Google Fonts in `app.css`. `.font-data` ist eine Custom-Utility-Klasse.

```svelte
<!-- Datenpunkte immer in Monospace -->
<span class="font-data text-text-subtlest">PROJ-123</span>
<span class="font-data">63%</span>
<span class="font-data">2 hours ago</span>
```

## Farbsystem (Nord-Palette)

| Token | Light | Dark | Verwendung |
|-------|-------|------|------------|
| `--ds-text` | `#2e3440` | `#eceff4` | Primary Text |
| `--ds-text-subtle` | `#434c5e` | `#9aa3b4` | Secondary Text |
| `--ds-text-subtlest` | `#4c566a` | `#5c6575` | Metadata, deaktiv |
| `--ds-text-brand` | `#5e81ac` | `#8fbcbb` | Links, Akzente |
| `--ds-text-danger` | `#bf616a` | `#d08787` | Fehler |
| `--ds-text-success` | `#7b9e64` | `#a3be8c` | Erfolg |
| `--ds-text-warning` | `#d08770` | `#ebcb8b` | Warnung |
| `--ds-surface` | `#f5f7fa` | `#0f1218` | App-Background |
| `--ds-surface-raised` | `#ffffff` | `#151a22` | Cards, Panels |
| `--ds-surface-sunken` | `#eceff4` | `#0a0d12` | Inputs, Badge-BG |
| `--ds-surface-overlay` | `#ffffff` | `#1a1f28` | Modals, Dropdowns |
| `--ds-border` | `#2e344020` | `#ffffff0d` | Subtle Border |
| `--ds-border-focused` | `#88c0d0` | `#88c0d0` | Focus Ring |

### Dark Mode Prinzipien
- **Tiefe durch Schichten:** `sunken` < `surface` < `raised` < `overlay`
- **Borders:** Semi-transparentes Weiß (`#ffffff0d`–`#ffffff1a`) statt opake Grautöne
- **Glow-Effekt:** Semantische Backgrounds mit transparenten Farben (z.B. `#8fbcbb15`)
- **Text High-Contrast:** Primary Text auf `#eceff4` (fast weiß)
- **Keine Shadows** auf dunklem Hintergrund — stattdessen feine Borders

## Design Tokens

Immer `--ds-*` Tokens verwenden, nie hardcoded Farben:

| Token | Verwendung |
|-------|------------|
| `text` / `text-subtle` / `text-subtlest` | Text Hierarchie |
| `text-brand` | Links, Akzente |
| `text-danger` / `text-success` / `text-warning` | Semantisch |
| `surface` / `surface-raised` / `surface-sunken` | Backgrounds |
| `border` / `border-bold` / `border-focused` | Borders |

```svelte
<!-- DO -->
<div class="bg-surface text-text border-border">
<span class="text-text-brand hover:underline">Link</span>

<!-- DON'T -->
<div class="bg-[#2e3440] text-[#d8dee9]">
```

## Typography

| Klasse | Verwendung |
|--------|------------|
| `text-xs` | Metadata, Timestamps, Badges |
| `text-sm` | Body, Buttons, Issue-Titel |
| `text-base` | Headings (klein) |
| `text-lg` | Hervorgehobene Zahlen (Issue Count) |
| `font-medium` | Labels, Buttons |
| `font-semibold` | Issue-Titel, Headings |
| `font-bold` | Zahlen in Badges, Meta-Labels |
| `font-data` | IDs, Zahlen, Daten, Prozente |

### Meta-Labels
Für Kategorie-Überschriften (View, Quick, By) und Formular-Labels:

```svelte
<!-- Kategorie-Label -->
<span class="text-[11px] font-bold text-text-subtlest uppercase tracking-wider">Quick:</span>

<!-- Settings-Label (CSS-Klasse) -->
<span class="settings-label">Auto-Refresh</span>
<p class="settings-desc">Reload issues automatically</p>
```

### Issue Cards — Visuelle Hierarchie
1. **Titel** (stärkstes Element): `font-medium text-sm text-text`
2. **Issue Key** (abgedämpft): `font-data font-semibold text-xs text-text-subtlest bg-surface-sunken px-1.5 py-0.5 rounded`
3. **Datenpunkte** (rechte Seite): `font-data text-text-subtlest text-xs` mit festen Breiten (`w-24`, `w-16`, `w-12`)

## Komponenten

### Imports
```svelte
<!-- shadcn-svelte (bevorzugt) -->
import { Button } from '$lib/components/ui/button';
import * as Dialog from '$lib/components/ui/dialog';

<!-- Icons -->
import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
```

### Icons (AtlaskitIcon)

```svelte
<AtlaskitIcon name="settings" size={16} />       <!-- Standard -->
<AtlaskitIcon name="settings" size={20} />       <!-- Medium -->

<!-- Clickable Icon -->
<button class="rounded p-0.5 hover:bg-surface-hovered transition-colors">
  <AtlaskitIcon name="cross" size={16} class="text-text-subtle" />
</button>
```

### Buttons
| Variant | Verwendung |
|---------|------------|
| `default` | Primäre Aktionen |
| `secondary` | Sekundäre Aktionen |
| `destructive` | Löschen, gefährlich |
| `ghost` | Toolbar, kompakt |
| `link` | Inline Links |

| Size | Classes |
|------|---------|
| `sm` | `h-8 px-3` |
| `default` | `h-9 px-4` |
| `lg` | `h-10 px-6` |
| `icon` | `size-9` |

### Inputs
```svelte
<Input class="h-8 rounded-md" placeholder="..." />
```

### Cards
```svelte
<div class="rounded-xl border bg-card p-6 shadow-sm">
```

### List Items
```svelte
<button class="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors">
```

## Segmented Controls

Für Optionsgruppen (Theme, Auto-Refresh, Density etc.) — CSS-Klassen in `app.css`:

```svelte
<div class="segmented-control">
  <button onclick={handleClick} class={isActive ? 'seg-active' : ''}>
    Option A
  </button>
  <button onclick={handleClick} class={isActive ? 'seg-active' : ''}>
    Option B
  </button>
</div>
```

- Container: `bg-neutral p-[3px] rounded-lg`
- Inaktiv: `text-text-subtlest`, Hover: `text-text-subtle`
- Aktiv (`.seg-active`): `bg-surface-overlay`, `font-weight: 500`, subtiler `box-shadow`

## Status Badges

Soft filled statt Outline:

| Status | Klassen |
|--------|---------|
| Done | `bg-success/15 text-success border-transparent` |
| In Progress | `bg-information/15 text-information border-transparent` |
| New | `bg-muted text-muted-foreground border-transparent` |

```svelte
<Badge class="bg-information/15 text-information border-transparent">
  In Bearbeitung
</Badge>
```

## Filter Pills

| Zustand | Klassen |
|---------|---------|
| Inaktiv | `bg-transparent border-border/50 text-muted-foreground hover:bg-surface-hovered` |
| Aktiv | `bg-information/15 border-transparent text-information font-medium` |

Icons in inaktiven Pills: `opacity-50`

```svelte
<button class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
  {isActive
    ? 'bg-information/15 border-transparent text-information font-medium'
    : 'bg-transparent border-border/50 text-muted-foreground hover:bg-surface-hovered'}">
  <AtlaskitIcon name="clock" size={12} class={isActive ? '' : 'opacity-50'} />
  {label}
</button>
```

## Multi-Select Pills (Default Fields etc.)

| Zustand | Klassen |
|---------|---------|
| Inaktiv | `bg-background border-border/50 text-muted-foreground hover:bg-surface-hovered` |
| Aktiv | `bg-information/15 border-information/30 text-information font-medium` |

## Scrollbars

Dezent, abgerundet, nur bei Hover sichtbar:

```svelte
<!-- Sidebar -->
<div class="overflow-y-auto sidebar-scroll">

<!-- Tree Content -->
<div class="overflow-auto tree-scroll">
```

Globale Scrollbar: 6px, `rounded-full`, transparenter Track.
`sidebar-scroll` / `tree-scroll`: Thumb nur bei Container-Hover sichtbar.

## Spacing & Layout

| Wert | Pixel | Verwendung |
|------|-------|------------|
| `gap-2` | 8px | Kleine Abstände |
| `gap-3` | 12px | Kompakt |
| `gap-4` | 16px | Standard |
| `p-4` | 16px | Standard Padding |
| `p-6` | 24px | Card Padding |

### Feste Spaltenbreiten (Issue Cards)
| Element | Breite |
|---------|--------|
| Datum-Felder | `w-24` |
| Progress-Bar | `w-16` |
| Prozent/Count | `w-10`–`w-12` |
| Status-Badge | `w-28` |

Alle rechtsbündig: `justify-end` oder `text-right`.

## Border Radius

| Element | Klasse |
|---------|--------|
| Buttons, Inputs | `rounded-md` (4px) |
| Cards, Modals | `rounded-xl` (12-16px) |
| Badges, Pills | `rounded-full` |
| Segmented Control | `rounded-lg` (Container), `rounded-md` (Buttons) |

## Shadows

| Klasse | Verwendung |
|--------|------------|
| `shadow-sm` | Cards, Segmented Active |
| `shadow-md` | Dropdowns, Tooltips |
| `shadow-lg` | Modals |
| `shadow-inner` | Code-Eingabefelder (JQL Textarea) |

## Transitions

```svelte
<!-- Standard -->
<button class="transition-colors">
<div class="transition-all duration-150">
<!-- Segmented Controls -->
<button class="transition-all duration-200">
```

## Focus States

```svelte
<button class="focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">

<input class="focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
```

## Dividers

```svelte
<!-- Zwischen Sektionen -->
<div class="border-b border-border/50"></div>

<!-- In Toolbars -->
<div class="w-px h-4 bg-border/50 mx-1"></div>
```

## tailwind-variants

```typescript
import { tv } from 'tailwind-variants';

const button = tv({
  base: 'rounded-md font-medium transition-colors',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      ghost: 'hover:bg-accent',
    },
    size: {
      sm: 'h-8 px-3',
      default: 'h-9 px-4',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

## Checkliste

- [ ] Design Tokens (`--ds-*`) statt hardcoded Farben
- [ ] `font-data` für alle Datenpunkte (IDs, Zahlen, Zeiten, Prozente)
- [ ] `cn()` für dynamische Classes
- [ ] `transition-colors` für Hover/Focus
- [ ] `focus-visible:ring-*` für Focus States
- [ ] Icons: `AtlaskitIcon` mit `size={16}` (Standard)
- [ ] Disabled: `disabled:opacity-50 disabled:pointer-events-none`
- [ ] Komponenten aus `$lib/components/ui/` verwenden
- [ ] Segmented Controls für Optionsgruppen (nicht lose Buttons)
- [ ] Filter Pills: `bg-information/15` aktiv, `border-border/50` inaktiv
- [ ] Status Badges: Soft filled, nicht Outline
- [ ] Feste Spaltenbreiten + `text-right` für rechte Seite der Issue Cards
