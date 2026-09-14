import { DeliveryStatus } from "../models/delivery.model";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

export class DeliveryService {
  public constructor(private readonly deliveries = new DeliveryRepository()) {}

  public list(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.deliveries.findByEvent(eventId);
  }

  public create(eventId: string, data: Record<string, unknown>) {
    ObjectId.assert(eventId, "event id");
    return this.deliveries.create({ ...data, eventId } as never);
  }

  public async update(id: string, data: Record<string, unknown>) {
    ObjectId.assert(id, "delivery id");
    const delivery = await this.deliveries.updateById(id, data as never);
    // 404 : aucune livraison ne correspond a cet identifiant.
    if (!delivery) throw new HttpError(404, "Delivery not found");
    return delivery;
  }

  public validateRouteSheet(id: string) {
    return this.update(id, { routeSheetValidated: true, status: DeliveryStatus.InTransit });
  }
}
