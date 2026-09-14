import type { Request, Response } from "express";
import { SyncService } from "../services/sync.service";
import { Schemas } from "../validators/schemas";
import {MobileRepository} from '../repositories/mobile.repository';
import {HttpError} from '../utils/httpError';
import {isManager} from '../services/mobile.service';

export class SyncController {
  public constructor(private readonly sync = new SyncService()) {}

  public apply = async (request: Request, response: Response): Promise<void> => {
    const data = Schemas.sync.parse(request.body);
    for(const operation of data.operations){
      const item=await new MobileRepository().entity('item',operation.itemId);
      if(!item||!request.auth!.eventIds.includes(String(item.eventId)))throw new HttpError(403,'Événement non assigné');
      if(operation.action==='transferred'&&!isManager(request.auth!))throw new HttpError(403,'Transfert réservé au responsable');
      operation.actorId=request.auth!.sub;
    }
    response.status(200).json(await this.sync.apply(data.operations));
  };
}
