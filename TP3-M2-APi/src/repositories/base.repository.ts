import type { Model, UpdateQuery } from "mongoose";
import type { BaseDocument } from "../models/base.model";

export abstract class BaseRepository<TDocument extends BaseDocument> {
  protected constructor(protected readonly model: Model<TDocument>) {}

  public create(data: Partial<TDocument>): Promise<TDocument> {
    return this.model.create(data);
  }

  public findById(id: string): Promise<TDocument | null> {
    return this.model.findById(id).exec();
  }

  public find(filter: Record<string, unknown> = {}): Promise<TDocument[]> {
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  public updateById(id: string, data: UpdateQuery<TDocument>): Promise<TDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  public deleteById(id: string): Promise<TDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
