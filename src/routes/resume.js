const express = require("express");
const resumeRouter = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

resumeRouter.post("/generate-resume", async (req, res) => {
  const {
    name = "Anonymous",
    about = "",
    skills = [],
    projects = [],
    education = [],
    certifications = [],
    experience = []
  } = req.body;

  const prompt = `
Generate a professional resume in STRICT JSON format.
DO NOT add extra text, markdown, or explanations.
Candidate info:
Name: ${name}
About: ${about}
Skills: ${(skills || []).join(", ")}
Projects: ${(projects || []).join(" | ")}
Education: ${JSON.stringify(education || [])}
Certifications: ${(certifications || []).join(", ")}
Experience: ${(experience || []).join(", ")}
Output format:
{
  "summary": "2-3 line professional summary",
  "skillsBullets": ["skill1", "skill2"],
  "experienceBullets": ["point1", "point2"]
}
`;

  // Retry helper — Gemini occasionally returns 503 (model overloaded), which is transient
  const generateWithRetry = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      } catch (err) {
        const is503 = err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
        if (is503 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // 1.5s, 3s backoff
          continue;
        }
        throw err;
      }
    }
  };

  try {
    const result = await generateWithRetry();

    const rawText = (result.text || "").trim();
    if (!rawText) throw new Error("Empty response from Gemini API");

    const sanitized = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(sanitized);
    } catch (parseErr) {
      const match = sanitized.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON from Gemini: " + sanitized);
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error("Error generating resume:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

module.exports = resumeRouter;