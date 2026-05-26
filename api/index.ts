import express from "express";
import apiRouter from "../apiRouter";

const app = express();
app.use(express.json());

// Mount our shared API Router under /api
app.use("/api", apiRouter);

export default app;
