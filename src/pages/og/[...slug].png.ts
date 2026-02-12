import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../../site.config";
import { generateOgImage } from "../../lib/og-image";

interface OgPage {
  slug: string;
  title: string;
  description: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pages: OgPage[] = [
    {
      slug: "index",
      title: siteConfig.owner.name,
      description: `${siteConfig.owner.role} in ${siteConfig.owner.location}`,
    },
    {
      slug: "ueber-mich",
      title: "Über mich",
      description: `${siteConfig.owner.name} — ${siteConfig.owner.role}`,
    },
    {
      slug: "kontakt",
      title: "Kontakt",
      description: `${siteConfig.owner.name} — ${siteConfig.owner.role} in ${siteConfig.owner.location}`,
    },
    {
      slug: "schwerpunkte",
      title: "Schwerpunkte",
      description: `Behandlungsschwerpunkte von ${siteConfig.owner.name}`,
    },
    {
      slug: "impressum",
      title: "Impressum",
      description: siteConfig.domain.replace("https://", ""),
    },
    {
      slug: "datenschutz",
      title: "Datenschutz",
      description: siteConfig.domain.replace("https://", ""),
    },
  ];

  // Schwerpunkte aus Content Collection
  if (siteConfig.features.schwerpunkte) {
    const schwerpunkte = await getCollection("schwerpunkte");
    for (const entry of schwerpunkte) {
      pages.push({
        slug: `schwerpunkte/${entry.slug}`,
        title: entry.data.title,
        description: entry.data.description,
      });
    }
  }

  return pages.map((page) => ({
    params: { slug: page.slug },
    props: { title: page.title, description: page.description },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };

  const png = await generateOgImage({ title, description });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
