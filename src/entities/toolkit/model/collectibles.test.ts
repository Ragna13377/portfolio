import { expect, test } from 'vitest';
import {
  readableGlyphColor,
  TOOLKIT_COLLECTIBLES,
  TOOLKIT_GROUPS,
} from './collectibles';

test('every skill appears in exactly one section', () => {
  const ids = TOOLKIT_GROUPS.flatMap((group) =>
    group.items.map((item) => item.id),
  );
  expect(ids).toHaveLength(25);
  expect(new Set(ids)).toEqual(
    new Set(TOOLKIT_COLLECTIBLES.map((item) => item.id)),
  );
});

test('bright glyphs retain brand colors while dark glyphs become light on dark tiles', () => {
  for (const color of ['#00FF74', '#F7DF1E', '#EC5990', '#ECE8D1'])
    expect(readableGlyphColor(color)).toBe(color);
  for (const color of ['#000000', '#2D3748', '#010101', '#2C3E50'])
    expect(readableGlyphColor(color)).toBe('#F4EAD9');
});
