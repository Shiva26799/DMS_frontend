import app from "../backend/src/server.js";

// Health check route for Vercel diagnostics
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is reachable via Vercel function" });
});

export default app;
