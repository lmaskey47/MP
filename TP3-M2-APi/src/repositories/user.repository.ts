import { BaseRepository } from "./base.repository";
import { UserModel, type UserDocument } from "../models/user.model";

export class UserRepository extends BaseRepository<UserDocument> {
  public constructor() {
    super(UserModel);
  }

  public findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase(), active: true }).exec();
  }
}
