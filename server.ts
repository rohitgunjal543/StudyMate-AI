import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./apiRouter";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount the modular API router under /api
  app.use("/api", apiRouter);

  // Serve static assets in production, otherwise use Vite's dev server middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
  process.exit(1);
});
