import { NotificationRepository } from "../repositories/notification.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

export class NotificationService {
  public constructor(private readonly notifications = new NotificationRepository()) {}

  public create(data: Record<string, unknown>) {
    return this.notifications.create(data as never);
  }

  public listUnread(recipientId: string) {
    ObjectId.assert(recipientId, "recipient id");
    return this.notifications.findUnreadByRecipient(recipientId);
  }

  public async markAsRead(id: string, recipientId: string) {
    ObjectId.assert(id, "notification id");
    ObjectId.assert(recipientId, "recipient id");
    const notification = await this.notifications.markAsRead(id, recipientId);
    // 404 : aucune notification non lue ne correspond a cet identifiant pour ce destinataire.
    if (!notification) throw new HttpError(404, "Notification not found");
    return notification;
  }
}
