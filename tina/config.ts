import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_BRANCH || process.env.HEAD || "main";

const seoFields = [
  { type: "string" as const, name: "title", label: "SEO title", required: true },
  { type: "string" as const, name: "description", label: "SEO description", required: true, ui: { component: "textarea" } },
];

const headerFields = [
  { type: "string" as const, name: "eyebrow", label: "Eyebrow (small label above the title)" },
  { type: "string" as const, name: "pageTitle", label: "Page title" },
  { type: "string" as const, name: "lede", label: "Intro paragraph", ui: { component: "textarea" } },
];

const timelineField = (name: string, label: string) => ({
  type: "object" as const,
  name,
  label,
  list: true,
  ui: { itemProps: (item: any) => ({ label: item?.org }) },
  fields: [
    { type: "string" as const, name: "years", label: "Years" },
    { type: "string" as const, name: "org", label: "Organization" },
    { type: "string" as const, name: "role", label: "Role" },
  ],
});

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "build",
        label: "Builds (projects)",
        path: "src/content/builds",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Title", required: true },
          { type: "string", name: "eyebrow", label: "Eyebrow (small label)", required: true },
          { type: "string", name: "summary", label: "Summary", required: true, ui: { component: "textarea" } },
          { type: "number", name: "year", label: "Year" },
          { type: "boolean", name: "featured", label: "Show on homepage" },
          { type: "image", name: "cardImage", label: "Card image (grid thumbnail)" },
          { type: "image", name: "image", label: "Main image (top of project page)" },
          { type: "string", name: "imageAlt", label: "Image alt text" },
          { type: "string", name: "imageCredit", label: "Image credit" },
          { type: "rich-text", name: "body", label: "Project story", isBody: true },
        ],
      },
      {
        name: "page_home",
        label: "Homepage",
        path: "src/content/pages",
        format: "md",
        match: { include: "home" },
        fields: [
          ...seoFields,
          { type: "string", name: "heroEyebrow", label: "Hero eyebrow" },
          { type: "string", name: "heroTitle", label: "Hero headline (HTML like <em> allowed)" },
          { type: "string", name: "heroIntro", label: "Hero intro", ui: { component: "textarea" } },
          { type: "string", name: "heroButtonLabel", label: "Hero button label" },
          { type: "image", name: "heroImage", label: "Hero artwork" },
          { type: "string", name: "heroImageAlt", label: "Hero artwork alt text" },
          { type: "string", name: "heroImageCaption", label: "Hero artwork caption" },
          { type: "string", name: "sectionEyebrow", label: "Projects section eyebrow" },
          { type: "string", name: "sectionTitle", label: "Projects section title" },
          { type: "string", name: "sectionLinkLabel", label: "Projects section link label" },
          { type: "string", name: "artworkTitle", label: "Artwork section title" },
          { type: "object", name: "artworks", label: "Recent artwork", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.alt || "Artwork" }) },
            fields: [
              { type: "image", name: "image", label: "Full artwork" },
              { type: "image", name: "thumbnail", label: "Thumbnail (optional)" },
              { type: "string", name: "alt", label: "Artwork description (alt text)" },
            ],
          },
          { type: "string", name: "readingTitle", label: "Reading section title" },
          { type: "string", name: "bookTitle", label: "Book title" },
          { type: "image", name: "bookCover", label: "Book cover" },
          { type: "string", name: "bookCoverAlt", label: "Book cover description" },
          { type: "string", name: "bookQuote", label: "Highlighted quote", ui: { component: "textarea" } },
          { type: "string", name: "hobbiesTitle", label: "Current interests section title" },
          { type: "object", name: "hobbies", label: "Current interests", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.name || "Interest" }) },
            fields: [
              { type: "string", name: "name", label: "Name" },
              { type: "string", name: "detail", label: "One line" },
              { type: "string", name: "icon", label: "Icon", options: ["cube", "dumbbell", "keyboard", "book", "pencil", "music"] },
            ],
          },
          { type: "string", name: "playlistTitle", label: "Playlist section title" },
          { type: "string", name: "playlistUrl", label: "Spotify playlist URL" },
          { type: "string", name: "toolsTitle", label: "Tools section title" },
          { type: "object", name: "tools", label: "Tools I use (category and tool)", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.category || "Tool" }) },
            fields: [
              { type: "string", name: "category", label: "Category" },
              { type: "string", name: "tool", label: "Tool" },
            ],
          },
        ],
      },
      {
        name: "page_about",
        label: "About page",
        path: "src/content/pages",
        format: "md",
        match: { include: "about" },
        fields: [
          ...seoFields,
          ...headerFields,
          { type: "image", name: "figureImage", label: "Artwork" },
          { type: "string", name: "figureAlt", label: "Artwork alt text" },
          { type: "string", name: "figureCaption", label: "Artwork caption" },
          { type: "rich-text", name: "body", label: "Intro text (below artwork)", isBody: true },
          { type: "string", name: "experienceHeading", label: "Experience heading" },
          timelineField("experience", "Experience"),
          { type: "string", name: "educationHeading", label: "Education heading" },
          timelineField("education", "Education"),
        ],
      },
      {
        name: "page_contact",
        label: "Contact page",
        path: "src/content/pages",
        format: "md",
        match: { include: "contact" },
        fields: [
          ...seoFields,
          ...headerFields,
          { type: "string", name: "email", label: "Email address" },
          { type: "string", name: "linkedinUrl", label: "LinkedIn URL" },
          { type: "string", name: "linkedinLabel", label: "LinkedIn link text" },
        ],
      },
      {
        name: "page_builds_index",
        label: "Builds archive page",
        path: "src/content/pages",
        format: "md",
        match: { include: "builds-index" },
        fields: [...seoFields, ...headerFields],
      },
      {
        name: "page_mfan",
        label: "MFan 2026 page",
        path: "src/content/pages",
        format: "md",
        match: { include: "mfan-2026" },
        fields: [
          ...seoFields,
          ...headerFields,
          { type: "string", name: "storyLinkLabel", label: "Project story link label" },
          { type: "string", name: "releasesHeading", label: "Release log heading" },
          {
            type: "object",
            name: "releases",
            label: "Release log entries",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.heading }) },
            fields: [
              { type: "string", name: "heading", label: "Version and date" },
              { type: "string", name: "body", label: "Notes", ui: { component: "textarea" } },
            ],
          },
          { type: "string", name: "termsHeading", label: "Terms heading" },
          { type: "string", name: "privacyHeading", label: "Privacy heading" },
        ],
      },
      {
        name: "page_mfan_terms",
        label: "MFan 2026 terms text",
        path: "src/content/pages",
        format: "md",
        match: { include: "mfan-terms" },
        fields: [
          { type: "string", name: "title", label: "Internal title", required: true },
          { type: "string", name: "description", label: "Internal description" },
          { type: "rich-text", name: "body", label: "Terms text", isBody: true },
        ],
      },
      {
        name: "page_mfan_privacy",
        label: "MFan 2026 privacy text",
        path: "src/content/pages",
        format: "md",
        match: { include: "mfan-privacy" },
        fields: [
          { type: "string", name: "title", label: "Internal title", required: true },
          { type: "string", name: "description", label: "Internal description" },
          { type: "rich-text", name: "body", label: "Privacy text", isBody: true },
        ],
      },
    ],
  },
});
