# Nexo Design: design system brief for the redesign

**For:** the design team
**From:** Nexo engineering
**Companion document:** [nexo-frontend-summary.md](nexo-frontend-summary.md) describes *what* the logged-in app does and who uses it. This document describes *how* the new design will be built, and what we need from you so the built product matches your design exactly.

---

## 1. Goal

Nexo is redesigning its whole frontend. The result has to look and behave as **one product** across every screen and every subdomain:

| Surface | Domain | Notes |
|---|---|---|
| Public site | `nexodesign.ai` (home, products) | Marketing pages |
| Login & onboarding | `nexodesign.ai` | Login, invitation, set password |
| Platform app | `nexodesign.ai` (after login) | Dashboard, projects, workspace, knowledge base |
| System Diagram App | `editor.nexodesign.ai` | Separate React app, same look |

The same buttons, labels, colours, type, spacing, icons and states must appear everywhere. To get there we are building **one shared design system**. Your Figma work is its source of truth, and code consumes it directly.

**Decisions already made:**
- **Dark theme only.** No light mode for now.
- **Component base: [shadcn/ui](https://ui.shadcn.com).** All UI components are built on shadcn/ui (Radix UI + Tailwind CSS). Please design *on top of* shadcn, not from a blank canvas (see §3).
- **One component library** shared by all apps, so a change to a button changes it on every subdomain at once.
- **The visual direction is yours.** The current navy + teal look is a starting point, not a constraint.

---

## 2. What is wrong today (so you know what to fix)

- **Two different looks.** The public site and the platform use different fonts, corner radii and border colours.
- **Inconsistent buttons.** About 60 buttons in the app are custom-made instead of using the shared button, so sizes, paddings and hover states vary.
- **Ad-hoc colours.** Some states (e.g. "edited by user", warnings, errors) use one-off colours that aren't part of any palette.
- **Inconsistent labels.** The same idea is named differently in different places, in English and Spanish ("Run", "Execution", "Use this run", "Activate"…).
- **No catalogue.** There is no single place to see every component and state.

---

## 3. Why shadcn/ui, and what it means for you

shadcn/ui is a widely used open-source set of accessible React components. Nexo already uses its patterns. We are making it the official base because:

- **Accessibility comes built in:** keyboard navigation, focus handling and screen-reader support, via Radix UI.
- **It is fully restylable.** Its look is driven entirely by **design tokens** (CSS variables), so your design can change everything visible without engineers rebuilding behaviour.
- **There is an official Figma kit** that mirrors the code one-to-one, so names and variants line up between Figma and code.

**What we ask:**
1. **Start from a shadcn/ui Figma kit** (the community "shadcn/ui" kit that uses Figma Variables), and restyle it to Nexo's identity.
2. **Keep shadcn's component names, variants and sizes** where they exist (e.g. Button `default / secondary / outline / ghost / destructive / link`, sizes `sm / default / lg / icon`). You can add variants, but please don't rename existing ones. Matching names is what keeps Figma and code in sync.
3. **Define styles through tokens (Figma Variables), not one-off values.** If a colour, radius or spacing value isn't a token, engineering can't reproduce it reliably.
4. **Design new components as compositions** of shadcn primitives where possible (e.g. a "Run card" = Card + Badge + Button + Tooltip).

---

## 4. Design tokens: how to structure them

Please organise Figma Variables in **three layers**. This lets a future rebrand happen by changing values, not by redesigning screens.

| Layer | What it is | Examples |
|---|---|---|
| **1. Primitive** | Raw values, never used directly on components | `navy/950`, `teal/400`, `space/4`, `radius/md`, `font-size/14` |
| **2. Semantic** | What a value *means*. Components only use these. | `background`, `foreground`, `card`, `primary`, `muted-foreground`, `border`, `ring`, `destructive` |
| **3. Component** *(optional)* | Overrides for one component only | `button/primary/background` |

### 4.1 Required semantic tokens (shadcn names)

These names come from shadcn/ui and map straight to code. Please provide a value for each:

`background` · `foreground` · `card` · `card-foreground` · `popover` · `popover-foreground` · `primary` · `primary-foreground` · `secondary` · `secondary-foreground` · `muted` · `muted-foreground` · `accent` · `accent-foreground` · `destructive` · `destructive-foreground` · `border` · `input` · `ring` · `radius` · `sidebar` · `sidebar-foreground` · `sidebar-primary` · `sidebar-accent` · `sidebar-border` · `chart-1…5`

### 4.2 Nexo-specific semantic tokens

The product has states that shadcn doesn't cover. These need their own tokens and must look the same everywhere:

| Token group | States |
|---|---|
| **Run status** | pending · running · completed · failed |
| **Active run** | the run currently "in use" for a stage (the most important concept in the product) |
| **Item origin** | AI-generated · edited by user · approved by user |
| **Freshness** | up to date · out of date (an earlier stage changed) |
| **Document indexing** | pending · processing · indexed · error |
| **Regulations** | mandatory · recommended · confirmed · possible · excluded · not evaluated |
| **Feedback** | success · warning · info · error |

Each needs at least a **background**, **foreground/text** and **border** value, and they must meet **WCAG AA contrast** on the dark background.

### 4.3 Other foundations

- **Typography:** families (UI, display, monospace for part numbers and code), and a type scale with size, line height, weight and letter spacing per step.
- **Spacing scale:** based on 4 px.
- **Radius scale.**
- **Elevation / shadows**, plus how surfaces layer in dark mode.
- **Motion:** durations and easing for open/close, hover and loading.
- **Iconography:** we use **Lucide** icons (shadcn's default). Please specify sizes and stroke width, and flag any custom icons needed.
- **Data density:** the platform shows long technical tables (ICs, part numbers, regulations). Please define a **compact density** for tables and lists.

---

## 5. Component inventory

### 5.1 shadcn/ui components to restyle

Please provide every **variant × size × state** (default, hover, focus, active, disabled, loading, error where it applies).

| Category | Components |
|---|---|
| Actions | Button, Toggle, Toggle Group, Dropdown Menu, Context Menu |
| Forms | Input, Textarea, Select, Combobox, Checkbox, Radio Group, Switch, Label, Form field (label + hint + error), Date picker |
| Display | Badge, Card, Avatar, Table, Data Table, Separator, Skeleton, Progress, Accordion, Collapsible |
| Overlays | Dialog, Alert Dialog, Sheet (side panel), Popover, Tooltip, Hover Card, Command (search palette) |
| Navigation | Tabs, Sidebar, Breadcrumb, Navigation Menu, Pagination |
| Feedback | Toast (Sonner), Alert |
| Layout | Resizable panels, Scroll Area |

### 5.2 Nexo patterns (built from shadcn pieces)

| Pattern | Used for |
|---|---|
| App shell | Sidebar + header + user menu + language switch (EN/ES) |
| Page header | Title, breadcrumbs, status, primary actions |
| Stage / step card | One stage of the AI design pipeline and its state |
| Pipeline stepper | The ordered stages and where the project is |
| Run status badge | pending / running / completed / failed |
| Run history list | Past runs: number, status, author, time, duration, notes, active marker |
| "Use this run" control | Promoting a run to active |
| AI output item card | Research solution, IC design, component; shows selection and an edited marker |
| Empty state | "Nothing here yet" + what to do next |
| Blocked state | "Can't run yet because… / do this first" |
| External hand-off | Opening Google Drive, the diagram editor, PDFs (embedded or new tab) |
| Document row & upload | Knowledge base and project documents |
| Questionnaire question | Single choice / multiple choice / "Don't know yet" |
| Legislation result group | Confirmed / possible / excluded / not evaluated |
| Power-user panel | Raw JSON, n8n link, token usage (hidden for normal users) |

---

## 6. Labels and language

- Every text exists in **English and Spanish**. **Spanish is often 20–30 % longer**, so please check key components (buttons, tabs, badges) with Spanish text.
- Please deliver a **label glossary**: one approved term per concept, in both languages (e.g. *Run / Ejecución*, *Use this run / Usar esta ejecución*, *Active / Activa*, *Edited / Editado*). Engineering will enforce it everywhere.
- Define the **voice and tone** for buttons (verb first?), errors (technical or plain?) and empty states.

---

## 7. What we need from you (deliverables)

| # | Deliverable | Format |
|---|---|---|
| 1 | Foundations: colour, type, spacing, radius, elevation, motion, icons | Figma Variables + styles, in the 3 layers of §4 |
| 2 | Restyled shadcn/ui components, all variants and states | Figma components built from the shadcn/ui kit |
| 3 | Nexo patterns from §5.2 | Figma components |
| 4 | Screen designs (see the product brief) | Figma frames that use only the components above |
| 5 | Label glossary EN/ES + voice & tone | Short doc or Figma page |
| 6 | Exported tokens | JSON from Tokens Studio or the Figma Variables export (W3C Design Tokens format if possible) |

**Rule of thumb:** if something on a screen isn't a component or a token, flag it. It will either become one, or it will drift.

---

## 8. How engineering will build it

For context only. You don't need to act on this section.

- **One codebase for all apps (monorepo).** Shared packages are used by the public site, the platform and the diagram editor:
  - `tokens`: your exported token JSON, turned automatically into CSS variables and Tailwind settings
  - `ui`: the shadcn/ui components, restyled with your tokens, plus the Nexo patterns
- **Storybook** is a live web catalogue of every coded component and state. You will get access to compare it against Figma and approve it.
- **Visual regression tests** catch any unintended visual change before it ships.
- **Automatic guardrails** block one-off colours and custom buttons in the apps, so the system stays consistent after launch.

### Rollout

| Phase | What happens | Needs design? |
|---|---|---|
| 0. Audit | Inventory of current screens, components, colours and labels, shared with you as input | No |
| 1. Monorepo | Platform and editor moved into one codebase. No visual change. | No |
| 2. Foundations | Token pipeline + shadcn/ui library + Storybook, seeded with today's colours | No |
| 3. Migration | Every screen switched to the shared components. Looks the same, now fully token-driven. | No |
| 4. New look | **Your tokens and components** are imported, and the whole platform restyles at once | **Yes** |
| 5. Screen redesign | Screens rebuilt from your designs, one area at a time: shell → dashboard → projects → workspace → knowledge base → public site → editor | **Yes** |

Phases 0–3 start now, in parallel with your work. When your tokens and components arrive, applying them across all subdomains is fast.

---

## 9. Review process

1. You publish foundations + components in Figma.
2. Engineering imports the tokens and builds/updates components in Storybook.
3. You review Storybook against Figma, and we iterate on any differences.
4. Screens are built only from approved components.
5. After launch, any change to tokens or shared components goes through a design review.

---

## 10. Questions for the design team

1. Will you use **Tokens Studio** or **native Figma Variables export** for tokens?
2. Should the public site get its own expressive extras (large display type, video, motion) on top of the shared system, or the same restrained system?
3. Do you need any components beyond §5 for the screens you are planning?
4. Who on your side approves Storybook builds?
