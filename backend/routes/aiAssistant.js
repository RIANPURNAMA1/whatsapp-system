import express from "express";
import { authenticateToken } from "../auth.js";
import { askAssistant } from "../services/aiAssistantService.js";

const router = express.Router();

router.post("/ai/assistant", authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, error: "Pertanyaan tidak boleh kosong" });
    }

    const { reply, provider } = await askAssistant(question.trim());
    res.json({ success: true, answer: reply, provider });
  } catch (err) {
    console.error("[AI Assistant] Error:", err.message);
    res.status(500).json({ success: false, error: "Gagal memproses pertanyaan" });
  }
});

export default router;
