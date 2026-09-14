import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "../models/user.model";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  eventIds: string[];
}

export class JwtService {
  public sign(payload: JwtPayload): string {
    const secret: Secret = env.jwtSecret;
    const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
    return jwt.sign(payload, secret, options);
  }

  public verify(token: string): JwtPayload {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  }
}
