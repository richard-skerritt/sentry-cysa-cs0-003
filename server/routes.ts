import type { Express } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { storage } from "./storage";
import { insertAttemptSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Create a new attempt
  app.post("/api/attempts", async (req, res) => {
    try {
      const parsed = insertAttemptSchema.parse(req.body);
      const attempt = await storage.createAttempt(parsed);
      res.json(attempt);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // List attempts
  app.get("/api/attempts", async (_req, res) => {
    const list = await storage.listAttempts();
    res.json(list);
  });

  // Get single attempt
  app.get("/api/attempts/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "bad id" });
    const a = await storage.getAttempt(id);
    if (!a) return res.status(404).json({ error: "not found" });
    res.json(a);
  });

  // Update attempt (answers, flags, confidence, completion)
  const patchSchema = insertAttemptSchema.partial();
  app.patch("/api/attempts/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "bad id" });
    try {
      const patch = patchSchema.parse(req.body);
      const updated = await storage.updateAttempt(id, patch);
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  return httpServer;
}
