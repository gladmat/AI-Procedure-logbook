import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { extractTextFromImage } from "./ocr";
import { redactSensitiveData, extractNHI, extractSurgeryDate } from "./privacyUtils";
import { storage } from "./storage";
import { allSeedData } from "./seedData";
import { searchProcedures, searchDiagnoses, getConceptDetails } from "./snomedApi";
import { getStagingForDiagnosis, getAllStagingConfigs } from "./diagnosisStagingConfig";
import { processDocument } from "./documentRouter";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "surgical-logbook-secret-key-2026";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/extract-flap-data", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      console.log("Processing flap data with local document router...");
      const result = processDocument(text);
      
      res.json({ 
        extractedData: result.extractedData,
        documentType: result.documentTypeName,
        autoFilledFields: result.autoFilledFields,
      });
    } catch (error) {
      console.error("Error extracting flap data:", error);
      res.status(500).json({ error: "Failed to extract data" });
    }
  });

  app.post("/api/analyze-op-note", async (req: Request, res: Response) => {
    try {
      const { image, images, text } = req.body;
      
      let originalText: string;
      
      if (text) {
        console.log("Using pre-extracted text from client OCR");
        originalText = text;
      } else {
        const imageArray: string[] = images || (image ? [image] : []);
        
        if (imageArray.length === 0) {
          return res.status(400).json({ error: "No images or text provided" });
        }

        const extractedTexts: string[] = [];
        for (const img of imageArray) {
          const extractedText = await extractTextFromImage(img);
          extractedTexts.push(extractedText);
        }
        
        originalText = extractedTexts.join("\n\n---\n\n");
      }
      
      console.log("Processing document with local privacy-first document router...");
      console.log("Text length:", originalText.length);

      const result = processDocument(originalText);
      
      console.log("Document type detected:", result.documentTypeName);
      console.log("Confidence:", result.confidence);
      console.log("Auto-filled fields:", result.autoFilledFields.join(", "));

      const extractedData = {
        ...result.extractedData,
        detectedSpecialty: "general",
      };

      res.json({ 
        extractedData,
        detectedSpecialty: "general",
        patientIdentifier: result.extractedData.patientIdentifier,
        procedureDate: result.extractedData.procedureDate,
        documentType: result.documentType,
        documentTypeName: result.documentTypeName,
        confidence: result.confidence,
        detectedTriggers: result.detectedTriggers,
        autoFilledFields: result.autoFilledFields,
      });
    } catch (error) {
      console.error("Error analyzing operation note:", error);
      res.status(500).json({ error: "Failed to analyze images" });
    }
  });

  app.post("/api/analyze-discharge-summary", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      console.log("Processing discharge summary with local document router...");
      const result = processDocument(text);
      
      const extractedData = {
        hasComplications: (result.extractedData.complications?.length ?? 0) > 0,
        complications: result.extractedData.complications || [],
        documentType: result.documentTypeName,
      };

      res.json({ 
        extractedData,
        autoFilledFields: result.autoFilledFields,
      });
    } catch (error) {
      console.error("Error analyzing discharge summary:", error);
      res.status(500).json({ error: "Failed to analyze discharge summary" });
    }
  });

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword });
      
      await storage.createProfile({ userId: user.id, onboardingComplete: false });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const profile = await storage.getProfile(user.id);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      
      res.json({ 
        token, 
        user: { id: user.id, email: user.email },
        profile,
        onboardingComplete: profile?.onboardingComplete ?? false
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const profile = await storage.getProfile(user.id);
      const facilities = await storage.getUserFacilities(user.id);
      
      res.json({
        user: { id: user.id, email: user.email },
        profile,
        facilities,
        onboardingComplete: profile?.onboardingComplete ?? false
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ error: "Failed to check authentication" });
    }
  });

  // Profile Routes
  app.get("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getProfile(req.userId!);
      res.json(profile || null);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.updateProfile(req.userId!, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Facilities Routes
  app.get("/api/facilities", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const facilities = await storage.getUserFacilities(req.userId!);
      res.json(facilities);
    } catch (error) {
      console.error("Facilities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.post("/api/facilities", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { facilityName, isPrimary } = req.body;
      if (!facilityName) {
        return res.status(400).json({ error: "Facility name required" });
      }
      
      const facility = await storage.createUserFacility({ 
        userId: req.userId!, 
        facilityName, 
        isPrimary: isPrimary ?? false 
      });
      res.json(facility);
    } catch (error) {
      console.error("Facility create error:", error);
      res.status(500).json({ error: "Failed to create facility" });
    }
  });

  app.delete("/api/facilities/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteUserFacility(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Facility delete error:", error);
      res.status(500).json({ error: "Failed to delete facility" });
    }
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

  // SNOMED CT Search API (using Snowstorm)
  app.get("/api/snomed/procedures", async (req: Request, res: Response) => {
    try {
      const { q, specialty, limit } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      
      const results = await searchProcedures(
        q,
        specialty as string | undefined,
        limit ? parseInt(limit as string, 10) : 20
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error searching SNOMED procedures:", error);
      res.status(500).json({ error: "Failed to search procedures" });
    }
  });

  app.get("/api/snomed/diagnoses", async (req: Request, res: Response) => {
    try {
      const { q, specialty, limit } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      
      const results = await searchDiagnoses(
        q,
        specialty as string | undefined,
        limit ? parseInt(limit as string, 10) : 20
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error searching SNOMED diagnoses:", error);
      res.status(500).json({ error: "Failed to search diagnoses" });
    }
  });

  app.get("/api/snomed/concepts/:conceptId", async (req: Request, res: Response) => {
    try {
      const { conceptId } = req.params;
      const details = await getConceptDetails(conceptId);
      
      if (!details) {
        return res.status(404).json({ error: "Concept not found" });
      }
      
      res.json(details);
    } catch (error) {
      console.error("Error fetching concept details:", error);
      res.status(500).json({ error: "Failed to fetch concept details" });
    }
  });

  // Diagnosis Staging Configuration API
  app.get("/api/staging/diagnosis", async (req: Request, res: Response) => {
    try {
      const { snomedCode, diagnosisName } = req.query;
      
      const staging = getStagingForDiagnosis(
        snomedCode as string | undefined,
        diagnosisName as string | undefined
      );
      
      res.json(staging || { stagingSystems: [] });
    } catch (error) {
      console.error("Error fetching staging config:", error);
      res.status(500).json({ error: "Failed to fetch staging configuration" });
    }
  });

  app.get("/api/staging/all", async (req: Request, res: Response) => {
    try {
      const configs = getAllStagingConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching all staging configs:", error);
      res.status(500).json({ error: "Failed to fetch staging configurations" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
