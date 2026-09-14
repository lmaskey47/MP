import { DashboardRepository } from "../repositories/dashboard.repository";
import { ObjectId } from "../utils/objectId";

export class DashboardService {
  public constructor(private readonly dashboard = new DashboardRepository()) {}

  public kpis(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.dashboard.getEventKpis(eventId);
  }
}
