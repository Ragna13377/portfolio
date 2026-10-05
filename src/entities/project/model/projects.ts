export const PROJECTS = [
  {
    id: 'transport-control',
    technologies: [
      { name: 'React', slug: 'react', mark: 'Re' },
      { name: 'TypeScript', slug: 'typescript', mark: 'TS' },
      { name: 'TanStack', slug: 'tanstack', mark: 'TV' },
      { name: '2GIS', slug: null, mark: '2G' },
    ],
  },
  {
    id: 'financial-platform',
    technologies: [
      { name: 'Next.js', slug: 'nextdotjs', mark: 'N' },
      { name: 'TypeScript', slug: 'typescript', mark: 'TS' },
      { name: 'Radix UI', slug: 'radixui', mark: 'Rx' },
      { name: 'Chart.js', slug: 'chartdotjs', mark: 'Ch' },
    ],
  },
  {
    id: 'facade-builder',
    technologies: [
      { name: 'React', slug: 'react', mark: 'Re' },
      { name: 'TypeScript', slug: 'typescript', mark: 'TS' },
      { name: 'Redux', slug: 'redux', mark: 'Rx' },
      { name: 'React DnD', slug: null, mark: 'DnD' },
    ],
  },
  {
    id: 'vps-control-panel',
    technologies: [
      { name: 'React', slug: 'react', mark: 'Re' },
      { name: 'Redux Toolkit', slug: 'redux', mark: 'Rx' },
      { name: 'MUI', slug: 'mui', mark: 'M' },
      { name: 'Storybook', slug: 'storybook', mark: 'S' },
    ],
  },
] as const;
