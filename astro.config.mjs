import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://beispiel-arzt.de',
  trailingSlash: 'always',
  integrations: [tailwind(), sitemap()],
  output: 'static',
});
