import { BaseRepository } from "./base.repository";
import { TaskModel, type TaskDocument } from "../models/task.model";

export class TaskRepository extends BaseRepository<TaskDocument> {
  public constructor() {
    super(TaskModel);
  }

  public findByEvent(eventId: string): Promise<TaskDocument[]> {
    return TaskModel.find({ eventId }).sort({ dueAt: 1 }).exec();
  }

  public findByAssignee(assigneeId: string): Promise<TaskDocument[]> {
    return TaskModel.find({ assigneeId }).sort({ dueAt: 1 }).exec();
  }
}
