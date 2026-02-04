import { createWorker, Worker } from "tesseract.js";

let workerInstance: Worker | null = null;
let workerInitializing = false;
let workerQueue: ((worker: Worker) => void)[] = [];

async function getWorker(): Promise<Worker> {
  if (workerInstance) {
    return workerInstance;
  }

  if (workerInitializing) {
    return new Promise((resolve) => {
      workerQueue.push(resolve);
    });
  }

  workerInitializing = true;
  try {
    workerInstance = await createWorker("eng");
    workerInitializing = false;
    
    while (workerQueue.length > 0) {
      const resolve = workerQueue.shift();
      if (resolve && workerInstance) {
        resolve(workerInstance);
      }
    }
    
    return workerInstance;
  } catch (error) {
    workerInitializing = false;
    throw error;
  }
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
    let cleanBase64 = base64Image;
    if (base64Image.includes(",")) {
      cleanBase64 = base64Image.split(",")[1];
    }
    
    console.log(`[OCR] Starting text extraction, base64 size: ${Math.round(cleanBase64.length / 1024)}KB`);
    
    const worker = await getWorker();
    console.log("[OCR] Tesseract worker ready");
    
    const buffer = Buffer.from(cleanBase64, "base64");
    console.log(`[OCR] Buffer created, size: ${Math.round(buffer.length / 1024)}KB`);
    
    // Check buffer has valid image signature
    if (buffer.length < 100) {
      console.error("[OCR] Buffer too small to be a valid image");
      return "";
    }
    
    // Log first few bytes to identify image type
    const header = buffer.slice(0, 8).toString("hex");
    console.log(`[OCR] Image header bytes: ${header}`);
    
    // Use data URL format for Tesseract which is more reliable
    const dataUrl = `data:image/jpeg;base64,${cleanBase64}`;
    
    const { data } = await worker.recognize(dataUrl);
    
    const textLength = data.text?.length || 0;
    console.log(`[OCR] Text extraction complete, extracted ${textLength} characters`);
    
    if (textLength === 0) {
      console.warn("[OCR] Warning: No text extracted from image");
    }
    
    return data.text || "";
  } catch (error) {
    console.error("[OCR] Error extracting text:", error);
    // Return empty string instead of throwing to allow partial processing
    return "";
  }
}

export async function terminateWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
