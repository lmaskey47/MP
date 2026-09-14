import { Types } from "mongoose";
import { AnomalyModel } from "../models/anomaly.model";
import { DeliveryModel } from "../models/delivery.model";
import { ItemModel } from "../models/item.model";
import { TaskModel } from "../models/task.model";

export class DashboardRepository {
  public async getEventKpis(eventId: string): Promise<Record<string, unknown>> {
    const objectEventId = new Types.ObjectId(eventId);
    const [stockByStatus, carbon, tasksByStatus, deliveriesByStatus, anomaliesBySeverity] = await Promise.all([
      ItemModel.aggregate([{ $match: { eventId: objectEventId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      ItemModel.aggregate([{ $match: { eventId: objectEventId } }, { $group: { _id: null, totalCarbonKg: { $sum: "$carbonKg" } } }]),
      TaskModel.aggregate([{ $match: { eventId: objectEventId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      DeliveryModel.aggregate([{ $match: { eventId: objectEventId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      AnomalyModel.aggregate([{ $match: { eventId: objectEventId } }, { $group: { _id: "$severity", count: { $sum: 1 } } }])
    ]);

    return {
      stockByStatus,
      carbon: carbon[0] ?? { totalCarbonKg: 0 },
      tasksByStatus,
      deliveriesByStatus,
      anomaliesBySeverity
    };
  }
}
