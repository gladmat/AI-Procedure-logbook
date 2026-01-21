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
  const worker = await getWorker();
  const buffer = Buffer.from(base64Image, "base64");
  const { data } = await worker.recognize(buffer);
  return data.text || "";
}

export async function terminateWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
