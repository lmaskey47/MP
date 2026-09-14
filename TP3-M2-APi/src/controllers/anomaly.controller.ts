import type { Request, Response } from "express";
import { AnomalyService } from "../services/anomaly.service";
import { Schemas } from "../validators/schemas";

export class AnomalyController {
  public constructor(private readonly anomalies = new AnomalyService()) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.anomalies.list(request.params.eventId as string));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.anomalies.create(request.params.eventId as string, Schemas.anomalyCreate.parse(request.body)));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.anomalies.update(request.params.anomalyId as string, Schemas.anomalyPatch.parse(request.body)));
  };
}
