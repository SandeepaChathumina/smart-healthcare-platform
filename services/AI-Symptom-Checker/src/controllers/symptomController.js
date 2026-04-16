const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildSymptomPrompt } = require("../services/symptomPromptService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractJsonFromResponse(text) {
  if (!text) {
    throw new Error("Empty AI response");
  }

  let cleanedText = text.trim();

  cleanedText = cleanedText.replace(/^```json\s*/i, "");
  cleanedText = cleanedText.replace(/^```\s*/i, "");
  cleanedText = cleanedText.replace(/\s*```$/i, "");

  const start = cleanedText.indexOf("{");
  const end = cleanedText.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No valid JSON object found in AI response");
  }

  return cleanedText.slice(start, end + 1);
}

const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, age, gender, medicalHistory } = req.body;

    if (
      !symptoms ||
      (Array.isArray(symptoms) && symptoms.length === 0) ||
      (typeof symptoms === "string" && !symptoms.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = buildSymptomPrompt(
      symptoms,
      age,
      gender,
      medicalHistory
    );

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      return res.status(500).json({
        success: false,
        message: "Empty response from Gemini API",
      });
    }

    const jsonText = extractJsonFromResponse(responseText);
    const parsed = JSON.parse(jsonText);

    return res.status(200).json({
      success: true,
      message: "Symptom analysis generated successfully",
      data: parsed,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    const errorMessage = error?.message || "Unknown error";

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("UNAVAILABLE") ||
      errorMessage.includes("high demand")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini service is temporarily unavailable due to high demand. Please try again in a moment.",
      });
    }

    if (
      errorMessage.includes("404") ||
      errorMessage.includes("NOT_FOUND") ||
      errorMessage.includes("not found")
    ) {
      return res.status(500).json({
        success: false,
        message: "Configured Gemini model was not found.",
        error: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to communicate with AI Symptom Checker",
      error: errorMessage,
    });
  }
};

module.exports = { checkSymptoms };