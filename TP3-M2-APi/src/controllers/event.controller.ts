import type { Request, Response } from "express";
import { EventService } from "../services/event.service";
import { Schemas } from "../validators/schemas";

export class EventController {
  public constructor(private readonly events = new EventService()) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json((await this.events.list()).filter(event=>request.auth!.eventIds.includes(String(event._id))));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.events.create(Schemas.eventCreate.parse(request.body),request.auth!.sub));
  };

  public get = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.events.get(request.params.eventId as string));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.events.update(request.params.eventId as string, Schemas.eventPatch.parse(request.body)));
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.events.delete(request.params.eventId as string);
    response.status(204).send();
  };
}
