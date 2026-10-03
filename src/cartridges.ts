export const CARTRIDGES = [
  {
    id: 'starfall',
    title: 'STARFALL ARCHIVE',
    number: '01',
    short: 'STARFALL',
    edition: 'CELESTIAL ADVENTURE',
  },
  {
    id: 'nightshift',
    title: 'NIGHTSHIFT SIGNAL',
    number: '02',
    short: 'NIGHTSHIFT',
    edition: 'MIDNIGHT FREQUENCY',
  },
] as const;
export type CartridgeId = (typeof CARTRIDGES)[number]['id'];
export function cartridge(id: CartridgeId) {
  return CARTRIDGES.find((item) => item.id === id) ?? CARTRIDGES[0];
}
