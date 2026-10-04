import icons from '../assets/simple-icons.json';

// Official glyphs/colors vendored from simple-icons 16.34.0 (CC0).
// Zustand has no glyph in this catalog and uses a neutral text mark.
const technologies = [
  ['React', 'react'],
  ['Next.js', 'nextdotjs'],
  ['TypeScript', 'typescript'],
  ['JavaScript', 'javascript'],
  ['TanStack Query', 'tanstack'],
  ['Zustand', null],
  ['Zod', 'zod'],
  ['React Hook Form', 'reacthookform'],
  ['Tailwind CSS', 'tailwindcss'],
  ['shadcn/ui', 'shadcnui'],
  ['Three.js / React Three Fiber', 'threedotjs'],
  ['Prisma', 'prisma'],
  ['Vite', 'vite'],
  ['Vitest', 'vitest'],
  ['Docker', 'docker'],
  ['Git', 'git'],
  ['Biome', 'biome'],
  ['Socket.IO', 'socketdotio'],
  ['NestJS', 'nestjs'],
  ['Node.js', 'nodedotjs'],
  ['pnpm', 'pnpm'],
  ['XState', 'xstate'],
  ['MUI', 'mui'],
  ['Storybook', 'storybook'],
  ['Lefthook', 'lefthook'],
] as const;

export const TOOLKIT_COLLECTIBLES = technologies.map(([name, slug]) => {
  const icon = slug ? icons[slug] : undefined;
  return {
    name,
    id: slug ?? 'zustand',
    icon,
    color: icon ? `#${icon.hex}` : '#D9C5AC',
    glyphColor: readableGlyphColor(icon ? `#${icon.hex}` : '#D9C5AC'),
    mark: 'Zu',
  };
});
export type ToolkitCollectible = (typeof TOOLKIT_COLLECTIBLES)[number];

// Preserve brand colors wherever they are readable on the dark tile.
// Dark glyphs use a light monochrome treatment; their accent stays branded.
export function readableGlyphColor(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => {
      const channel = Number.parseInt(value, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    }) ?? [0, 0, 0];
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / (0.0065 + 0.05) >= 3 ? hex : '#F4EAD9';
}

export const TOOLKIT_GROUPS = [
  { id: 'core', items: ['react', 'nextdotjs', 'typescript', 'javascript'] },
  {
    id: 'data',
    items: ['tanstack', 'zustand', 'zod', 'reacthookform', 'xstate'],
  },
  { id: 'ui', items: ['tailwindcss', 'shadcnui', 'threedotjs', 'mui'] },
  { id: 'backend', items: ['prisma', 'socketdotio', 'nestjs', 'nodedotjs'] },
  {
    id: 'tooling',
    items: [
      'vite',
      'vitest',
      'docker',
      'git',
      'biome',
      'pnpm',
      'storybook',
      'lefthook',
    ],
  },
].map((group) => ({
  ...group,
  items: group.items.map((id) => {
    const item = TOOLKIT_COLLECTIBLES.find((item) => item.id === id);
    if (!item) throw new Error(`Unknown toolkit item: ${id}`);
    return item;
  }),
}));
