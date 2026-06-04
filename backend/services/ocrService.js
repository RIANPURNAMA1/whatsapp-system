import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Groq client for vision capabilities
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});


/**
 * Extract text from image using Groq Vision API
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{text: string, confidence: number}>} Extracted text and confidence score
 */
export async function extractTextFromImage(imagePath) {
  try {
    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Determine media type from file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mediaType = "image/jpeg";
    if (ext === ".png") mediaType = "image/png";
    else if (ext === ".webp") mediaType = "image/webp";
    else if (ext === ".gif") mediaType = "image/gif";

    // Call Groq Vision API
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `Baca dan ekstrak SEMUA text/teks yang ada di gambar ini. Hasil dari live TikTok berisi informasi viewers, likes, followers, gifts dll.

Mohon ekstrak dengan format yang jelas dan terstruktur:
- Pisahkan setiap informasi dengan baris baru
- Catat jumlah/angka dengan akurat
- Sertakan label/nama metrik yang tertera

Setelah itu, buat ringkasan JSON di akhir dengan format:
{
  "tayangan": "jumlah_tayangan",
  "berlian": "jumlah_berlian",
  "durasi_live": "durasi",
  "pemberi_hadiah": "jumlah_pemberi_hadiah",
  "pengikut_baru": "jumlah_pengikut_baru",
  "komentar": "jumlah_komentar"
}

Isi dengan data dari gambar. Jika tidak ada, kosongkan.`,
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const extractedText =
      response.choices[0]?.message?.content || "Tidak ada text yang dapat diekstrak";

    // Calculate confidence based on response
    // Groq doesn't provide confidence scores, so we use a simple heuristic
    const confidence = extractedText !== "Tidak ada text yang dapat diekstrak" ? 0.9 : 0.3;

    return {
      text: extractedText,
      confidence: confidence,
      model: "groq-vision",
    };
  } catch (error) {
    console.error("❌ Error extracting text from image:", error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from image using Google Gemini as fallback
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{text: string, confidence: number}>} Extracted text and confidence score
 */
export async function extractTextFromImageGemini(imagePath) {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Determine media type from file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".gif") mimeType = "image/gif";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Baca dan ekstrak SEMUA text/teks yang ada di gambar ini. Hasil dari live TikTok berisi informasi viewers, likes, followers, gifts dll.

Mohon ekstrak dengan format yang jelas dan terstruktur:
- Pisahkan setiap informasi dengan baris baru
- Catat jumlah/angka dengan akurat
- Sertakan label/nama metrik yang tertera

Setelah itu, buat ringkasan JSON di akhir dengan format:
{
  "tayangan": "jumlah_tayangan",
  "berlian": "jumlah_berlian",
  "durasi_live": "durasi",
  "pemberi_hadiah": "jumlah_pemberi_hadiah",
  "pengikut_baru": "jumlah_pengikut_baru",
  "komentar": "jumlah_komentar"
}

Isi dengan data dari gambar. Jika tidak ada, kosongkan.`,
        },
      ],
    });

    const extractedText =
      response.text || "Tidak ada text yang dapat diekstrak";

    const confidence = extractedText !== "Tidak ada text yang dapat diekstrak" ? 0.85 : 0.3;

    return {
      text: extractedText,
      confidence: confidence,
      model: "gemini-vision",
    };
  } catch (error) {
    console.error("❌ Error extracting text from image (Gemini):", error);
    throw new Error(`Gemini OCR extraction failed: ${error.message}`);
  }
}

/**
 * Extract text with fallback logic
 * Tries Groq first, falls back to Gemini if Groq fails
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{text: string, confidence: number, model: string}>}
 */
function isGeminiFallbackAllowed() {
  if (!process.env.GEMINI_API_KEY) return false;
  if (!process.env.GROQ_API_KEY) return true;
  return process.env.OCR_FALLBACK_TO_GEMINI !== "false";
}

export async function extractTextFromImageWithFallback(imagePath) {
  try {
    let groqError = null;

    // Try Groq first if configured
    if (process.env.GROQ_API_KEY) {
      try {
        return await extractTextFromImage(imagePath);
      } catch (error) {
        groqError = error;
        console.log("⚠️  Groq Vision failed:", error.message);
      }
    }

    // Only try Gemini if allowed by environment or if Groq is not configured
    if (isGeminiFallbackAllowed()) {
      console.log("⚠️  Trying Gemini as fallback...");
      return await extractTextFromImageGemini(imagePath);
    }

    if (groqError) {
      throw new Error(
        `Groq OCR failed: ${groqError.message}. Gemini fallback is disabled. Set OCR_FALLBACK_TO_GEMINI=true to enable Gemini fallback, or fix the Groq error.`,
      );
    }

    throw new Error(
      "No OCR service available. Configure GROQ_API_KEY, or set GEMINI_API_KEY and OCR_FALLBACK_TO_GEMINI=true.",
    );
  } catch (error) {
    console.error("❌ OCR extraction failed:", error);
    throw error;
  }
}

export default {
  extractTextFromImage,
  extractTextFromImageGemini,
  extractTextFromImageWithFallback,
};
