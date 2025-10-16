// controllers/authController.js
import dotenv from "dotenv";
import OpenAI from "openai";
import UserServices from "../services/UserServices.js";

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------- LOGIN CONTROLLER ----------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const loginUser = await UserServices.login(email, password);

    if (!loginUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: loginUser, // exclude sensitive fields like password in service
    });
  } catch (err) {
    console.error("Login controller error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- TRIP GENERATION CONTROLLER ----------------------
const generateTrip = async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, travelers, interests } = req.body;

    if (!destination || !startDate || !endDate || !budget || !travelers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = `
You are an expert AI travel planner.
Plan a detailed trip for ${travelers} travelers to ${destination} 
from ${startDate} to ${endDate} with a budget of ₹${budget}.
Focus on interests: ${interests?.join(", ") || "general travel"}.

For each day:
- Suggest 3–5 main activities or places to visit (with approximate timings)
- Include meal recommendations (breakfast, lunch, dinner)
- Mention estimated cost per day
- Include best time to visit each spot and short reason (like “less crowd”, “sunset view”)
- Keep total cost under ₹${budget}

Return the response in a clear JSON structure like:
{
  "destination": "...",
  "totalDays": ...,
  "itinerary": [
    {
      "day": 1,
      "date": "...",
      "plan": [
        {"time": "9:00 AM", "activity": "...", "details": "...", "cost": ...},
        ...
      ],
      "dailyCost": ...
    }
  ],
  "estimatedTotalCost": ...
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4o" if you have access
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    res.json({ success: true, plan: content });
  } catch (error) {
    console.error("Trip generation error:", error);
    res.status(500).json({ success: false, message: "AI trip generation failed" });
  }
};

export default { login, generateTrip };
