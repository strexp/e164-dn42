import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { registryMiddleware } from "../middleware/registry";
import { getDatabase } from "../db";
import { getPrefix, validateNumber } from "../utils";
import { phonebookEntrySchema } from "../schemas";

const router = Router();

router.get("/me", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();
  const entries = db
    .prepare("SELECT * FROM phonebooks WHERE asn = ?")
    .all(req.user.asn) as any[];

  res.json(
    entries.map((e) => ({
      id: e.id,
      number: e.number,
      name: e.name,
    })),
  );
});

router.post("/me", registryMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = phonebookEntrySchema.parse(req.body);
    const prefix = getPrefix(req.user.asn);

    if (!validateNumber(data.number, prefix)) {
      res.status(400).json({ error: `Number must start with ${prefix}` });
      return;
    }

    const db = getDatabase();

    const countRes = db
      .prepare("SELECT COUNT(*) as count FROM phonebooks WHERE asn = ?")
      .get(req.user.asn) as { count: number };
    if (countRes.count >= 20) {
      res.status(400).json({ error: "Maximum 20 phonebook entries allowed" });
      return;
    }

    const result = db
      .prepare("INSERT INTO phonebooks (asn, number, name) VALUES (?, ?, ?)")
      .run(req.user.asn, data.number, data.name);

    res.status(201).json({
      id: result.lastInsertRowid,
      number: data.number,
      name: data.name,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: "Invalid request body" });
    } else {
      console.error("Phonebook create error:", error);
      res.status(500).json({ error: "Failed to create phonebook entry" });
    }
  }
});

router.delete(
  "/me/:id",
  registryMiddleware,
  (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const db = getDatabase();

    const entry = db
      .prepare("SELECT * FROM phonebooks WHERE id = ? AND asn = ?")
      .get(id, req.user.asn);

    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    db.prepare("DELETE FROM phonebooks WHERE id = ? AND asn = ?").run(
      id,
      req.user.asn,
    );

    res.json({ success: true });
  },
);

export default router;
