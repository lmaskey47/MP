import type { JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}
