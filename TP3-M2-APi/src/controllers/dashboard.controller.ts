import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  public constructor(private readonly dashboard = new DashboardService()) {}

  public kpis = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.dashboard.kpis(request.params.eventId as string));
  };
}
