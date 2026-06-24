import { z } from 'zod';

/**
 * Schema for the CV single-source-of-truth (`cv/cv.yaml`).
 *
 * This lives under `src/lib/cv` rather than alongside the data so the future
 * Astro site can import the exact same schema via `@/lib/cv/schema` and render
 * the CV without re-describing its shape.
 *
 * Dates are intentionally free-text strings (e.g. "May 2022 -- Present"); we
 * never parse them, so you can write them however reads best.
 */

export const LinkSchema = z.object({
  /** Display text, e.g. "github.com/strideynet". */
  label: z.string(),
  /** Destination, e.g. "https://github.com/strideynet". */
  url: z.string().url(),
});

export const ContactSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().email(),
  /** LinkedIn, GitHub, website, etc. Rendered in order, separated by " | ". */
  links: z.array(LinkSchema).default([]),
});

export const ExperienceSchema = z.object({
  employer: z.string(),
  /** Job title held at this employer, e.g. "Senior Engineer". */
  title: z.string(),
  /** Free-text date range, e.g. "May 2022 -- Present". */
  dates: z.string(),
  /** Prose blurb about the role/employer. */
  summary: z.string().optional(),
  /** Bullet list of key achievements. */
  highlights: z.array(z.string()).default([]),
  /** Optional keyword line, e.g. ["Go", "Kubernetes"]. ATS-friendly. */
  technologies: z.array(z.string()).default([]),
});

export const SkillGroupSchema = z.object({
  /** Optional bold label, e.g. "Languages". Omit for an ungrouped keyword dump. */
  name: z.string().optional(),
  items: z.array(z.string()),
});

export const CVSchema = z.object({
  contact: ContactSchema,
  /** Intro / about paragraph(s). Blank lines start new paragraphs. */
  summary: z.string().optional(),
  experiences: z.array(ExperienceSchema).default([]),
  /** The skills "dumping ground" at the end of the CV. */
  skills: z.array(SkillGroupSchema).default([]),
});

export type Link = z.infer<typeof LinkSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type CV = z.infer<typeof CVSchema>;
