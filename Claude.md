# Blog Migration: Hugo to Astro

## Project Overview
This document guides the migration of Noah Stride's personal blog from Hugo to Astro, enabling React component integration while maintaining all existing URLs.

### Current State
- **Framework**: Hugo with "marchie" theme
- **URL Structure**:
  - Blog posts: `/blog/YYYY-MM-DD-title`
  - Wiki pages: `/wiki/page-name`
  - CV: `/cv`
- **Deployment**: Cloudflare Pages
- **Domain**: https://noahstride.co.uk/

### Target State
- **Framework**: Astro with Shadcn UI components
- **Features**:
  - React component support for calculators and interactive demos
  - Preserved URL structure (critical requirement)
  - Modern, refreshed design
  - Sitemap generation
- **Content**: Migrated to Astro's content collections

## Migration Strategy

### Phase 1: Setup New Astro Site
Create a new Astro project in `astro-site/` directory with the following structure:

```
astro-site/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn components
│   │   ├── layout/       # Layout components
│   │   └── interactive/  # React calculators/demos
│   ├── content/
│   │   ├── blog/        # Blog posts
│   │   └── wiki/        # Wiki pages
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── BlogPost.astro
│   │   └── WikiPage.astro
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro  # Dynamic routing
│   │   ├── wiki/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── cv.astro
│   │   └── index.astro
│   └── styles/
│       └── globals.css
├── public/
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

### Phase 2: Initial Setup Commands

```bash
# Create new Astro project
npm create astro@latest astro-site -- --template minimal --typescript strict

# Navigate to project
cd astro-site

# Install core dependencies
npm install @astrojs/react @astrojs/tailwind @astrojs/sitemap @astrojs/mdx
npm install react react-dom
npm install -D @types/react @types/react-dom

# Install Shadcn UI dependencies
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install lucide-react

# Initialize Tailwind
npx astro add tailwind
```

### Phase 3: Configure Astro

**astro.config.mjs**:
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://noahstride.co.uk',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    mdx()
  ],
  output: 'static',
  build: {
    format: 'directory'
  },
  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/lit']
    }
  },
  redirects: {
    // Add any necessary redirects here
  }
});
```

### Phase 4: Setup Shadcn UI

**Create components.json**:
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.mjs",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Update tailwind.config.mjs**:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // ... add more as needed
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Phase 5: Content Collections Setup

**src/content/config.ts**:
```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

const wiki = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lastUpdated: z.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, wiki };
```

### Phase 6: URL Preservation Strategy

To maintain Hugo's URL structure, implement custom routing:

**src/pages/blog/[...slug].astro**:
```astro
---
import { getCollection } from 'astro:content';
import BlogPost from '@/layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => {
    // Extract date and title from filename
    const match = post.slug.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    if (match) {
      const [_, date, title] = match;
      return {
        params: { slug: `${date}-${title}` },
        props: { post }
      };
    }
    return {
      params: { slug: post.slug },
      props: { post }
    };
  });
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BlogPost {...post.data}>
  <Content />
</BlogPost>
```

### Phase 7: Content Migration Script

**scripts/migrate-content.js**:
```javascript
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

async function migrateContent() {
  // Migrate blog posts
  const blogSourceDir = './content/blog';
  const blogTargetDir = './astro-site/src/content/blog';

  await fs.ensureDir(blogTargetDir);

  const blogFiles = await fs.readdir(blogSourceDir);
  for (const file of blogFiles) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(path.join(blogSourceDir, file), 'utf-8');
      const { data, content: body } = matter(content);

      // Transform frontmatter for Astro
      const astroFrontmatter = {
        ...data,
        date: new Date(data.date),
      };

      const newContent = matter.stringify(body, astroFrontmatter);
      await fs.writeFile(path.join(blogTargetDir, file), newContent);
    }
  }

  // Migrate wiki pages
  const wikiSourceDir = './content/wiki';
  const wikiTargetDir = './astro-site/src/content/wiki';

  await fs.ensureDir(wikiTargetDir);

  const wikiFiles = await fs.readdir(wikiSourceDir);
  for (const file of wikiFiles) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(path.join(wikiSourceDir, file), 'utf-8');
      await fs.writeFile(path.join(wikiTargetDir, file), content);
    }
  }

  console.log('Content migration complete!');
}

migrateContent();
```

### Phase 8: Cloudflare Pages Deployment

**wrangler.toml**:
```toml
name = "noah-stride-blog"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[env.production]
route = "noahstride.co.uk/*"
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "deploy": "npm run build && wrangler pages deploy dist"
  }
}
```

## Interactive Component Examples

### Calculator Component Template
**src/components/interactive/Calculator.tsx**:
```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Calculator() {
  const [result, setResult] = useState<number>(0);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Interactive Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Calculator implementation */}
      </CardContent>
    </Card>
  );
}
```

### Using in MDX:
```mdx
---
title: "Post with Calculator"
date: 2024-01-15
---

import { Calculator } from '@/components/interactive/Calculator';

Here's an interactive calculator:

<Calculator />
```

## Testing Checklist

- [ ] All blog post URLs match Hugo pattern: `/blog/YYYY-MM-DD-title`
- [ ] Wiki pages accessible at `/wiki/page-name`
- [ ] CV page accessible at `/cv`
- [ ] Homepage loads correctly
- [ ] Sitemap generates properly at `/sitemap-index.xml`
- [ ] React components render in blog posts
- [ ] Dark mode toggle works
- [ ] Mobile responsive design
- [ ] Build completes without errors
- [ ] Cloudflare Pages deployment successful

## Common Commands

```bash
# Development
npm run dev

# Add Shadcn component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add navigation-menu

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy

# Migrate content from Hugo
node scripts/migrate-content.js
```

## Troubleshooting

### URL Structure Issues
If URLs don't match Hugo's structure:
1. Check the slug parsing in `[...slug].astro`
2. Verify frontmatter date format
3. Ensure filename follows `YYYY-MM-DD-title.md` pattern

### React Component Hydration
If React components don't work:
1. Add `client:load` directive: `<Calculator client:load />`
2. Check that `@astrojs/react` is properly configured
3. Verify component imports in MDX files

### Cloudflare Pages Build Errors
1. Set Node version in environment variables: `NODE_VERSION=18`
2. Check build command: `npm run build`
3. Verify output directory: `dist`

## Next Steps

1. **Phase 1**: Set up basic Astro site with Shadcn UI
2. **Phase 2**: Create layouts matching desired design
3. **Phase 3**: Implement blog and wiki routing
4. **Phase 4**: Add first interactive React component
5. **Phase 5**: Migrate content using script
6. **Phase 6**: Test all URLs match Hugo structure
7. **Phase 7**: Deploy to Cloudflare Pages
8. **Phase 8**: DNS switch when ready

## Notes for Future Claude Sessions

- Priority: URL structure preservation is CRITICAL
- Use Astro's content collections for type-safe content
- Shadcn UI components should be installed individually as needed
- React components must use `client:load` or similar directives for interactivity
- Test URL structure thoroughly before final migration
- Keep both sites running in parallel until migration is verified