import bcrypt from "bcryptjs";
import { randomBytes, createHash } from 'node:crypto';
import { MobileRepository } from '../repositories/mobile.repository';
import { UserRepository } from "../repositories/user.repository";
import { type UserDocument } from "../models/user.model";
import { HttpError } from "../utils/httpError";
import { JwtService } from "../utils/jwt";

export class AuthService {
  public constructor(
    private readonly users = new UserRepository(),
    private readonly jwt = new JwtService()
  ) {}

  public async register(data: { name: string; email: string; password: string; role: string; eventIds: string[] }) {
    if(data.role !== 'field_agent' || data.eventIds.length) throw new HttpError(403, 'Les rôles et affectations sont attribués par un administrateur');
    const existing = await this.users.findByEmail(data.email);
    if (existing) {
      // 409 : conflit, l'email existe deja et ne peut pas etre reutilise.
      throw new HttpError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.users.create({ ...data, passwordHash, password: undefined } as never);
    return this.issueToken(user);
  }

  public async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // 401 : l'email ou le mot de passe ne permet pas d'authentifier l'utilisateur.
      throw new HttpError(401, "Invalid credentials");
    }

    return this.issueToken(user);
  }

  public async refresh(raw: string) {
    const repo = new MobileRepository();
    const session = await repo.consumeRefresh(createHash('sha256').update(raw).digest('hex'));
    if (!session?.userId) throw new HttpError(401, 'Session expirée');
    const user = await repo.user(session.userId);
    if (!user?.active) throw new HttpError(401, 'Compte désactivé');
    return this.issueToken(user);
  }

  public async logout(raw: string) {
    await new MobileRepository().revokeRefresh(createHash('sha256').update(raw).digest('hex'));
  }

  private async issueToken(user: UserDocument) {
    const userId = user._id.toString();
    const token = this.jwt.sign({ sub: userId, role: user.role, eventIds: user.eventIds.map(String) });
    const refreshToken = randomBytes(48).toString('hex');
    await new MobileRepository().saveRefresh(createHash('sha256').update(refreshToken).digest('hex'), userId, new Date(Date.now() + 30 * 86400000));
    return {
      refreshToken,
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        eventIds: user.eventIds
      }
    };
  }
}
