#!/usr/bin/env node

/**
 * Post-Deploy Link-Check
 *
 * Crawlt die Live-Site, extrahiert alle internen Links und prueft HTTP-Status.
 * Generisch fuer alle Astro-Projekte die site.config.ts / astro.config.mjs nutzen.
 *
 * Nutzung:
 *   node scripts/check-links.mjs                  # Domain aus Config
 *   SITE_URL=https://example.com node scripts/check-links.mjs  # Explizit
 *
 * HTTP Basic Auth (fuer passwortgeschuetzte Sites):
 *   SITE_USER=admin SITE_PASS=geheim node scripts/check-links.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Domain ermitteln
// ---------------------------------------------------------------------------

function getSiteUrl() {
  // 1. Env-Variable (hoechste Prioritaet — fuer CI)
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, "");
  }

  // 2. astro.config.mjs → site: '...'
  try {
    const cfg = readFileSync(resolve("astro.config.mjs"), "utf-8");
    const m = cfg.match(/site:\s*['"]([^'"]+)['"]/);
    if (m) return m[1].replace(/\/+$/, "");
  } catch {
    /* ignore */
  }

  // 3. src/site.config.ts → domain: '...'
  try {
    const cfg = readFileSync(resolve("src/site.config.ts"), "utf-8");
    const m = cfg.match(/domain:\s*['"]([^'"]+)['"]/);
    if (m) return m[1].replace(/\/+$/, "");
  } catch {
    /* ignore */
  }

  console.error("Keine Site-URL gefunden. Setze SITE_URL oder pruefe astro.config.mjs");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch mit Timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = { "User-Agent": "poliSYS-LinkChecker/1.0" };

  // HTTP Basic Auth (fuer .htpasswd-geschuetzte Sites)
  if (process.env.SITE_USER && process.env.SITE_PASS) {
    const cred = Buffer.from(`${process.env.SITE_USER}:${process.env.SITE_PASS}`).toString("base64");
    headers["Authorization"] = `Basic ${cred}`;
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
    const html = res.ok ? await res.text() : "";
    return { url, status: res.status, ok: res.ok, html };
  } catch (err) {
    const msg = err.name === "AbortError" ? "TIMEOUT" : err.message;
    return { url, status: 0, ok: false, html: "", error: msg };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Interne Links extrahieren
// ---------------------------------------------------------------------------

function extractInternalLinks(html, baseUrl) {
  const links = new Set();
  const regex = /href=["']([^"'#]+?)["']/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let href = match[1].trim();

    // Skip: externe, mailto, tel, javascript, unaufgeloeste Template-Literals
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    if (href.includes("${")) continue;
    if (href.startsWith("http") && !href.startsWith(baseUrl)) continue;

    // Relative → absolute
    if (href.startsWith("/")) {
      href = baseUrl + href;
    } else if (!href.startsWith("http")) {
      continue;
    }

    // Query + Fragment entfernen
    href = href.split("?")[0].split("#")[0];

    // Assets ueberspringen
    if (/\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|pdf|xml|txt|json|map)$/i.test(href)) {
      continue;
    }

    // Trailing Slash normalisieren (Astro: trailingSlash: 'always')
    if (!href.endsWith("/")) href += "/";

    links.add(href);
  }

  return links;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const siteUrl = getSiteUrl();
  console.log(`\n  Link-Check: ${siteUrl}\n`);

  const visited = new Set();
  const queue = [siteUrl + "/"];
  const results = [];

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    const result = await fetchWithTimeout(url);
    results.push(result);

    // Neue interne Links aus erfolgreichen Seiten sammeln
    if (result.ok && result.html) {
      for (const link of extractInternalLinks(result.html, siteUrl)) {
        if (!visited.has(link)) queue.push(link);
      }
    }
  }

  // --- Ergebnis-Tabelle ---
  const colUrl = 50;
  const colStatus = 8;
  const line = "\u2500".repeat(colUrl + colStatus + 12);

  console.log(line);
  console.log(`${"URL".padEnd(colUrl)} ${"Status".padEnd(colStatus)} Ergebnis`);
  console.log(line);

  let errors = 0;

  for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
    const short = r.url.replace(siteUrl, "") || "/";
    const status = r.error || String(r.status);
    const label = r.ok ? "OK" : "FEHLER";

    if (!r.ok) errors++;

    console.log(`${short.padEnd(colUrl)} ${status.padEnd(colStatus)} ${label}`);
  }

  console.log(line);
  console.log(`\n  ${results.length} Links geprueft, ${errors} Fehler\n`);

  if (errors > 0) {
    console.error("Link-Check fehlgeschlagen — siehe Fehler oben.");
    process.exit(1);
  }

  console.log("Alle Links OK.");
}

main();
