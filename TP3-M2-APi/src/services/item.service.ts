import { ItemStatus } from "../models/item.model";
import type { GeoPoint } from "../models/base.model";
import { ItemRepository } from "../repositories/item.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

type ItemAction = "scanned" | "moved" | "transferred" | "maintenance";

export class ItemService {
  public constructor(private readonly items = new ItemRepository()) {}

  public list(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.items.findByEvent(eventId);
  }

  public create(eventId: string, data: Record<string, unknown>) {
    ObjectId.assert(eventId, "event id");
    return this.items.create({ ...data, eventId } as never);
  }

  public async get(id: string) {
    ObjectId.assert(id, "item id");
    const item = await this.items.findById(id);
    // 404 : aucun equipement ne correspond a cet identifiant.
    if (!item) throw new HttpError(404, "Item not found");
    return item;
  }

  public async update(id: string, data: Record<string, unknown>) {
    ObjectId.assert(id, "item id");
    const item = await this.items.updateById(id, data as never);
    // 404 : impossible de modifier un equipement qui n'existe pas.
    if (!item) throw new HttpError(404, "Item not found");
    return item;
  }

  public async delete(id: string) {
    ObjectId.assert(id, "item id");
    const item = await this.items.deleteById(id);
    // 404 : impossible de supprimer un equipement introuvable.
    if (!item) throw new HttpError(404, "Item not found");
    return item;
  }

  public async scan(id: string, data: { actorId: string; location?: GeoPoint; details?: Record<string, unknown> }) {
    return this.addHistory(id, { status: ItemStatus.InTransit }, "scanned", data);
  }

  public async move(id: string, data: { actorId: string; toZone: string; location?: GeoPoint }) {
    const item = await this.get(id);
    return this.addHistory(id, { zoneCode: data.toZone, status: ItemStatus.InTransit }, "moved", {
      actorId: data.actorId,
      location: data.location,
      fromZone: item.zoneCode,
      toZone: data.toZone
    });
  }

  public transfer(id: string, data: { actorId: string; responsibleUserId: string }) {
    return this.addHistory(id, { responsibleUserId: data.responsibleUserId }, "transferred", data);
  }

  public maintenance(id: string, data: { actorId: string; details?: Record<string, unknown> }) {
    return this.addHistory(id, { status: ItemStatus.Maintenance }, "maintenance", data);
  }

  private async addHistory(id: string, update: Record<string, unknown>, action: ItemAction, data: Record<string, unknown>) {
    ObjectId.assert(id, "item id");
    const item = await this.items.appendHistory(id, update as never, {
      action,
      at: new Date(),
      actorId: String(data.actorId),
      location: data.location as never,
      fromZone: data.fromZone as string | undefined,
      toZone: data.toZone as string | undefined,
      details: data.details as Record<string, unknown> | undefined
    });
    // 404 : l'equipement vise par l'action terrain n'existe pas.
    if (!item) throw new HttpError(404, "Item not found");
    return item;
  }
}
