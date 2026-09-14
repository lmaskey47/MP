import { BaseRepository } from "./base.repository";
import { EventModel, type EventDocument } from "../models/event.model";

export class EventRepository extends BaseRepository<EventDocument> {
  public constructor() {
    super(EventModel);
  }
}
