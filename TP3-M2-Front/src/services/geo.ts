import type { EventZone } from '../types/api';
export function validateZones(text: string): EventZone[] {
  const zones: EventZone[] = JSON.parse(text);
  if (!Array.isArray(zones))
    throw new Error('Les zones doivent être une liste GeoJSON.');
  const codes = new Set<string>();
  for (const zone of zones) {
    if (!zone.code?.trim() || !zone.label?.trim() || codes.has(zone.code))
      throw new Error('Chaque zone doit avoir un code unique et un libellé.');
    codes.add(zone.code);
    if (
      !['storage', 'delivery', 'maintenance', 'public', 'restricted'].includes(
        zone.kind,
      ) ||
      zone.boundary?.type !== 'Polygon'
    )
      throw new Error('Type de zone ou polygone invalide.');
    if (!zone.boundary.coordinates.length) throw new Error('Polygone vide.');
    for (const ring of zone.boundary.coordinates) {
      if (
        ring.length < 4 ||
        ring.some(
          p =>
            p.length !== 2 ||
            !p.every(Number.isFinite) ||
            Math.abs(p[0]) > 180 ||
            Math.abs(p[1]) > 90,
        ) ||
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      )
        throw new Error(
          'Chaque contour doit avoir au moins 4 coordonnées valides et être fermé.',
        );
    }
  }
  return zones;
}
export function projection(points: number[][], width = 340, height = 330) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const cos = Math.max(0.01, Math.cos((((minY + maxY) / 2) * Math.PI) / 180));
  const scale = Math.min(
    (width - 40) / Math.max((maxX - minX) * cos, 0.0001),
    (height - 40) / Math.max(maxY - minY, 0.0001),
  );
  return (p: number[]) => [
    width / 2 + (p[0] - (minX + maxX) / 2) * cos * scale,
    height / 2 - (p[1] - (minY + maxY) / 2) * scale,
  ];
}
