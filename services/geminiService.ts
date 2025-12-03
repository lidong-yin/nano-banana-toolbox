
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

// Note: We initialize the client inside functions to ensure we use the latest process.env.API_KEY
// which might change if the user selects a custom key via window.aistudio.

export const generateOrEditImage = async (config: GenerationConfig): Promise<string> => {
  try {
    const isHighRes = config.resolution === '2K' || config.resolution === '4K';
    
    // Select model based on resolution/complexity request
    // 'gemini-2.5-flash-image' is the Nano Banana / Flash Image model (Fast, Standard Res)
    // 'gemini-3-pro-image-preview' is the Nano Banana Pro model (High Res)
    const modelName = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    // Initialize client with current key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];

    // Add source image for editing if it exists
    if (config.sourceImage) {
      // Extract base64 data (remove data:image/xxx;base64, prefix if present)
      const base64Data = config.sourceImage.split(',')[1] || config.sourceImage;
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG for upload or strictly handling it before calling this
          data: base64Data,
        },
      });
    }

    // Add text prompt
    parts.push({
      text: config.prompt,
    });

    // Build configuration
    const generationConfig: any = {
      imageConfig: {}
    };

    // Only set aspectRatio if it's not auto
    if (config.aspectRatio && config.aspectRatio !== 'auto') {
        generationConfig.imageConfig.aspectRatio = config.aspectRatio;
    }

    // Only add imageSize for Pro model (Nano Banana 2/Pro)
    if (isHighRes) {
        generationConfig.imageConfig.imageSize = config.resolution;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts,
      },
      config: generationConfig,
    });

    // Extract image from response
    // The output response may contain both image and text parts; iterate to find the image.
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          // Return full data URI
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    throw new Error("No image generated in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    if (!originalPrompt.trim()) return "";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert AI image generation prompt engineer. Optimize the following prompt to be more descriptive, artistic, and suitable for high-quality image generation. Enhance lighting, texture, and composition details. Maintain the original language (English or Chinese). Output ONLY the optimized prompt text. Original prompt: "${originalPrompt}"`,
    });
    
    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Prompt optimization error:", error);
    throw error;
  }
};

export const translatePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    if (!originalPrompt.trim()) return "";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text. If the input is primarily Chinese, translate it to English. If the input is primarily English, translate it to Chinese. Output ONLY the translated text without any explanation or quotes. Text: "${originalPrompt}"`,
    });
    
    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};
