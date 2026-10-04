export const CARTRIDGES = [
  {
    id: 'starfall',
    title: 'COMET TRAIL',
    number: '01',
    short: 'COMET TRAIL',
    edition: 'A LITTLE STAR ADVENTURE',
  },
] as const;
export type CartridgeId = (typeof CARTRIDGES)[number]['id'];
export function cartridge(_id: CartridgeId) {
  return CARTRIDGES[0];
}
