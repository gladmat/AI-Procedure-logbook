import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI } from "@google/genai";
import { FREE_FLAP_AI_PROMPT } from "./ai-prompts";
import { storage } from "./storage";
import { allSeedData } from "./seedData";

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

  // SNOMED Reference Data API
  app.get("/api/snomed-ref", async (req: Request, res: Response) => {
    try {
      const { category, anatomicalRegion, specialty } = req.query;
      const refs = await storage.getSnomedRefs(
        category as string | undefined,
        anatomicalRegion as string | undefined,
        specialty as string | undefined
      );
      res.json(refs);
    } catch (error) {
      console.error("Error fetching SNOMED refs:", error);
      res.status(500).json({ error: "Failed to fetch reference data" });
    }
  });

  app.get("/api/snomed-ref/vessels/:region", async (req: Request, res: Response) => {
    try {
      const { region } = req.params;
      const { subcategory } = req.query;
      
      let refs = await storage.getSnomedRefs("vessel", region);
      
      if (subcategory) {
        refs = refs.filter(r => r.subcategory === subcategory);
      }
      
      res.json(refs);
    } catch (error) {
      console.error("Error fetching vessels:", error);
      res.status(500).json({ error: "Failed to fetch vessels" });
    }
  });

  app.get("/api/snomed-ref/regions", async (req: Request, res: Response) => {
    try {
      const refs = await storage.getSnomedRefs("anatomical_region");
      res.json(refs);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ error: "Failed to fetch regions" });
    }
  });

  app.get("/api/snomed-ref/flap-types", async (req: Request, res: Response) => {
    try {
      const refs = await storage.getSnomedRefs("flap");
      res.json(refs);
    } catch (error) {
      console.error("Error fetching flap types:", error);
      res.status(500).json({ error: "Failed to fetch flap types" });
    }
  });

  app.get("/api/snomed-ref/donor-vessels/:flapType", async (req: Request, res: Response) => {
    try {
      const { flapType } = req.params;
      const refs = await storage.getSnomedRefs("donor_vessel", flapType);
      res.json(refs);
    } catch (error) {
      console.error("Error fetching donor vessels:", error);
      res.status(500).json({ error: "Failed to fetch donor vessels" });
    }
  });

  app.get("/api/snomed-ref/compositions", async (req: Request, res: Response) => {
    try {
      const refs = await storage.getSnomedRefs("composition");
      res.json(refs);
    } catch (error) {
      console.error("Error fetching compositions:", error);
      res.status(500).json({ error: "Failed to fetch compositions" });
    }
  });

  app.get("/api/snomed-ref/coupling-methods", async (req: Request, res: Response) => {
    try {
      const refs = await storage.getSnomedRefs("coupling_method");
      res.json(refs);
    } catch (error) {
      console.error("Error fetching coupling methods:", error);
      res.status(500).json({ error: "Failed to fetch coupling methods" });
    }
  });

  app.get("/api/snomed-ref/anastomosis-configs", async (req: Request, res: Response) => {
    try {
      const refs = await storage.getSnomedRefs("anastomosis_config");
      res.json(refs);
    } catch (error) {
      console.error("Error fetching anastomosis configs:", error);
      res.status(500).json({ error: "Failed to fetch anastomosis configs" });
    }
  });

  // Seed Data Endpoint (run once to populate reference data)
  app.post("/api/seed-snomed-ref", async (req: Request, res: Response) => {
    try {
      // Check if data already exists
      const existing = await storage.getSnomedRefs();
      if (existing.length > 0) {
        return res.json({ message: "Data already seeded", count: existing.length });
      }
      
      const created = await storage.bulkCreateSnomedRefs(allSeedData);
      res.json({ message: "Seed data created successfully", count: created.length });
    } catch (error) {
      console.error("Error seeding SNOMED refs:", error);
      res.status(500).json({ error: "Failed to seed reference data" });
    }
  });

  // Flaps CRUD API
  app.get("/api/procedures/:procedureId/flaps", async (req: Request, res: Response) => {
    try {
      const { procedureId } = req.params;
      const flaps = await storage.getFlapsByProcedure(procedureId);
      res.json(flaps);
    } catch (error) {
      console.error("Error fetching flaps:", error);
      res.status(500).json({ error: "Failed to fetch flaps" });
    }
  });

  app.post("/api/flaps", async (req: Request, res: Response) => {
    try {
      const flap = await storage.createFlap(req.body);
      res.json(flap);
    } catch (error) {
      console.error("Error creating flap:", error);
      res.status(500).json({ error: "Failed to create flap" });
    }
  });

  app.put("/api/flaps/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const flap = await storage.updateFlap(id, req.body);
      if (!flap) {
        return res.status(404).json({ error: "Flap not found" });
      }
      res.json(flap);
    } catch (error) {
      console.error("Error updating flap:", error);
      res.status(500).json({ error: "Failed to update flap" });
    }
  });

  app.delete("/api/flaps/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteFlap(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flap:", error);
      res.status(500).json({ error: "Failed to delete flap" });
    }
  });

  // Anastomoses CRUD API
  app.get("/api/flaps/:flapId/anastomoses", async (req: Request, res: Response) => {
    try {
      const { flapId } = req.params;
      const anastomoses = await storage.getAnastomosesByFlap(flapId);
      res.json(anastomoses);
    } catch (error) {
      console.error("Error fetching anastomoses:", error);
      res.status(500).json({ error: "Failed to fetch anastomoses" });
    }
  });

  app.post("/api/anastomoses", async (req: Request, res: Response) => {
    try {
      const anastomosis = await storage.createAnastomosis(req.body);
      res.json(anastomosis);
    } catch (error) {
      console.error("Error creating anastomosis:", error);
      res.status(500).json({ error: "Failed to create anastomosis" });
    }
  });

  app.put("/api/anastomoses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const anastomosis = await storage.updateAnastomosis(id, req.body);
      if (!anastomosis) {
        return res.status(404).json({ error: "Anastomosis not found" });
      }
      res.json(anastomosis);
    } catch (error) {
      console.error("Error updating anastomosis:", error);
      res.status(500).json({ error: "Failed to update anastomosis" });
    }
  });

  app.delete("/api/anastomoses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteAnastomosis(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting anastomosis:", error);
      res.status(500).json({ error: "Failed to delete anastomosis" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
