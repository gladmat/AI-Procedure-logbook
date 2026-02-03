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
    console.log(`[OCR] Starting text extraction, image size: ${Math.round(base64Image.length / 1024)}KB`);
    
    const worker = await getWorker();
    console.log("[OCR] Tesseract worker ready");
    
    const buffer = Buffer.from(base64Image, "base64");
    console.log(`[OCR] Buffer created, size: ${Math.round(buffer.length / 1024)}KB`);
    
    const { data } = await worker.recognize(buffer);
    
    const textLength = data.text?.length || 0;
    console.log(`[OCR] Text extraction complete, extracted ${textLength} characters`);
    
    if (textLength === 0) {
      console.warn("[OCR] Warning: No text extracted from image");
    } else {
      // Log first 200 chars for debugging
      console.log(`[OCR] First 200 chars: ${data.text.substring(0, 200).replace(/\n/g, ' ')}`);
    }
    
    return data.text || "";
  } catch (error) {
    console.error("[OCR] Error extracting text:", error);
    throw error;
  }
}

export async function terminateWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
