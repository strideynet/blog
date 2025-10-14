# Noah's Blog - Project Guide

This is Noah's personal blog built with Astro, featuring blog posts, wiki pages, and interactive React-based tools.

## Project Overview

- **Framework**: Astro 5.x with static site generation
- **Styling**: Tailwind CSS + shadcn/ui components
- **Interactive Components**: React 19 with TypeScript
- **Deployment**: Cloudflare Pages via Wrangler
- **Site URL**: https://noahstride.co.uk

## Content Structure

### Blog Posts (`src/content/blog/`)
- **IMPORTANT**: Never modify the content of existing blog posts. These are Noah's personal writings.
- Files use naming convention: `YYYY-MM-DD-kebab-case-title.md`
- Frontmatter includes: `title`, `date`, `tags`, `draft`

### Wiki Pages (`src/content/wiki/`)
- Long-lived reference pages
- Files use naming convention: `kebab-case.md`
- Topics include amateur radio, networking, technical guides

### Interactive Tools (`src/components/tools/`)
- Each tool has its own directory under `src/components/tools/`
- Each tool has a dedicated page in `src/pages/tools/`
- Tools are React components that run client-side
- Current tools: NanoVNA SWR Analyser

## File Naming Conventions

- **Astro pages**: `kebab-case.astro`
- **React components**: `PascalCase.tsx`
- **Utility files**: `camelCase.ts`
- **shadcn/ui components**: `kebab-case.tsx` in `src/components/ui/`
- **Blog posts**: `YYYY-MM-DD-kebab-case-title.md`
- **Wiki pages**: `kebab-case.md`

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (kebab-case.tsx)
│   ├── tools/           # Interactive tool components
│   │   └── tool-name/   # Each tool in its own directory
│   │       ├── ToolName.tsx       # Main component (PascalCase)
│   │       ├── SubComponent.tsx   # Sub-components
│   │       ├── utilityFile.ts     # Utilities (camelCase)
│   │       └── types.ts           # Type definitions
│   └── interactive/     # Other interactive components
├── content/
│   ├── blog/           # Blog posts (YYYY-MM-DD-title.md)
│   ├── wiki/           # Wiki pages (kebab-case.md)
│   └── config.ts       # Content collection definitions
├── layouts/            # Astro layouts
├── pages/
│   ├── blog/          # Blog routes
│   ├── wiki/          # Wiki routes
│   ├── tools/         # Tool pages (one .astro file per tool)
│   └── index.astro    # Homepage
└── styles/            # Global styles
```

## Development Commands

- `npm run dev` - Start dev server
- `npm run build` - Build site (includes `astro check`)
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to Cloudflare Pages
- `npm run deploy:preview` - Deploy to preview branch

## Creating New Tools

When creating a new interactive tool:

1. Create a directory under `src/components/tools/tool-name/`
2. Create the main component: `ToolName.tsx` (PascalCase)
3. Add any sub-components, utilities, and types in the same directory
4. Create a dedicated page in `src/pages/tools/tool-name.astro`
5. The tool page should:
   - Import and render the tool component with `client:load`
   - Include a title and description
   - Optionally include documentation cards below the tool

**Example tool page structure** (see `src/pages/tools/nanovna-swr-analyser.astro`):
```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { ToolComponent } from '@/components/tools/tool-name/ToolComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
---

<BaseLayout title="Tool Name">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">Tool Name</h1>
    <p class="text-muted-foreground text-lg">Tool description</p>

    <div class="mb-8">
      <ToolComponent client:load />
    </div>

    {/* Optional documentation cards */}
  </div>
</BaseLayout>
```

## Tech Stack Details

- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Icons**: lucide-react
- **Charts**: Chart.js + react-chartjs-2
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Path Aliases**: `@/` maps to `src/`

## Important Notes

- **Never modify blog post content** - These are Noah's personal writings
- Blog posts and wiki pages are markdown/MDX files
- All interactive components must use `client:load` or similar directive in Astro pages
- Site uses Tailwind with custom base styles disabled (shadcn/ui handles this)
- Deployment is to Cloudflare Pages, configured via `wrangler.toml`

## Common Tasks

### Adding shadcn/ui Components
The project already uses shadcn/ui. New components should be added to `src/components/ui/` following shadcn conventions.

### Styling
- Use Tailwind utility classes
- Use shadcn/ui components for UI elements (Button, Card, etc.)
- Custom styles in `src/styles/globals.css` if needed

### Content Collections
Content is managed via Astro's content collections (see `src/content/config.ts`). Blog and wiki content should follow the defined schemas.
