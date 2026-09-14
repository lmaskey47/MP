import { Types } from "mongoose";
import { HttpError } from "./httpError";

export class ObjectId {
  public static assert(value: string, label = "id"): void {
    if (!Types.ObjectId.isValid(value)) {
      // 400 : l'identifiant fourni dans l'URL ou la requete n'a pas le format MongoDB ObjectId.
      throw new HttpError(400, `Invalid ${label}`);
    }
  }
}
