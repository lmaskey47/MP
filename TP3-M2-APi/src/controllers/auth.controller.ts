import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { Schemas } from "../validators/schemas";

export class AuthController {
  public constructor(private readonly auth = new AuthService()) {}

  public register = async (request: Request, response: Response): Promise<void> => {
    const data = Schemas.register.parse(request.body);
    response.status(201).json(await this.auth.register(data));
  };

  public login = async (request: Request, response: Response): Promise<void> => {
    const data = Schemas.login.parse(request.body);
    response.status(200).json(await this.auth.login(data.email, data.password));
  };
}
