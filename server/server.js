import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

import authRoutes from "./routes/UserRoutes.js"; // login/register routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// For ES modules: get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Middleware ----------
app.use(
  cors({
    origin: "*", // replace "*" with your frontend URL if needed
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Connect to MongoDB ----------
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ---------- API Routes ----------
app.use("/api/users", authRoutes);


app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Server is working!" });
});

// ---------- Serve React frontend ----------
const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

// Catch-all route for React SPA
app.get("/*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
app.get("/ping", (req, res) => {
  res.send("pong");
});


// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
