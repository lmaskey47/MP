import { MonitoringMetricModel, type MonitoringMetricDocument } from "../models/monitoringMetric.model";

export class MonitoringMetricRepository {
  public create(data: Partial<MonitoringMetricDocument>): Promise<MonitoringMetricDocument> {
    return MonitoringMetricModel.create(data);
  }

  public findByEvent(eventId: string): Promise<MonitoringMetricDocument[]> {
    return MonitoringMetricModel.find({ "metadata.eventId": eventId }).sort({ capturedAt: -1 }).limit(500).exec();
  }
}
