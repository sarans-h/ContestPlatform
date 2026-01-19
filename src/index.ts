import express, { type Request, type Response } from "express";
import { prisma } from "./lib/prisma.ts";
import authRoutes from "./modules/auth/auth.route.ts";
import contestRoutes from "./modules/contest/contest.route.ts"
import problemRoutes from "./modules/problem/problem.route.ts";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.ts";
import { ok } from "./lib/response.ts";
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  return ok(res, { message: "TypeScript + Express is running" }, 200);
});

app.get("/health/db", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok(res, { status: "ok" }, 200);
  } catch (error) {
    throw error;
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/contests",contestRoutes);
app.use("/api/problems", problemRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

try {
  await prisma.$connect();
  console.log("Connected to database");
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to connect to database", error);
  process.exit(1);
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
