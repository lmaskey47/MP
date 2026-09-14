import { EventRepository } from "../repositories/event.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";
import {UserRepository} from '../repositories/user.repository';

export class EventService {
  public constructor(private readonly events = new EventRepository()) {}

  public list() {
    return this.events.find();
  }

  public async create(data: Record<string, unknown>, creatorId?:string) {
    const event=await this.events.create(data as never);
    if(creatorId)await new UserRepository().updateById(creatorId,{$addToSet:{eventIds:event._id}});
    return event;
  }

  public async get(id: string) {
    ObjectId.assert(id, "event id");
    const event = await this.events.findById(id);
    // 404 : aucun evenement ne correspond a cet identifiant.
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  public async update(id: string, data: Record<string, unknown>) {
    ObjectId.assert(id, "event id");
    const event = await this.events.updateById(id, data as never);
    // 404 : impossible de modifier un evenement qui n'existe pas.
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  public async delete(id: string) {
    ObjectId.assert(id, "event id");
    const event = await this.events.deleteById(id);
    // 404 : impossible de supprimer un evenement introuvable.
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }
}
