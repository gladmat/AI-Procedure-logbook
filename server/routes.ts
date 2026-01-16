import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI } from "@google/genai";
import { FREE_FLAP_AI_PROMPT } from "./ai-prompts";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/extract-flap-data", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: FREE_FLAP_AI_PROMPT },
              { text: `\n\nOperation Note:\n${text}` },
            ],
          },
        ],
      });

      const responseText = response.text || "";
      
      let extractedData = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
      }

      res.json({ extractedData });
    } catch (error) {
      console.error("Error extracting flap data:", error);
      res.status(500).json({ error: "Failed to extract data" });
    }
  });

  app.post("/api/analyze-op-note", async (req: Request, res: Response) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: FREE_FLAP_AI_PROMPT },
              { text: "\n\nExtract the surgical details from this operation note image. First perform OCR to read the text, then extract the structured data:" },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image,
                },
              },
            ],
          },
        ],
      });

      const responseText = response.text || "";
      
      let extractedData = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
      }

      res.json({ extractedData });
    } catch (error) {
      console.error("Error analyzing operation note:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
