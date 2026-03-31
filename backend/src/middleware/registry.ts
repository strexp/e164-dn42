import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { canWrite } from "../utils";

export function registryMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!canWrite(req.user.asn)) {
    res.status(403).json({
      error: "Write access is only available for ASNs starting with 424242",
    });
    return;
  }

  next();
}
