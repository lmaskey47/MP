import type { Request, Response } from "express";
import { MonitoringService } from "../services/monitoring.service";
import { Schemas } from "../validators/schemas";

export class MonitoringController {
  public constructor(private readonly monitoring = new MonitoringService()) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.monitoring.create(Schemas.metricCreate.parse(request.body)));
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.monitoring.list(request.params.eventId as string));
  };
}
