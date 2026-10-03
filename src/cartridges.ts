export const CARTRIDGES = [
  {
    id: 'starfall',
    title: 'LANTERN TRAIL',
    number: '01',
    short: 'LANTERN TRAIL',
    edition: 'A LITTLE STAR ADVENTURE',
  },
] as const;
export type CartridgeId = (typeof CARTRIDGES)[number]['id'];
export function cartridge(_id: CartridgeId) {
  return CARTRIDGES[0];
}
