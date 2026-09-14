import { MonitoringMetricRepository } from "../repositories/monitoringMetric.repository";
import { ObjectId } from "../utils/objectId";

export class MonitoringService {
  public constructor(private readonly metrics = new MonitoringMetricRepository()) {}

  public create(data: { eventId: string; source: string; name: "api_latency_ms" | "scan_count" | "sync_conflict_count" | "carbon_kg"; value: number; capturedAt?: Date }) {
    ObjectId.assert(data.eventId, "event id");
    return this.metrics.create({
      capturedAt: data.capturedAt ?? new Date(),
      metadata: { eventId: data.eventId, source: data.source },
      name: data.name,
      value: data.value
    } as never);
  }

  public list(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.metrics.findByEvent(eventId);
  }
}
