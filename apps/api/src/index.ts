import express from "express";
import cors from "cors";
import { env } from "./env";
import { health } from "./routes/health";

const app = express();
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.use(health);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
