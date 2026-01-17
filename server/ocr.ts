import { createWorker } from "tesseract.js";

export async function extractTextFromImage(base64Image: string): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const buffer = Buffer.from(base64Image, "base64");
    const { data } = await worker.recognize(buffer);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}
