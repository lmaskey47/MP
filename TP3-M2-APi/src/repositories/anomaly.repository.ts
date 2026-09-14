import { BaseRepository } from "./base.repository";
import { AnomalyModel, type AnomalyDocument } from "../models/anomaly.model";

export class AnomalyRepository extends BaseRepository<AnomalyDocument> {
  public constructor() {
    super(AnomalyModel);
  }

  public findByEvent(eventId: string): Promise<AnomalyDocument[]> {
    return AnomalyModel.find({ eventId }).sort({ createdAt: -1 }).exec();
  }
}
