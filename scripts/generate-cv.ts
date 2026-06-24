#!/usr/bin/env -S npx tsx
/**
 * Generates the LaTeX CV (and optionally the PDF) from cv/cv.yaml.
 *
 *   npm run cv:tex   # YAML -> cv/noah-stride-cv.tex
 *   npm run cv:pdf   # YAML -> .tex -> .pdf (compiled in Docker, no local TeX)
 *
 * Schema and rendering live in src/lib/cv so the Astro site can reuse them.
 * Imported here via relative paths to avoid `@/`-alias resolution under tsx.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CV } from '../src/lib/cv/schema';
import { renderLatex } from '../src/lib/cv/latex';
import { loadCv } from '../src/lib/cv/load';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cvDir = join(repoRoot, 'cv');
const yamlPath = join(cvDir, 'cv.yaml');
const templatePath = join(cvDir, 'template.tex');
const texName = 'noah-stride-cv.tex';
const texPath = join(cvDir, texName);

// 1. Load + validate the YAML against the shared schema (same loader the
//    website uses, so the PDF and the site never drift).
let cv: CV;
try {
  cv = loadCv(yamlPath);
} catch (err) {
  console.error(`✖ ${(err as Error).message}`);
  process.exit(1);
}

// 2. Render the .tex.
const tex = renderLatex(cv, readFileSync(templatePath, 'utf8'));
writeFileSync(texPath, tex);
console.log(`✔ Wrote ${texPath}`);

// 3. Optionally compile to PDF inside Docker.
if (process.argv.includes('--pdf')) {
  compilePdf();
}

function compilePdf(): void {
  if (!dockerReady()) {
    console.warn(
      '\n⚠ Docker is not available — wrote the .tex but skipped the PDF.\n' +
        '  Start Docker Desktop and re-run `npm run cv:pdf`.',
    );
    return;
  }
  const image = 'noah-cv-latex';
  console.log('• Building LaTeX image (first run pulls TeX Live; cached after)…');
  docker(['build', '-q', '-t', image, cvDir]);
  console.log('• Compiling PDF…');
  // Two passes so hyperref's PDF bookmarks/outline resolve on the first build.
  const pdflatex = `pdflatex -interaction=nonstopmode -halt-on-error ${texName}`;
  docker(['run', '--rm', '-v', `${cvDir}:/work`, '-w', '/work', image, 'sh', '-c', `${pdflatex} && ${pdflatex}`]);
  const pdfPath = join(cvDir, 'noah-stride-cv.pdf');
  console.log(`✔ Wrote ${pdfPath}`);

  // Copy into public/ so the site serves it at /noah-stride-cv.pdf and the CV
  // page's "Download PDF" button appears.
  const publicPdfPath = join(repoRoot, 'public', 'noah-stride-cv.pdf');
  copyFileSync(pdfPath, publicPdfPath);
  console.log(`✔ Copied PDF → ${publicPdfPath}`);
}

/** Runs docker quietly, surfacing its captured output only if it fails. */
function docker(args: string[]): void {
  try {
    execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    if (e.stdout?.length) process.stdout.write(e.stdout);
    if (e.stderr?.length) process.stderr.write(e.stderr);
    throw err;
  }
}

function dockerReady(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
