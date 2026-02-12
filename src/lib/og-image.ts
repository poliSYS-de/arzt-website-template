import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "../site.config";

const WIDTH = 1200;
const HEIGHT = 630;

let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;

  // Try local TTF/OTF first (if user added one)
  const localTtf = path.resolve("public/fonts/inter-700.ttf");
  if (fs.existsSync(localTtf)) {
    fontCache = fs.readFileSync(localTtf).buffer as ArrayBuffer;
    return fontCache;
  }

  // Fetch Inter Bold from Google Fonts API
  const resp = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } }
  );
  const css = await resp.text();

  // Extract TTF/WOFF URL from CSS (Google returns TTF for this user-agent)
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error("Could not extract font URL from Google Fonts CSS");

  const fontResp = await fetch(urlMatch[1]);
  fontCache = await fontResp.arrayBuffer();
  return fontCache;
}

async function loadPortraitBase64(): Promise<string | null> {
  if (!siteConfig.og.portrait) return null;

  const portraitPath = path.resolve(`public${siteConfig.og.portrait}`);
  if (!fs.existsSync(portraitPath)) return null;

  // Skip tiny placeholder images (< 1KB)
  const stat = fs.statSync(portraitPath);
  if (stat.size < 1024) return null;

  try {
    // Convert to PNG for satori compatibility (webp not supported in img src)
    const pngBuffer = await sharp(portraitPath)
      .resize(280, 280, { fit: "cover" })
      .png()
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch {
    // If image can't be processed, skip portrait
    return null;
  }
}

interface OgImageOptions {
  title: string;
  description: string;
}

export async function generateOgImage({
  title,
  description,
}: OgImageOptions): Promise<Buffer> {
  const font = await loadFont();
  const portrait = await loadPortraitBase64();
  const accentColor = siteConfig.branding.colors.accent;
  const domain = siteConfig.domain.replace("https://", "").replace("http://", "");

  // Truncate long descriptions
  const maxDescLen = 120;
  const desc =
    description.length > maxDescLen
      ? description.slice(0, maxDescLen - 1) + "\u2026"
      : description;

  // Truncate long titles
  const maxTitleLen = 60;
  const displayTitle =
    title.length > maxTitleLen
      ? title.slice(0, maxTitleLen - 1) + "\u2026"
      : title;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: accentColor,
          padding: "60px 70px",
          fontFamily: "Inter",
        },
        children: [
          // Left: Text content
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: portrait ? "1 1 65%" : "1 1 100%",
                maxWidth: portrait ? "700px" : "1060px",
                paddingRight: portrait ? "40px" : "0",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: displayTitle.length > 35 ? "42px" : "52px",
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.2,
                      marginBottom: "16px",
                    },
                    children: displayTitle,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "rgba(255, 255, 255, 0.75)",
                      lineHeight: 1.4,
                      marginBottom: "32px",
                    },
                    children: desc,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                    children: domain,
                  },
                },
              ],
            },
          },
          // Right: Portrait (if configured)
          ...(portrait
            ? [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 280px",
                    },
                    children: {
                      type: "img",
                      props: {
                        src: portrait,
                        width: 280,
                        height: 280,
                        style: {
                          borderRadius: "50%",
                          border: "4px solid rgba(255, 255, 255, 0.3)",
                        },
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: "Inter",
          data: font,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();

  return pngBuffer;
}
