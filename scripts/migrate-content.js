#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrateContent() {
  console.log('Starting content migration...\n');

  // Paths
  const hugoRoot = path.resolve(__dirname, '../../');
  const astroRoot = path.resolve(__dirname, '../');

  const blogSourceDir = path.join(hugoRoot, 'content/blog');
  const blogTargetDir = path.join(astroRoot, 'src/content/blog');

  const wikiSourceDir = path.join(hugoRoot, 'content/wiki');
  const wikiTargetDir = path.join(astroRoot, 'src/content/wiki');

  // Ensure target directories exist
  await fs.ensureDir(blogTargetDir);
  await fs.ensureDir(wikiTargetDir);

  // Migrate blog posts
  console.log('📝 Migrating blog posts...');
  if (await fs.pathExists(blogSourceDir)) {
    const blogFiles = await fs.readdir(blogSourceDir);
    let blogCount = 0;

    for (const file of blogFiles) {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const sourcePath = path.join(blogSourceDir, file);
        const targetPath = path.join(blogTargetDir, file);

        try {
          const content = await fs.readFile(sourcePath, 'utf-8');
          const { data, content: body } = matter(content);

          // Transform frontmatter for Astro
          const astroFrontmatter = {
            ...data,
            date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            draft: data.draft || false,
          };

          // Reconstruct the file with updated frontmatter
          const newContent = matter.stringify(body, astroFrontmatter);
          await fs.writeFile(targetPath, newContent);

          console.log(`  ✓ ${file}`);
          blogCount++;
        } catch (error) {
          console.error(`  ✗ Failed to migrate ${file}:`, error.message);
        }
      }
    }
    console.log(`✅ Migrated ${blogCount} blog posts\n`);
  } else {
    console.log('  ⚠ Blog source directory not found\n');
  }

  // Migrate wiki pages
  console.log('📚 Migrating wiki pages...');
  if (await fs.pathExists(wikiSourceDir)) {
    const wikiFiles = await fs.readdir(wikiSourceDir);
    let wikiCount = 0;

    for (const file of wikiFiles) {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const sourcePath = path.join(wikiSourceDir, file);
        const targetPath = path.join(wikiTargetDir, file);

        try {
          const content = await fs.readFile(sourcePath, 'utf-8');
          const { data, content: body } = matter(content);

          // Add title if missing (extract from first heading if needed)
          if (!data.title) {
            const headingMatch = body.match(/^#\s+(.+)$/m);
            if (headingMatch) {
              data.title = headingMatch[1];
            } else {
              // Use filename as title
              data.title = file.replace(/\.(md|mdx)$/, '').replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            }
          }

          const astroFrontmatter = {
            ...data,
            lastUpdated: data.lastUpdated || data.date || new Date().toISOString(),
          };

          const newContent = matter.stringify(body, astroFrontmatter);
          await fs.writeFile(targetPath, newContent);

          console.log(`  ✓ ${file}`);
          wikiCount++;
        } catch (error) {
          console.error(`  ✗ Failed to migrate ${file}:`, error.message);
        }
      }
    }
    console.log(`✅ Migrated ${wikiCount} wiki pages\n`);
  } else {
    console.log('  ⚠ Wiki source directory not found\n');
  }

  // Migrate CV
  console.log('📄 Migrating CV...');
  const cvSourcePath = path.join(hugoRoot, 'content/cv.md');
  if (await fs.pathExists(cvSourcePath)) {
    try {
      const content = await fs.readFile(cvSourcePath, 'utf-8');
      const { data, content: body } = matter(content);

      // Create CV as a markdown file in content
      const cvTargetDir = path.join(astroRoot, 'src/content');
      await fs.ensureDir(cvTargetDir);

      const cvTargetPath = path.join(cvTargetDir, 'cv.md');
      const newContent = matter.stringify(body, data);
      await fs.writeFile(cvTargetPath, newContent);

      console.log('  ✓ CV migrated');
      console.log('  ℹ Note: You may need to update src/pages/cv.astro to use this content\n');
    } catch (error) {
      console.error('  ✗ Failed to migrate CV:', error.message);
    }
  } else {
    console.log('  ⚠ CV not found\n');
  }

  // Copy static assets
  console.log('🖼️ Migrating static assets...');
  const staticSourceDir = path.join(hugoRoot, 'static');
  const publicTargetDir = path.join(astroRoot, 'public');

  if (await fs.pathExists(staticSourceDir)) {
    try {
      await fs.copy(staticSourceDir, publicTargetDir, {
        overwrite: false, // Don't overwrite existing files
        errorOnExist: false,
      });
      console.log('  ✓ Static assets copied\n');
    } catch (error) {
      console.error('  ✗ Failed to copy static assets:', error.message);
    }
  } else {
    console.log('  ⚠ Static directory not found\n');
  }

  console.log('✨ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Review the migrated content in src/content/');
  console.log('2. Test the site with: npm run dev');
  console.log('3. Update any custom shortcodes or Hugo-specific syntax');
  console.log('4. Deploy to Cloudflare Pages with: npm run deploy');
}

// Install required dependencies first
async function checkDependencies() {
  try {
    await import('gray-matter');
  } catch {
    console.log('Installing required dependencies...');
    const { execSync } = await import('child_process');
    execSync('npm install --no-save gray-matter', { stdio: 'inherit' });
  }
}

// Run migration
checkDependencies().then(() => {
  migrateContent().catch(console.error);
});