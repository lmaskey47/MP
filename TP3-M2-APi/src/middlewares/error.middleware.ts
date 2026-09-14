import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    // 422 : les donnees envoyees par le client ne respectent pas le schema attendu.
    response.status(422).json({
      error: "Validation failed",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof HttpError) {
    // Erreur metier controlee : on renvoie le code HTTP defini au moment du throw.
    response.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
    return;
  }

  // 500 : erreur technique non prevue cote serveur.
  response.status(500).json({ error: "Internal server error" });
};
