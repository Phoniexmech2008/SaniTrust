// server.js
// Entry point. Wires up middleware and mounts the facilities router.

import express from "express";
import cors from "cors";
import { facilitiesRouter } from "./routes/facilities.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", facilitiesRouter);

app.listen(PORT, () => {
  console.log(`SaniTrust backend running on http://localhost:${PORT}`);
});
