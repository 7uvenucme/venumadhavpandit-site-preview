import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const builds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/builds' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string(),
    summary: z.string(),
    year: z.number().optional(),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    cardImage: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
  }),
});

// Editable page content, managed through TinaCMS at /admin.
const listItem = z.object({ years: z.string(), org: z.string(), role: z.string() });
const release = z.object({ heading: z.string(), body: z.string() });
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    eyebrow: z.string().optional(),
    pageTitle: z.string().optional(),
    lede: z.string().optional(),
    heroEyebrow: z.string().optional(),
    heroTitle: z.string().optional(),
    heroIntro: z.string().optional(),
    heroButtonLabel: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroImageCaption: z.string().optional(),
    sectionEyebrow: z.string().optional(),
    sectionTitle: z.string().optional(),
    sectionLinkLabel: z.string().optional(),
    email: z.string().optional(),
    linkedinUrl: z.string().optional(),
    linkedinLabel: z.string().optional(),
    figureImage: z.string().optional(),
    figureAlt: z.string().optional(),
    figureCaption: z.string().optional(),
    experienceHeading: z.string().optional(),
    educationHeading: z.string().optional(),
    experience: z.array(listItem).optional(),
    education: z.array(listItem).optional(),
    storyLinkLabel: z.string().optional(),
    releasesHeading: z.string().optional(),
    releases: z.array(release).optional(),
    termsHeading: z.string().optional(),
    privacyHeading: z.string().optional(),
  }),
});

export const collections = { builds, pages };
