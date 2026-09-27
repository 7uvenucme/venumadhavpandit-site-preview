import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_BRANCH || process.env.HEAD || "main";

// Blank fields should fail in the editor, not quietly publish missing content.
const nonBlank = (label: string) => ({ validate: (value: string) =>
  typeof value === "string" && value.trim().length > 0 ? undefined : `${label} cannot be blank.` });
const requiredText = (name: string, label: string, extra: Record<string, unknown> = {}) =>
  ({ type: "string" as const, name, label, required: true, ui: { ...nonBlank(label), ...extra } });
const requiredImage = (name: string, label: string) =>
  ({ type: "image" as const, name, label, required: true, ui: nonBlank(label) });

const seoFields = [
  requiredText("title", "SEO title"),
  requiredText("description", "SEO description", { component: "textarea" }),
];

const headerFields = [
  requiredText("eyebrow", "Eyebrow (small label above the title)"),
  requiredText("pageTitle", "Page title"),
  requiredText("lede", "Intro paragraph", { component: "textarea" }),
];

const timelineField = (name: string, label: string) => ({
  type: "object" as const,
  name,
  label,
  list: true,
  required: true,
  ui: { itemProps: (item: any) => ({ label: item?.org }) },
  fields: [
    requiredText("years", "Years"),
    requiredText("org", "Organization"),
    requiredText("role", "Role"),
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
          requiredImage("image", "Main image (top of project page)"),
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
          requiredText("heroEyebrow", "Hero eyebrow"),
          requiredText("heroTitle", "Hero headline (HTML like <em> allowed)"),
          requiredText("heroIntro", "Hero intro", { component: "textarea" }),
          requiredText("heroButtonLabel", "Hero button label"),
          requiredImage("heroImage", "Hero artwork"),
          requiredText("heroImageAlt", "Hero artwork alt text"),
          requiredText("heroImageCaption", "Hero artwork caption"),
          requiredText("sectionEyebrow", "Projects section eyebrow"),
          requiredText("sectionTitle", "Projects section title"),
          requiredText("sectionLinkLabel", "Projects section link label"),
          requiredText("shippedTitle", "Work updates section title"),
          { type: "object", name: "shippedUpdates", label: "Shipped updates (newest first)", list: true, required: true,
            ui: { itemProps: (item: any) => ({ label: `${item?.month || "Month"} · ${item?.text || "Update"}` }) },
            fields: [
              { type: "string", name: "month", label: "Month (YYYY-MM)", required: true, ui: { validate: (value: string) => /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value || "") ? undefined : "Use YYYY-MM, for example 2026-09." } },
              requiredText("text", "Update text", { component: "textarea" }),
              { type: "string", name: "link", label: "Link (optional)" },
              { type: "string", name: "linkLabel", label: "Link description (optional, e.g. Say hi)" },
              { type: "image", name: "image", label: "Image (optional)" },
              { type: "string", name: "imageAlt", label: "Image description" },
              { type: "string", name: "videoUrl", label: "Video file URL (optional, direct .mp4/.webm)" },
            ],
          },
          requiredText("artworkTitle", "Artwork section title"),
          { type: "object", name: "artworks", required: true, label: "Recent artwork", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.alt || "Artwork" }) },
            fields: [
              requiredImage("image", "Full artwork"),
              { type: "image", name: "thumbnail", label: "Thumbnail (optional)" },
              requiredText("alt", "Artwork description (alt text)"),
            ],
          },
          requiredText("readingTitle", "Reading section title"),
          requiredText("bookTitle", "Book title"),
          requiredImage("bookCover", "Book cover"),
          requiredText("bookCoverAlt", "Book cover description"),
          requiredText("bookQuote", "Highlighted quote", { component: "textarea" }),
          requiredText("hobbiesTitle", "Current interests section title"),
          { type: "object", name: "hobbies", required: true, label: "Current interests", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.name || "Interest" }) },
            fields: [
              requiredText("name", "Name"),
              requiredText("detail", "One line"),
              { type: "string", name: "icon", label: "Icon", required: true, options: ["cube", "dumbbell", "keyboard", "book", "pencil", "music"] },
            ],
          },
          requiredText("playlistTitle", "Playlist section title"),
          requiredText("playlistUrl", "Spotify playlist URL"),
          requiredText("toolsTitle", "Tools section title"),
          { type: "object", name: "tools", required: true, label: "Tools I use (category and tool)", list: true,
            ui: { itemProps: (item: any) => ({ label: item?.category || "Tool" }) },
            fields: [
              requiredText("category", "Category"),
              requiredText("tool", "Tool"),
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
          requiredImage("figureImage", "Artwork"),
          requiredText("figureAlt", "Artwork alt text"),
          requiredText("figureCaption", "Artwork caption"),
          { type: "rich-text", name: "body", label: "Intro text (below artwork)", isBody: true },
          requiredText("experienceHeading", "Experience heading"),
          timelineField("experience", "Experience"),
          requiredText("educationHeading", "Education heading"),
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
          requiredText("email", "Email address"),
          requiredText("linkedinUrl", "LinkedIn URL"),
          requiredText("linkedinLabel", "LinkedIn link text"),
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
          requiredText("storyLinkLabel", "Project story link label"),
          requiredText("releasesHeading", "Release log heading"),
          {
            type: "object",
            name: "releases",
            required: true,
            label: "Release log entries",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.heading }) },
            fields: [
              requiredText("heading", "Version and date"),
              requiredText("body", "Notes", { component: "textarea" }),
            ],
          },
          requiredText("termsHeading", "Terms heading"),
          requiredText("privacyHeading", "Privacy heading"),
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
