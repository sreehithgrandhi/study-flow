import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "StudyFlow App",
    database: "Supabase PostgreSQL",
  });
});

// Lazy initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// AI Study Assistant Endpoint
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { message, context, chatHistory } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message prompt is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API Key is not configured on the server. Please ensure GEMINI_API_KEY is available in Settings > Secrets.",
      });
    }

    const systemInstruction = `You are the StudyFlow AI Assistant, an empathetic, highly knowledgeable, and practical academic mentor and study tutor for students.
Your mission is to help the student succeed by:
1. Answering conceptual academic questions across subjects with clarity, step-by-step breakdowns, and intuitive analogies.
2. Generating practical study schedules, revision plans, and pomodoro study blocks based on their upcoming exams, subjects, and topics.
3. Giving exam preparation tips, active recall strategies, and mnemonic techniques.
4. Keeping responses structured, engaging, and encouraging using clear Markdown formatting, bullet points, and code/formula formatting when appropriate.

Student's Current Workspace Context:
${context ? JSON.stringify(context, null, 2) : "No specific subjects context provided."}

Tone: Friendly, motivating, clear, and academically rigorous without being overly verbose.`;

    // Format conversation history
    const contents: any[] = [];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      for (const turn of chatHistory.slice(-8)) {
        if (turn.role === "user" || turn.role === "assistant") {
          contents.push({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Model fallback chain in case of temporary demand surges or rate limits
    // Uses official supported models: gemini-3.8-flash, gemini-3.1-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ];

    let responseText = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const isUnavailable =
          err?.status === "UNAVAILABLE" ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand");

        if (isUnavailable) {
          // Short pause before trying next available model
          await new Promise((r) => setTimeout(r, 300));
        }
        continue;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All AI models are currently busy. Please try again in a few moments.");
    }

    res.json({ reply: responseText });
  } catch (error: any) {
    console.error("Gemini AI assistant error:", error);
    const isHighDemand =
      error?.status === "UNAVAILABLE" ||
      error?.message?.includes("503") ||
      error?.message?.includes("high demand");

    res.status(isHighDemand ? 503 : 500).json({
      error: isHighDemand
        ? "The AI model is experiencing high demand right now. Please wait a moment and try asking again."
        : error.message || "Failed to process AI assistant request.",
    });
  }
});

// AI Daily Study Plan Generator Endpoint
app.post("/api/ai/generate-study-plan", async (req, res) => {
  try {
    const {
      date,
      availableMinutes = 120,
      topics = [],
      exams = [],
      focusGoal = "balanced",
    } = req.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        error: "No topics provided. Please create at least one subject and topic before generating an AI study plan.",
      });
    }

    const ai = getGeminiClient();

    // Fallback heuristic function in case of AI unavailability or missing API key
    const generateHeuristicPlan = () => {
      // Sort topics by priority: 
      // 1. Topics matching upcoming exams
      // 2. Lowest progress topics
      // 3. Difficulty (hard > medium > easy)
      const examSubjectIds = new Set(exams.map((e: any) => e.subject_id || e.subjects?.id));
      
      const scoredTopics = [...topics].map((topic) => {
        let score = (100 - (topic.progress || 0)); // lower progress = higher score
        if (examSubjectIds.has(topic.subject_id || topic.subjects?.id)) {
          score += 60; // urgent because subject has exam
        }
        if (topic.difficulty === "hard") score += 30;
        if (topic.difficulty === "medium") score += 15;
        return { topic, score };
      });

      scoredTopics.sort((a, b) => b.score - a.score);

      let remainingMins = Math.max(30, Number(availableMinutes) || 120);
      const selectedTasks: any[] = [];
      const times = ["09:00", "10:30", "14:00", "15:30", "17:00", "19:00"];
      let timeIdx = 0;

      for (const item of scoredTopics) {
        if (remainingMins <= 0 || selectedTasks.length >= 5) break;

        const duration = Math.min(remainingMins, Math.max(25, item.topic.estimated_minutes > 45 ? 45 : 30));
        const hasExam = examSubjectIds.has(item.topic.subject_id || item.topic.subjects?.id);
        
        selectedTasks.push({
          topic_id: item.topic.id,
          topic_name: item.topic.name,
          subject_name: item.topic.subjects?.name || item.topic.subject_name || "Course",
          duration_minutes: duration,
          priority: hasExam ? "high" : item.topic.difficulty === "hard" ? "high" : "medium",
          start_time: times[timeIdx % times.length],
          ai_reason: hasExam
            ? `High priority review because this subject has an upcoming exam and current progress is ${item.topic.progress || 0}%.`
            : `Focus on mastering foundational concepts in this topic (current progress: ${item.topic.progress || 0}%).`,
        });

        remainingMins -= duration;
        timeIdx++;
      }

      return {
        plan_summary: `AI generated a focused study plan prioritizing your lowest-progress topics and upcoming exam subjects across ${selectedTasks.reduce((acc, t) => acc + t.duration_minutes, 0)} minutes.`,
        total_planned_minutes: selectedTasks.reduce((acc, t) => acc + t.duration_minutes, 0),
        tasks: selectedTasks,
        source: "heuristic_smart",
      };
    };

    if (!ai) {
      // Return intelligent heuristic if no key configured
      return res.json(generateHeuristicPlan());
    }

    const prompt = `You are the StudyFlow AI Scheduler. Generate an intelligent, highly prioritized daily study plan for date: ${date || "today"}.
Total target available study time: ${availableMinutes} minutes.
Focus preference: ${focusGoal}

Available Student Topics:
${JSON.stringify(
  topics.map((t) => ({
    id: t.id,
    name: t.name,
    subject_id: t.subject_id || t.subjects?.id,
    subject_name: t.subjects?.name || t.subject_name || "Course",
    difficulty: t.difficulty,
    progress: t.progress,
    estimated_minutes: t.estimated_minutes,
  })),
  null,
  2
)}

Upcoming Exams:
${JSON.stringify(
  exams.map((e: any) => ({
    id: e.id,
    title: e.cleanTitle || e.title,
    subject_ids: e.subject_ids || (e.subject_id ? [e.subject_id] : []),
    subject_names:
      e.all_subjects && e.all_subjects.length > 0
        ? e.all_subjects.map((s: any) => s.name)
        : [e.subjects?.name || e.subject_name || "Course"],
    exam_date: e.exam_date,
    priority: e.priority,
  })),
  null,
  2
)}

CRITICAL RULES:
1. Select between 2 and 5 most critical topic IDs to study.
2. Prioritize:
   - Topics related to upcoming exams (especially with exam dates in the near future).
   - Topics with lowest current progress (< 50%) and 'hard' or 'medium' difficulty.
3. Allocate realistic duration_minutes per task (e.g., 25, 30, 45, or 60 minutes).
   The sum of all task duration_minutes should be approximately ${availableMinutes} minutes.
4. Assign a realistic start_time in HH:MM format (e.g., "09:00", "10:30", "14:00").
5. Assign priority: "high" | "medium" | "low".
6. Provide a concise 1-sentence 'ai_reason' for why this topic was scheduled.
7. Provide a motivating 2-sentence 'plan_summary' explaining the strategy.

RESPONSE FORMAT:
You MUST respond with valid JSON ONLY. Do not include markdown code block backticks if possible, or format as valid JSON object:
{
  "plan_summary": "...",
  "total_planned_minutes": 120,
  "tasks": [
    {
      "topic_id": "exact uuid from available topics",
      "duration_minutes": 30,
      "priority": "high",
      "start_time": "09:00",
      "ai_reason": "..."
    }
  ]
}`;

    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ];

    let aiResultText = "";

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
        if (response.text) {
          aiResultText = response.text;
          break;
        }
      } catch (err: any) {
        const isUnavailable =
          err?.status === "UNAVAILABLE" ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand");

        if (isUnavailable) {
          await new Promise((r) => setTimeout(r, 300));
        }
        continue;
      }
    }

    if (!aiResultText) {
      return res.json(generateHeuristicPlan());
    }

    try {
      // Clean possible backticks
      const cleanJson = aiResultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      // Validate topic_ids actually exist in the provided list
      const validTopicIds = new Set(topics.map((t) => t.id));
      const validTasks = (parsed.tasks || [])
        .filter((task: any) => validTopicIds.has(task.topic_id))
        .map((task: any) => {
          const matchedTopic = topics.find((t) => t.id === task.topic_id);
          return {
            ...task,
            topic_name: matchedTopic?.name || "Topic",
            subject_name: matchedTopic?.subjects?.name || matchedTopic?.subject_name || "Subject",
            duration_minutes: Number(task.duration_minutes) || 30,
            priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium",
          };
        });

      if (validTasks.length === 0) {
        return res.json(generateHeuristicPlan());
      }

      return res.json({
        plan_summary: parsed.plan_summary || "Personalized study plan created by AI.",
        total_planned_minutes: validTasks.reduce((acc: number, t: any) => acc + (t.duration_minutes || 0), 0),
        tasks: validTasks,
        source: "gemini_ai",
      });
    } catch (parseErr) {
      console.error("Failed to parse AI schedule JSON, using heuristic:", parseErr);
      return res.json(generateHeuristicPlan());
    }
  } catch (error: any) {
    console.error("AI Study Plan Generation Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI study plan.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
