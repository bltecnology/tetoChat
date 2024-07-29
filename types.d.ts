import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // ou defina o tipo apropriado para user
    }
  }
}
