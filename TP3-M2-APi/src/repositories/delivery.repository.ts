import { BaseRepository } from "./base.repository";
import { DeliveryModel, type DeliveryDocument } from "../models/delivery.model";

export class DeliveryRepository extends BaseRepository<DeliveryDocument> {
  public constructor() {
    super(DeliveryModel);
  }

  public findByEvent(eventId: string): Promise<DeliveryDocument[]> {
    return DeliveryModel.find({ eventId }).sort({ createdAt: -1 }).exec();
  }
}
