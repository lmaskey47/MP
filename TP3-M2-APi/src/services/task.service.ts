import { TaskRepository } from "../repositories/task.repository";
import { HttpError } from "../utils/httpError";
import { ObjectId } from "../utils/objectId";

export class TaskService {
  public constructor(private readonly tasks = new TaskRepository()) {}

  public list(eventId: string) {
    ObjectId.assert(eventId, "event id");
    return this.tasks.findByEvent(eventId);
  }

  public create(eventId: string, data: Record<string, unknown>) {
    ObjectId.assert(eventId, "event id");
    return this.tasks.create({ ...data, eventId } as never);
  }

  public byAssignee(assigneeId: string) {
    ObjectId.assert(assigneeId, "assignee id");
    return this.tasks.findByAssignee(assigneeId);
  }

  public async update(id: string, data: Record<string, unknown>) {
    ObjectId.assert(id, "task id");
    const task = await this.tasks.updateById(id, data as never);
    // 404 : aucune tache ne correspond a cet identifiant.
    if (!task) throw new HttpError(404, "Task not found");
    return task;
  }
}
