import type { Request, Response } from "express";
import { DeliveryService } from "../services/delivery.service";
import { Schemas } from "../validators/schemas";

export class DeliveryController {
  public constructor(private readonly deliveries = new DeliveryService()) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.deliveries.list(request.params.eventId as string));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.deliveries.create(request.params.eventId as string, Schemas.deliveryCreate.parse(request.body)));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.deliveries.update(request.params.deliveryId as string, Schemas.deliveryPatch.parse(request.body)));
  };

  public validateRouteSheet = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.deliveries.validateRouteSheet(request.params.deliveryId as string));
  };
}
