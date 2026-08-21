import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "store-ratings-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/owner", ownerRoutes);

app.use(notFound);
app.use(errorHandler);

async function verifyEmail() {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    console.warn("  ✖  Email   — SMTP_USER / SMTP_PASS not set (emails will log to console)");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
    await transporter.verify();
    console.log(`  ✔  Email   — SMTP ready (${user})`);
  } catch (err) {
    console.warn(`  ✖  Email   — SMTP connection failed: ${err.message}`);
  }
}

async function start() {
  try {
    await pool.query("SELECT 1");
    app.listen(env.port, async () => {
      console.log("─────────────────────────────────────────");
      console.log(`  ✔  API     — http://localhost:${env.port}`);
      console.log(`  ✔  MySQL   — connected (${env.mysql.database})`);
      await verifyEmail();
      console.log("─────────────────────────────────────────");
    });
  } catch (err) {
    console.error("Failed to connect to MySQL. Check backend/.env");
    console.error(err.message);
    process.exit(1);
  }
}

start();
