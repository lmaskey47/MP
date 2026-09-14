import { useEffect, useState } from 'react';
import { useWorkspace } from '../context/MobileContext';
import { validateZones } from '../services/geo';
import type { EventZone, GeoPoint } from '../types/api';
export function useEventEditor() {
  const { data, workspace } = useWorkspace();
  const [selected, setSelected] = useState('');
  const event =
    selected === 'new'
      ? undefined
      : data.events.find(e => e._id === selected) ?? data.events[0];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [zones, setZones] = useState('[]');
  const [status, setStatus] = useState('draft');
  const [longitude, setLongitude] = useState('2.3522');
  const [latitude, setLatitude] = useState('48.8566');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneLabel, setZoneLabel] = useState('');
  const [zoneKind, setZoneKind] = useState('storage');
  const [size, setSize] = useState('100');
  // Live refreshes must not overwrite an in-progress form.
  const eventId = event?._id;
  useEffect(() => {
    setName(event?.name ?? '');
    setDescription(event?.description ?? '');
    setStartsAt(event?.startsAt ?? new Date().toISOString());
    setEndsAt(event?.endsAt ?? new Date(Date.now() + 86400000).toISOString());
    setZones(JSON.stringify(event?.zones ?? [], null, 2));
    setStatus(event?.status ?? 'draft');
    setLongitude(String(event?.location.coordinates[0] ?? 2.3522));
    setLatitude(String(event?.location.coordinates[1] ?? 48.8566));
    // Reinitialise on selection, not on each SSE refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, selected]);
  function location(): GeoPoint {
    const x = Number(longitude.replace(',', '.')),
      y = Number(latitude.replace(',', '.'));
    if (
      !longitude.trim() ||
      !latitude.trim() ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      Math.abs(x) > 180 ||
      Math.abs(y) > 90
    )
      throw new Error('Coordonnées de l’événement invalides.');
    return { type: 'Point', coordinates: [x, y] };
  }
  let preview: EventZone[] = [];
  try {
    preview = validateZones(zones);
  } catch {}
  function addZone() {
    const [x, y] = location().coordinates;
    const meters = Number(size);
    if (!Number.isFinite(meters) || meters < 1 || meters > 10000)
      throw new Error('La taille doit être comprise entre 1 et 10 000 mètres.');
    const dy = meters / 222000,
      dx = dy / Math.max(0.01, Math.cos((y * Math.PI) / 180));
    const added = [
      ...validateZones(zones),
      {
        code: zoneCode.trim().toUpperCase(),
        label: zoneLabel.trim(),
        kind: zoneKind,
        boundary: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [x - dx, y - dy],
              [x + dx, y - dy],
              [x + dx, y + dy],
              [x - dx, y + dy],
              [x - dx, y - dy],
            ],
          ],
        },
      },
    ];
    setZones(JSON.stringify(validateZones(JSON.stringify(added)), null, 2));
    setZoneCode('');
    setZoneLabel('');
  }
  function removeZone(code: string) {
    setZones(
      JSON.stringify(
        validateZones(zones).filter(z => z.code !== code),
        null,
        2,
      ),
    );
  }
  async function save() {
    if (name.trim().length < 2)
      throw new Error('Le nom doit contenir au moins 2 caractères.');
    const start = new Date(startsAt),
      end = new Date(endsAt);
    if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start)
      throw new Error('La fin doit suivre le début.');
    const input = {
      name: name.trim(),
      description,
      status,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      location: location(),
      zones: validateZones(zones),
    };
    if (event) await workspace.updateEvent(event._id, input);
    else {
      const created = await workspace.createEvent(input);
      setSelected(created._id);
    }
  }
  return {
    events: data.events,
    event,
    selected,
    setSelected,
    name,
    setName,
    description,
    setDescription,
    startsAt,
    setStartsAt,
    endsAt,
    setEndsAt,
    zones,
    setZones,
    status,
    setStatus,
    save,
    longitude,
    setLongitude,
    latitude,
    setLatitude,
    zoneCode,
    setZoneCode,
    zoneLabel,
    setZoneLabel,
    zoneKind,
    setZoneKind,
    size,
    setSize,
    addZone,
    removeZone,
    preview,
  };
}
