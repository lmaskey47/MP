import { Types, type ClientSession, type UpdateQuery } from "mongoose";
import { BaseRepository } from "./base.repository";
import { ItemModel, ItemStatus, type ItemDocument, type ItemHistoryEntry } from "../models/item.model";

export class ItemRepository extends BaseRepository<ItemDocument> {
  public constructor() {
    super(ItemModel);
  }

  public findByEvent(eventId: string): Promise<ItemDocument[]> {
    return ItemModel.find({ eventId }).sort({ updatedAt: -1 }).exec();
  }

  public findByQrCode(eventId: string, qrCode: string): Promise<ItemDocument | null> {
    return ItemModel.findOne({ eventId, qrCode }).exec();
  }

  public appendHistory(
    id: string,
    update: UpdateQuery<ItemDocument>,
    entry: ItemHistoryEntry,
    session?: ClientSession
  ): Promise<ItemDocument | null> {
    return ItemModel.findByIdAndUpdate(
      id,
      {
        ...update,
        $push: { history: entry },
        $inc: { offlineVersion: 1 }
      },
      { new: true, runValidators: true, session }
    ).exec();
  }

  public updateWithOptimisticLock(
    id: string,
    expectedVersion: number,
    update: UpdateQuery<ItemDocument>,
    entry: ItemHistoryEntry,
    session?: ClientSession
  ): Promise<ItemDocument | null> {
    return ItemModel.findOneAndUpdate(
      { _id: id, offlineVersion: expectedVersion },
      {
        ...update,
        $push: { history: entry },
        $inc: { offlineVersion: 1 }
      },
      { new: true, runValidators: true, session }
    ).exec();
  }

  public countByStatus(eventId: string): Promise<Array<{ _id: ItemStatus; count: number }>> {
    return ItemModel.aggregate([{ $match: { eventId: new Types.ObjectId(eventId) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]).exec();
  }
}
