import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const router = express.Router();

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your key in the Secrets panel (Settings > Secrets in AI Studio or Vercel Environment Variables).");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const handleApiError = (res: express.Response, error: any) => {
  console.error("API Error:", error);
  res.status(500).json({
    error: error.message || "An unexpected error occurred while communicating with the AI service.",
  });
};

// 1. AI Chat Endpoint
router.post("/study/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGeminiClient();

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const defaultSystemPrompt = 
      `You are StudyMate AI, an encouraging, professional, and knowledgeable AI study mentor.
       Your goals are to help students learn faster, stay organized, and improve academic performance.
       Guidelines:
       - Keep answers concise, highly structured, and easy to read.
       - Use headings, bullet points, numbered lists, or tables where appropriate.
       - Avoid overly complex jargon. Explain technical terms step-by-step.
       - Encourage deep understanding rather than just giving direct answers.
       - Be positive and motivating! Provide beginner-friendly code examples with logic explanations for coding queries.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt || defaultSystemPrompt,
      },
    });

    res.json({ text: response.text });
  } catch (error) {
    handleApiError(res, error);
  }
});

// 2. Note Summarizer Endpoint
router.post("/study/summarize", async (req, res) => {
  try {
    const { text, format, depth } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text content to summarize is required." });
    }

    const ai = getGeminiClient();

    const summaryPrompt = 
      `You are StudyMate AI. Summarize the following study notes in a highly readable, concise format optimized for student revision.
       
       Study Notes to summarize:
       -----
       ${text}
       -----

       Requirements:
       - Summary Format Style: ${format || "bullet points"}
       - Detail Level: ${depth || "standard summary focus"}
       
       Provide heading sections, key takeaways, a definition pool of core terms in table/bullet format, and a 1-minute speedy summary paragraph at the end.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: summaryPrompt,
      config: {
        systemInstruction: "You are an expert educational writer. You summarize complex material into highly structured study sheets.",
      },
    });

    res.json({ text: response.text });
  } catch (error) {
    handleApiError(res, error);
  }
});

// 3. Quiz & Flashcards Generator Endpoint
router.post("/study/quiz", async (req, res) => {
  try {
    const { topic, count, type } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required to generate a quiz." });
    }

    const limit = count ? Math.min(Math.max(Number(count), 1), 10) : 5;
    const quizType = type || "mcq";

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a student practice quiz consisting of exactly ${limit} questions on the topic: "${topic}". 
                 The questions must be of type: "${quizType}". Make sure they are educative, stimulating, and beginner-friendly.`,
      config: {
        systemInstruction: "You are an academic test maker. Generate accurate, engaging test questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A descriptive title for the quiz" },
            questions: {
              type: Type.ARRAY,
              description: "List of quiz questions",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING, description: "The quiz question content" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of multiple choice options. Leave empty if generating True/False or Short Answer questions."
                  },
                  correctAnswer: { type: Type.STRING, description: "The correct option (for MCQ, e.g. matching an option exactly), 'True' or 'False' (for T/F), or a concise model solution (for short answers)" },
                  explanation: { type: Type.STRING, description: "Detailed, helpful educational explanation of why this answer is correct." }
                },
                required: ["id", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    handleApiError(res, error);
  }
});

// 4. Study Scheduler & Roadmap Generator Endpoint
router.post("/study/roadmap", async (req, res) => {
  try {
    const { topic, timeframe, userContext } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required to build a learning roadmap." });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create an interactive, structured, step-by-step learning roadmap and schedule to master: "${topic}".
                 Timeframe: ${timeframe || "4 weeks"}.
                 Student details/Current level: ${userContext || "beginner level with busy schedule"}.
                 
                 Structure the roadmap into specific learnable milestone phases containing structured, clear actionable items.`,
      config: {
        systemInstruction: "You are a specialized personal academic planner and curriculum developer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Roadmap Title" },
            timeframe: { type: Type.STRING },
            description: { type: Type.STRING, description: "Inspirational objective description of the study plan" },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Phase title, e.g. Phase 1: Core Fundamentals" },
                  duration: { type: Type.STRING, description: "Suggested duration, e.g. Days 1-5 or Week 1" },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Actionable student checklist items"
                  },
                  keyConcepts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Important terms & logic to comprehend deeply in this phase"
                  },
                  recommendedResources: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "External search ideas or tutorial guides to check"
                  }
                },
                required: ["name", "duration", "tasks", "keyConcepts"]
              }
            }
          },
          required: ["title", "description", "phases"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
