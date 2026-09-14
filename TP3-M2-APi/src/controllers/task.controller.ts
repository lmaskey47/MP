import type { Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { Schemas } from "../validators/schemas";

export class TaskController {
  public constructor(private readonly tasks = new TaskService()) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.tasks.list(request.params.eventId as string));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.tasks.create(request.params.eventId as string, Schemas.taskCreate.parse(request.body)));
  };

  public byAssignee = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.tasks.byAssignee(request.params.assigneeId as string));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.tasks.update(request.params.taskId as string, Schemas.taskPatch.parse(request.body)));
  };
}
