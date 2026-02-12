import { defineCollection, z } from 'astro:content';

const schwerpunkte = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    image_alt: z.string(),
    icon: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = {
  schwerpunkte,
};
