import { ItemStatus } from "../models/item.model";
import { AnomalyRepository } from "../repositories/anomaly.repository";
import { ItemRepository } from "../repositories/item.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

export class AnomalyService {
  public constructor(
    private readonly anomalies = new AnomalyRepository(),
    private readonly items = new ItemRepository()
  ) {}

  public list(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.anomalies.findByEvent(eventId);
  }

  public async create(eventId: string, data: Record<string, unknown>) {
    ObjectId.assert(eventId, "event id");
    const anomaly = await this.anomalies.create({ ...data, eventId } as never);
    await this.items.appendHistory(String(data.itemId), { status: ItemStatus.Damaged }, {
      action: "anomaly",
      at: new Date(),
      actorId: String(data.reporterId),
      location: data.location as never,
      details: { anomalyId: anomaly._id.toString(), severity: data.severity, message: data.message }
    });
    return anomaly;
  }

  public async update(id: string, data: Record<string, unknown>) {
    ObjectId.assert(id, "anomaly id");
    const anomaly = await this.anomalies.updateById(id, data as never);
    // 404 : aucune anomalie ne correspond a cet identifiant.
    if (!anomaly) throw new HttpError(404, "Anomaly not found");
    return anomaly;
  }
}
