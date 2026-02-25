import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const db = new Database("forge.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    state TEXT
  )
`);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Auth Routes
app.post("/api/auth/signup", (req, res) => {
  const { username, password } = req.body;
  const id = uuidv4();
  try {
    const initialState = {
      name: username,
      level: 1,
      xp: 0,
      points: 0,
      streak: 0,
      goals: [],
      dailyTasks: [],
      challenges: [],
      badges: []
    };
    const stmt = db.prepare("INSERT INTO users (id, username, password, state) VALUES (?, ?, ?, ?)");
    stmt.run(id, username, password, JSON.stringify(initialState));
    res.json({ id, username, state: initialState });
  } catch (e) {
    res.status(400).json({ error: "Username taken" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
  if (user) {
    res.json({ id: user.id, username: user.username, state: JSON.parse(user.state) });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/user/:id", (req, res) => {
  const user = db.prepare("SELECT state FROM users WHERE id = ?").get(req.params.id) as any;
  if (user) {
    res.json(JSON.parse(user.state));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// WebSocket for real-time sync
const clients = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  const userId = new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("userId");
  if (!userId) {
    ws.close();
    return;
  }

  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ws);

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === "UPDATE_STATE") {
      db.prepare("UPDATE users SET state = ? WHERE id = ?").run(JSON.stringify(message.state), userId);
      // Broadcast to other tabs of the same user
      clients.get(userId)?.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "STATE_UPDATED", state: message.state }));
        }
      });
    }
  });

  ws.on("close", () => {
    clients.get(userId)?.delete(ws);
    if (clients.get(userId)?.size === 0) clients.delete(userId);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
