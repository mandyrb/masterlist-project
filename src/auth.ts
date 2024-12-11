import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserAuth } from "./types";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).send("Access token is missing or invalid");
    return;
  }

  try {
    const user = jwt.verify(token, String(process.env.AUTH_KEY));
    req.user = user as UserAuth;
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};
