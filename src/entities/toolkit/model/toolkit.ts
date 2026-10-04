export type ToolkitCategoryId =
  | 'core'
  | 'data'
  | 'ui'
  | 'interaction'
  | 'tooling';

type ToolkitCategory = {
  id: ToolkitCategoryId;
  items: readonly string[];
};

export const TOOLKIT_CATEGORIES = [
  {
    id: 'core',
    items: ['React', 'Next.js', 'TypeScript', 'JavaScript'],
  },
  {
    id: 'data',
    items: [
      'TanStack Query',
      'Zustand',
      'Redux / Redux Toolkit',
      'Zod',
      'React Hook Form',
    ],
  },
  {
    id: 'ui',
    items: ['Tailwind CSS', 'shadcn/ui', 'Radix UI', 'SCSS'],
  },
  {
    id: 'interaction',
    items: ['DnD Kit', 'WebSocket', 'TanStack Virtual', '2GIS'],
  },
  {
    id: 'tooling',
    items: ['Docker', 'Storybook', 'Biome', 'Git', 'Prisma'],
  },
] as const satisfies readonly ToolkitCategory[];
