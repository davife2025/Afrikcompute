import express from "express";
import cors from "cors";
import { env } from "./env";
import { health } from "./routes/health";
import { auth } from "./routes/auth";
import { data } from "./routes/data";
import { submissions } from "./routes/submissions";
import { payouts } from "./routes/payouts";
import { privateRoutes } from "./private/route";

const app = express();
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.use(health);
app.use(auth);
app.use(data);
app.use(submissions);
app.use(payouts);
app.use(privateRoutes);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
