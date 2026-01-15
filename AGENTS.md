# AGENTS.md - Codebase Guide for AI Agents

This document provides essential context for AI coding agents working in this repository.

## Project Overview

**ThoughtLite** - A modern Astro theme for personal websites, deployed on Cloudflare Workers.

- **Framework**: Astro 5.x with Svelte 5 components
- **Styling**: Tailwind CSS 4.x
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Deployment**: Cloudflare Workers
- **Package Manager**: pnpm (enforced)

## Commands

### Development

```bash
pnpm dev              # Start dev server (localhost:4321)
pnpm build            # Production build
pnpm preview          # Preview with Wrangler
pnpm check            # Astro type checking
```

### Code Quality

```bash
pnpm lint             # Run Biome linter
pnpm format           # Format with Biome (auto-fixes)
```

### Database

```bash
pnpm db:migration        # Generate migration files
pnpm db:migrate:local    # Apply migrations locally
pnpm db:migrate:remote   # Apply migrations to production
```

### Deployment

```bash
pnpm deploy           # Deploy to Cloudflare
pnpm deploy:dry       # Dry run deployment
```

### Content

```bash
pnpm new              # Create new content file (interactive)
```

## Code Style (Biome)

### Formatting Rules

- **Indent**: Tabs (width: 4)
- **Line width**: 150 characters (320 for HTML)
- **Line endings**: LF
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always required
- **Trailing commas**: None
- **Arrow parens**: As needed (`x => x` not `(x) => x`)

### Linting Rules

- Recommended rules enabled
- `noExplicitAny`: OFF (any is allowed)
- `noNonNullAssertion`: OFF (! assertions allowed)
- `useNamingConvention`: WARN (flexible casing)

### File-Specific Overrides

For `.astro` and `.svelte` files:

- `useConst`: OFF
- `useImportType`: OFF
- `noUnusedVariables`: OFF
- `noUnusedImports`: OFF

## TypeScript Path Aliases

```typescript
import config from "$config"; // site.config.ts
import Component from "$components/*"; // src/components/*
import { schema } from "$db/*"; // src/db/*
import i18n from "$i18n"; // src/i18n/index
import Layout from "$layouts/*"; // src/layouts/*
import util from "$utils/*"; // src/utils/*
import asset from "$assets/*"; // src/assets/*
import icon from "$icons/*"; // src/icons/*
```

## Project Structure

```
src/
├── actions/        # Astro server actions
├── assets/         # Static assets (processed)
├── components/     # Svelte & Astro components
├── content/        # Content collections (MD/MDX)
│   ├── note/       # Long-form articles
│   ├── jotting/    # Short posts/updates
│   ├── preface/    # Homepage intro
│   └── information/ # About page content
├── db/             # Drizzle schema & queries
├── i18n/           # Internationalization
├── layouts/        # Page layouts (App, Base, Footer)
├── pages/          # File-based routing
├── styles/         # Global CSS
└── utils/          # Utilities & remark plugins
```

## Content Creation

### Content Types

| Type            | Purpose                      | Location                            |
| --------------- | ---------------------------- | ----------------------------------- |
| **Note**        | Long-form, polished articles | `src/content/note/{locale}/`        |
| **Jotting**     | Quick posts, updates, talks  | `src/content/jotting/{locale}/`     |
| **Preface**     | Homepage intro text          | `src/content/preface/{locale}/`     |
| **Information** | About page content           | `src/content/information/{locale}/` |

### Frontmatter Format

```yaml
---
title: Post Title
timestamp: 2025-01-15 19:18:34+01:00 # ISO 8601 with timezone
tags: [Tag1, Tag2]
draft: false # Set true to hide from listings
---
```

### Images in Content

For content with images, use directory structure:

```
src/content/jotting/en/my-post/
├── index.md
└── images/
    └── photo.jpeg
```

Reference images with relative paths:

```markdown
![Description](images/photo.jpeg)
```

### MDX Components

For advanced features (Linkroll, etc.), use `.mdx` extension:

```mdx
---
---

import Linkroll from "$components/Linkroll.astro";

<Linkroll locale={props.locale} links={links} />
```

## i18n

Supported locales: `en`, `zh-cn`, `ja`

Content files must be placed in locale-specific directories:

- `src/content/note/en/` - English
- `src/content/note/zh-cn/` - Chinese
- `src/content/note/ja/` - Japanese

## Database Schema

Key tables in `src/db/schema.ts`:

- `Drifter` - OAuth user accounts
- `Comment` - User comments
- `CommentHistory` - Edit history
- `PushSubscription` - Web push subscriptions
- `Email` - Email notification preferences

## Component Patterns

### Astro Components (.astro)

```astro
---
interface Props {
	locale: string;
	title: string;
}
const { locale, title } = Astro.props;
---

<div>{title}</div>
```

### Svelte Components (.svelte)

```svelte
<script lang="ts">
	let { locale, title }: { locale: string; title: string } = $props();
</script>

<div>{title}</div>
```

## Environment Variables

Required for full functionality (see `.env.example`):

- `CLOUDFLARE_TURNSTILE_*` - Captcha for comments
- `GITHUB_CLIENT_*` / `GOOGLE_CLIENT_*` - OAuth
- `VAPID_*` - Web push notifications
- `EMAIL_*` - Email notifications

## Pre-commit Hooks

Husky + lint-staged runs on commit:

```bash
biome check --write --no-errors-on-unmatched --files-ignore-unknown=true
```

Affected files: `*.{js,ts,json,jsonc,css,svelte,astro}`

## Common Gotchas

1. **pnpm only** - `npm` and `yarn` are blocked by preinstall script
2. **Cloudflare branch** - This is the `cloudflare` branch with D1 support
3. **No trailing commas** - Biome enforces `trailingCommas: "none"`
4. **Tab indentation** - Not spaces
5. **Local DB required** - Run `pnpm db:migrate:local` before `pnpm dev`
