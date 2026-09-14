import type { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { Schemas } from "../validators/schemas";

export class NotificationController {
  public constructor(private readonly notifications = new NotificationService()) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.notifications.create(Schemas.notificationCreate.parse(request.body)));
  };

  public unread = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.notifications.listUnread(request.params.recipientId as string));
  };

  public read = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.notifications.markAsRead(request.params.notificationId as string, request.params.recipientId as string));
  };
}
