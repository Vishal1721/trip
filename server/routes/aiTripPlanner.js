import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate-trip", async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, travelers, interests } = req.body;

    const prompt = `
You are an expert AI travel planner.
Plan a detailed trip for ${travelers} travelers to ${destination} 
from ${startDate} to ${endDate} with a budget of ₹${budget}.
Focus on interests: ${interests.join(", ")}.

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
      model: "gpt-4o-mini", // use gpt-4o if available
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    res.json({ success: true, plan: content });
  } catch (error) {
    console.error("Trip generation error:", error);
    res.status(500).json({ success: false, message: "AI trip generation failed" });
  }
});

export default router;
