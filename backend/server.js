// server.js
// Entry point. Wires up middleware and mounts both routers.

import express from "express";
import cors from "cors";
import { facilitiesRouter } from "./routes/facilities.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
// Default express.json() limit is 100kb — too small for a base64-encoded
// photo. 6mb comfortably covers our ~1.5MB photo cap (base64 adds ~33%
// overhead) plus the rest of a normal checkin payload.
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", facilitiesRouter);

app.listen(PORT, () => {
  console.log(`SaniTrust backend running on http://localhost:${PORT}`);
});
