import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

const db = new Database("healthhalo.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS consent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    audio_consent BOOLEAN,
    video_consent BOOLEAN,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/consent", (req, res) => {
    const { sessionId, audioConsent, videoConsent } = req.body;
    const stmt = db.prepare("INSERT INTO consent_logs (session_id, audio_consent, video_consent) VALUES (?, ?, ?)");
    stmt.run(sessionId, audioConsent ? 1 : 0, videoConsent ? 1 : 0);
    // In a real Google Cloud environment, this would log to Firestore
    res.json({ status: "ok", message: "Consent logged to database (simulating Firestore)" });
  });

  app.delete("/api/session/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const stmt = db.prepare("DELETE FROM consent_logs WHERE session_id = ?");
    stmt.run(sessionId);
    res.json({ status: "ok", message: "Session data deleted" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
