import { validateZones, projection } from '../src/services/geo';
import { validateAction } from '../src/services/operations';
const zone = {
  code: 'A',
  label: 'Stock',
  kind: 'storage',
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [2, 48],
        [3, 48],
        [3, 49],
        [2, 48],
      ],
    ],
  },
};
test('valid GeoJSON is accepted', () =>
  expect(validateZones(JSON.stringify([zone]))).toHaveLength(1));
test('unclosed polygons are refused', () =>
  expect(() =>
    validateZones(
      JSON.stringify([
        {
          ...zone,
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [2, 48],
                [3, 48],
                [3, 49],
                [2, 49],
              ],
            ],
          },
        },
      ]),
    ),
  ).toThrow('fermé'));
test('duplicate zone codes are refused', () =>
  expect(() => validateZones(JSON.stringify([zone, zone]))).toThrow('unique'));
test('projection fits points within view', () => {
  const project = projection([
    [2, 48],
    [3, 49],
  ]);
  for (const p of [
    [2, 48],
    [3, 49],
  ]) {
    const [x, y] = project(p);
    expect(x).toBeGreaterThanOrEqual(19);
    expect(x).toBeLessThanOrEqual(321);
    expect(y).toBeGreaterThanOrEqual(19);
    expect(y).toBeLessThanOrEqual(311);
  }
});
test('invalid anomaly GPS is refused locally', () =>
  expect(() =>
    validateAction('anomaly', 'report', {
      message: 'Danger',
      severity: 'high',
      location: { coordinates: [400, 48] },
    }),
  ).toThrow('GPS'));
test('empty anomaly description is refused locally', () =>
  expect(() =>
    validateAction('anomaly', 'report', {
      message: ' ',
      severity: 'high',
      location: { coordinates: [2, 48] },
    }),
  ).toThrow('Décrivez'));
