import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { CVSchema, type CV } from './schema';

/**
 * Default location of the CV source, relative to the repo root. Both
 * `astro build`/`astro dev` and `npm run cv:*` run with cwd = repo root.
 */
export const DEFAULT_CV_PATH = resolve(process.cwd(), 'cv/cv.yaml');

/**
 * Reads and validates the CV YAML, returning the typed object. Throws a
 * formatted error on invalid data so a bad CV fails the build loudly rather
 * than shipping broken. Used by both the Astro page and `scripts/generate-cv.ts`
 * so the website and the PDF are always built from the same validated object.
 */
export function loadCv(path: string = DEFAULT_CV_PATH): CV {
  const parsed = CVSchema.safeParse(parseYaml(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid CV data in ${path}:\n${issues}`);
  }
  return parsed.data;
}
