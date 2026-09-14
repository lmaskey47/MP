import { BaseRepository } from "./base.repository";
import { NotificationModel, type NotificationDocument } from "../models/notification.model";

export class NotificationRepository extends BaseRepository<NotificationDocument> {
  public constructor() {
    super(NotificationModel);
  }

  public findUnreadByRecipient(recipientId: string): Promise<NotificationDocument[]> {
    return NotificationModel.find({ recipientId, readAt: { $exists: false } }).sort({ createdAt: -1 }).exec();
  }

  public markAsRead(id: string, recipientId: string): Promise<NotificationDocument | null> {
    return NotificationModel.findOneAndUpdate({ _id: id, recipientId }, { readAt: new Date() }, { new: true }).exec();
  }
}
