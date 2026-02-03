import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { MediaAttachment } from "@/types/case";

type MediaCallback = (attachments: MediaAttachment[]) => void;

interface MediaCallbackContextType {
  registerCallback: (callback: MediaCallback) => string;
  executeCallback: (callbackId: string, attachments: MediaAttachment[]) => void;
  clearCallback: (callbackId: string) => void;
}

const MediaCallbackContext = createContext<MediaCallbackContextType | null>(null);

export function MediaCallbackProvider({ children }: { children: React.ReactNode }) {
  const callbacksRef = useRef<Map<string, MediaCallback>>(new Map());
  const idCounterRef = useRef(0);

  const registerCallback = useCallback((callback: MediaCallback): string => {
    const id = `media_callback_${++idCounterRef.current}`;
    callbacksRef.current.set(id, callback);
    return id;
  }, []);

  const executeCallback = useCallback((callbackId: string, attachments: MediaAttachment[]) => {
    const callback = callbacksRef.current.get(callbackId);
    if (callback) {
      callback(attachments);
      callbacksRef.current.delete(callbackId);
    }
  }, []);

  const clearCallback = useCallback((callbackId: string) => {
    callbacksRef.current.delete(callbackId);
  }, []);

  return (
    <MediaCallbackContext.Provider value={{ registerCallback, executeCallback, clearCallback }}>
      {children}
    </MediaCallbackContext.Provider>
  );
}

export function useMediaCallback() {
  const context = useContext(MediaCallbackContext);
  if (!context) {
    throw new Error("useMediaCallback must be used within a MediaCallbackProvider");
  }
  return context;
}
