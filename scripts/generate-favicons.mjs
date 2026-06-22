/**
 * generate-favicons.mjs
 *
 * Favicon-Generator für Astro-Projekte (Cross-Projekt-Standard).
 * Liest public/favicon.svg als Single Source und erzeugt:
 *   - public/favicon-96x96.png  (96x96 für moderne Browser)
 *   - public/apple-touch-icon.png (180x180 für iOS/Safari Home-Screen)
 *   - public/favicon.ico  (Multi-Size: 16x16 + 32x32 + 48x48 für Google SERP)
 *
 * Verwendung: npm run favicons
 * Idempotent: mehrfaches Ausführen erzeugt identische Dateien.
 *
 * SERP-Hintergrund: Google lädt Favicons über /favicon.ico.
 * Fehlt diese Datei (404), zeigt Google den Standard-Globus statt
 * dem eigentlichen Website-Icon. Dieses Script behebt das Problem.
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Verzeichnisse relativ zum Script-Standort auflösen
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPfad = join(publicDir, 'favicon.svg');

// SVG-Quelldatei einlesen
const svgBuffer = readFileSync(svgPfad);

/**
 * Hilfsfunktion: SVG zu PNG-Buffer in gewünschter Größe rasterisieren.
 * sharp verarbeitet SVG über eingebautes resvg/libvips.
 * Transparenter Hintergrund bleibt erhalten (kein flatten).
 */
async function rasterisieren(breite, hoehe) {
  return sharp(svgBuffer)
    .resize(breite, hoehe, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  console.log('Favicon-Generator gestartet...');
  console.log(`Quelle: ${svgPfad}`);
  console.log('');

  // --- 96x96 PNG für Browser ---
  const png96 = await rasterisieren(96, 96);
  const pfad96 = join(publicDir, 'favicon-96x96.png');
  writeFileSync(pfad96, png96);
  console.log(`favicon-96x96.png  geschrieben (96x96 px, ${png96.length} Bytes)`);

  // --- 180x180 PNG für Apple Touch Icon ---
  const png180 = await rasterisieren(180, 180);
  const pfadApple = join(publicDir, 'apple-touch-icon.png');
  writeFileSync(pfadApple, png180);
  console.log(`apple-touch-icon.png  geschrieben (180x180 px, ${png180.length} Bytes)`);

  // --- Multi-Size ICO (16+32+48) für Google SERP ---
  // Zwischengrößen als Buffer erzeugen (werden NICHT als Einzeldateien geschrieben)
  const png16 = await rasterisieren(16, 16);
  const png32 = await rasterisieren(32, 32);
  const png48 = await rasterisieren(48, 48);

  // ICO aus den drei PNG-Buffern zusammenbauen
  const icoBuffer = await pngToIco([png16, png32, png48]);
  const pfadIco = join(publicDir, 'favicon.ico');
  writeFileSync(pfadIco, icoBuffer);
  console.log(`favicon.ico           geschrieben (16+32+48 px, ${icoBuffer.length} Bytes)`);

  // --- favicon.svg bleibt unverändert ---
  console.log('');
  console.log('favicon.svg  unveraendert (Single Source)');
  console.log('');
  console.log('Fertig. Alle 4 Favicon-Dateien liegen in public/');
}

main().catch((fehler) => {
  console.error('Fehler beim Generieren der Favicons:', fehler);
  process.exit(1);
});
