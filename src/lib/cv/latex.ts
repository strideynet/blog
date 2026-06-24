import type { CV, Contact, Experience, SkillGroup } from './schema';

/**
 * Renders a {@link CV} into a complete LaTeX document by substituting the
 * `%%CONTACT%%`, `%%SUMMARY%%`, `%%EXPERIENCE%%` and `%%SKILLS%%` placeholders
 * in `template`.
 *
 * Design rule: every value that comes from the YAML is passed through
 * {@link escapeLatex} (or {@link escapeUrl} for href targets) before it is
 * woven into the structural LaTeX emitted here. Structural LaTeX — macros,
 * `$|$` separators, `\href` — is only ever produced by this module, never by
 * the user, so it is never escaped.
 */
export function renderLatex(cv: CV, template: string): string {
  const sections: Record<string, string> = {
    '%%CONTACT%%': renderContact(cv.contact),
    '%%SUMMARY%%': cv.summary ? renderSummary(cv.summary) : '',
    '%%EXPERIENCE%%': renderExperiences(cv.experiences),
    '%%SKILLS%%': renderSkills(cv.skills),
  };

  let out = template;
  for (const [token, value] of Object.entries(sections)) {
    // Each marker must appear exactly once — guards against a missing marker or
    // an accidental duplicate (e.g. naming the token in a comment).
    const occurrences = out.split(token).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Template must contain exactly one ${token}, found ${occurrences}.`);
    }
    // Function replacement inserts `value` verbatim; a string replacement would
    // treat `$` in the generated LaTeX (e.g. `$|$`) as a special pattern.
    out = out.replace(token, () => value);
  }
  return out;
}

const LATEX_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

/**
 * Escapes LaTeX special characters in user text. Single-pass so the braces we
 * introduce (e.g. in `\textbackslash{}`) are never re-escaped. Without this, a
 * literal `&` in something like "Machine & Workload Identity Lead" would open a
 * spurious column in the `tabular*` used by `\resumeSubheading` and fail the build.
 */
export function escapeLatex(input: string): string {
  return input.replace(/[\\&%$#_{}~^]/g, (ch) => LATEX_ESCAPES[ch]);
}

/**
 * Minimal escaping for a URL placed inside `\href{...}`. hyperref tolerates most
 * characters there, but `%` (comment) and `#` (parameter) still need escaping.
 */
function escapeUrl(url: string): string {
  return url.replace(/([%#])/g, '\\$1');
}

/** Collapses runs of whitespace (incl. newlines) into single spaces. */
function collapse(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Splits prose into paragraphs on blank lines and renders them as escaped LaTeX.
 * Summaries are YAML literal (|) blocks, so a blank line is preserved as `\n\n`
 * while soft-wrapped lines within a paragraph collapse to spaces (Markdown's
 * rule). The article class zeroes \parskip, so paragraphs are joined with an
 * explicit \vspace (and \noindent for a block-paragraph look). The website
 * applies the same rule, so the PDF and site never drift.
 */
function renderParagraphs(text: string, gap: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((para) => escapeLatex(collapse(para)))
    .join(`\n\n\\vspace{${gap}}\n\\noindent `);
}

function renderContact(c: Contact): string {
  const parts: string[] = [];
  if (c.phone) parts.push(escapeLatex(c.phone));
  parts.push(`\\href{mailto:${escapeUrl(c.email)}}{\\underline{${escapeLatex(c.email)}}}`);
  for (const link of c.links) {
    parts.push(`\\href{${escapeUrl(link.url)}}{\\underline{${escapeLatex(link.label)}}}`);
  }
  return [
    '\\begin{center}',
    `    \\textbf{\\Huge \\scshape ${escapeLatex(c.name)}} \\\\ \\vspace{1pt}`,
    `    \\small ${parts.join(' $|$ ')}`,
    '\\end{center}',
  ].join('\n');
}

function renderSummary(summary: string): string {
  return `\\section{Summary}\n${renderParagraphs(summary, '6pt')}`;
}

function renderExperiences(experiences: Experience[]): string {
  if (experiences.length === 0) return '';
  // `\filbreak` brackets each entry so it stays on one page: if the whole entry
  // doesn't fit in the space remaining, it's pushed to the next page instead of
  // being split across the break. Height-agnostic — no per-entry estimate needed.
  const blocks = experiences
    .map((exp) => `    \\filbreak\n${renderExperience(exp)}`)
    .join('\n\n');
  return [
    '\\section{Experience}',
    '  \\resumeSubHeadingListStart',
    '',
    blocks,
    '    \\filbreak',
    '',
    '  \\resumeSubHeadingListEnd',
  ].join('\n');
}

function renderExperience(exp: Experience): string {
  const lines: string[] = [];

  lines.push('    \\resumeSubheading');
  lines.push(`      {${escapeLatex(exp.employer)} $|$ ${escapeLatex(exp.title)}}{${escapeLatex(exp.dates)}}`);

  if (exp.summary) {
    // Respect blank-line paragraph breaks (same as the intro and the website);
    // a 4pt gap suits the tighter \small prose inside an entry.
    lines.push(`      \\resumeProse{${renderParagraphs(exp.summary, '4pt')}}`);
  }

  if (exp.highlights.length > 0) {
    lines.push('      \\resumeItemListStart');
    for (const highlight of exp.highlights) {
      lines.push(`        \\resumeItem{${escapeLatex(highlight)}}`);
    }
    lines.push('      \\resumeItemListEnd');
  }

  if (exp.technologies.length > 0) {
    // Centred dot rather than commas (which collide with commas inside items),
    // matching the skills section. Italic (not bold) label keeps it recognisable
    // but visually subordinate, so it doesn't read like the employer heading below.
    const techs = exp.technologies.map(escapeLatex).join(' $\\cdot$ ');
    lines.push(`      \\resumeProse{\\textit{Technologies: }${techs}}`);
  }

  return lines.join('\n');
}

function renderSkills(skills: SkillGroup[]): string {
  if (skills.length === 0) return '';
  // Each group on its own line; items separated by a centred dot rather than
  // commas (which collide with commas inside items, e.g. "(IP, TCP, TLS and
  // SSH)"). `\\` between group lines, but not after the last.
  const body = skills
    .map((group) => {
      const items = group.items.map(escapeLatex).join(' $\\cdot$ ');
      return group.name ? `     \\textbf{${escapeLatex(group.name)}}{: ${items}}` : `     ${items}`;
    })
    .join(' \\\\\n');
  return [
    '\\section{Technical Skills}',
    ' \\begin{itemize}[leftmargin=0.15in, label={}]',
    '    \\small{\\item{',
    body,
    '    }}',
    ' \\end{itemize}',
  ].join('\n');
}
