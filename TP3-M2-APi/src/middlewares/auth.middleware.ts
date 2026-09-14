import type { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/user.model";
import { HttpError } from "../utils/httpError";
import { JwtService } from "../utils/jwt";
import {UserRepository} from '../repositories/user.repository';

const jwtService = new JwtService();

export class AuthMiddleware {
  public authenticate(request: Request, _response: Response, next: NextFunction): void {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      // 401 : aucun jeton JWT Bearer n'a ete fourni dans le header Authorization.
      next(new HttpError(401, "Missing bearer token"));
      return;
    }

    try {
      request.auth = jwtService.verify(authorization.slice("Bearer ".length));
      new UserRepository().findById(request.auth.sub).then(user=>{
        if(!user?.active){next(new HttpError(401,'Compte désactivé'));return;}
        request.auth={sub:String(user._id),role:user.role,eventIds:user.eventIds.map(String)};
        next();
      }).catch(next);
    } catch {
      // 401 : le jeton JWT est invalide, mal forme ou expire.
      next(new HttpError(401, "Invalid or expired token"));
    }
  }

  public authorize(...roles: UserRole[]) {
    return (request: Request, _response: Response, next: NextFunction): void => {
      if (!request.auth) {
        // 401 : l'utilisateur n'est pas authentifie avant d'acceder a une route protegee.
        next(new HttpError(401, "Authentication required"));
        return;
      }

      if (!roles.includes(request.auth.role)) {
        // 403 : l'utilisateur est authentifie, mais son role n'a pas le droit d'effectuer cette action.
        next(new HttpError(403, "Insufficient permissions"));
        return;
      }

      next();
    };
  }
}
