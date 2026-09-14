import type { Request, Response } from "express";
import { ItemService } from "../services/item.service";
import { Schemas } from "../validators/schemas";

export class ItemController {
  public constructor(private readonly items = new ItemService()) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.list(request.params.eventId as string));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.items.create(request.params.eventId as string, Schemas.itemCreate.parse(request.body)));
  };

  public get = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.get(request.params.itemId as string));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.update(request.params.itemId as string, Schemas.itemPatch.parse(request.body)));
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.items.delete(request.params.itemId as string);
    response.status(204).send();
  };

  public scan = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.scan(request.params.itemId as string, Schemas.scan.parse(request.body)));
  };

  public move = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.move(request.params.itemId as string, Schemas.move.parse(request.body)));
  };

  public transfer = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.transfer(request.params.itemId as string, Schemas.transfer.parse(request.body)));
  };

  public maintenance = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.items.maintenance(request.params.itemId as string, Schemas.maintenance.parse(request.body)));
  };
}
