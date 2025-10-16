import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import ai from "./routes/aiTripPlanner.js";
import { connectDB } from "./db.js";
import authRoutes from "./routes/UserRoutes.js"; // login/register routes
import serverless from "serverless-http";

dotenv.config();

const app = express();

// For ES modules: get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ Middleware
app.use(cors({
  origin: "*", // In production, allow all or your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2️⃣ Connect to MongoDB
connectDB().then(() => {
  console.log("MongoDB connected successfully!");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// 3️⃣ API routes
app.use("/api/users", authRoutes);
app.use("/api/ai", ai);

app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// 4️⃣ Serve React frontend build
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// 5️⃣ Export handler for Vercel
export const handler = serverless(app);
