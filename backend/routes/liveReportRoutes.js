import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "../db.js";
import { extractTextFromImageWithFallback } from "../services/ocrService.js";
import { authenticateToken } from "../auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../public/uploads/tiktok_live_reports");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * POST /api/tiktok-live-reports/upload
 * Upload image and perform OCR (no DB save yet)
 */
router.post("/upload", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Perform OCR extraction
    const ocrResult = await extractTextFromImageWithFallback(req.file.path);

    // Clean up uploaded image file (we only need the text)
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      console.error("Failed to delete uploaded file:", e);
    }

    return res.status(200).json({
      success: true,
      message: "OCR completed successfully",
      data: {
        extracted_text: ocrResult.text,
        confidence: ocrResult.confidence,
        model: ocrResult.model,
      },
    });
  } catch (error) {
    console.error("❌ Error in upload endpoint:", error);

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Failed to delete file:", e);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process image: " + error.message,
    });
  }
});

/**
 * POST /api/tiktok-live-reports/confirm
 * Save confirmed report after user review
 */
router.post("/confirm", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      extracted_text,
      ocr_confidence,
      title,
      description,
      viewers,
      diamonds,
      live_duration,
      gift_givers,
      new_followers,
      comments_count,
      leads_data,
    } = req.body;

    if (!extracted_text) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: extracted_text",
      });
    }

    const insertQuery = `
      INSERT INTO tiktok_live_reports 
      (user_id, extracted_text, ocr_confidence, 
       report_title, report_description, status,
       viewers, diamonds, live_duration, gift_givers, new_followers, comments_count, leads_data)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [
      userId,
      extracted_text,
      ocr_confidence || null,
      title || `Report ${new Date().toLocaleDateString()}`,
      description || null,
      viewers || null,
      diamonds || null,
      live_duration || null,
      gift_givers || null,
      new_followers || null,
      comments_count || null,
      leads_data ? JSON.stringify(leads_data) : null,
    ]);

    return res.status(200).json({
      success: true,
      message: "Report saved successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("❌ Error in confirm endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save report: " + error.message,
    });
  }
});

/**
 * GET /api/tiktok-live-reports
 * Get all TikTok live reports for a user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type?.toLowerCase().trim();
    const isAdmin = roleType === "system" || roleType === "manager";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const { startDate, endDate } = req.query;

    let whereClause = "";
    const params = [];

    if (!isAdmin) {
      whereClause += " WHERE user_id = ?";
      params.push(userId);
    } else {
      whereClause += " WHERE 1=1";
    }

    if (startDate) {
      whereClause += " AND created_at >= ?";
      params.push(startDate);
    }
    if (endDate) {
      whereClause += " AND created_at <= ?";
      params.push(endDate + " 23:59:59");
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM tiktok_live_reports${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const selectQuery = `
      SELECT id, image_url, image_filename, extracted_text, ocr_confidence, 
             report_title, report_description, status, created_at, updated_at,
             viewers, diamonds, live_duration, gift_givers, new_followers, comments_count, leads_data
      FROM tiktok_live_reports${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const results = await query(selectQuery, [...params, limit, offset]);

    return res.status(200).json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports: " + error.message,
    });
  }
});

/**
 * GET /api/tiktok-live-reports/:id
 * Get a specific TikTok live report
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const selectQuery = `
      SELECT id, image_url, image_filename, extracted_text, ocr_confidence,
             report_title, report_description, status, created_at, updated_at,
             viewers, diamonds, live_duration, gift_givers, new_followers, comments_count, leads_data
      FROM tiktok_live_reports
      WHERE id = ? AND user_id = ?
    `;

    const result = await queryOne(selectQuery, [id, userId]);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report: " + error.message,
    });
  }
});

/**
 * PUT /api/tiktok-live-reports/:id
 * Update a TikTok live report
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, extracted_text, notes } = req.body;

    // Check if report exists and belongs to user
    const existing = await queryOne(
      "SELECT id FROM tiktok_live_reports WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const updateQuery = `
      UPDATE tiktok_live_reports
      SET report_title = ?, report_description = ?, extracted_text = ?, notes = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await query(updateQuery, [
      title,
      description,
      extracted_text,
      notes,
      id,
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Report updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update report: " + error.message,
    });
  }
});

/**
 * DELETE /api/tiktok-live-reports/:id
 * Delete a TikTok live report
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get report to delete file
    const report = await queryOne(
      "SELECT image_filename FROM tiktok_live_reports WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Delete file from storage (if exists)
    if (report.image_filename) {
      const filePath = path.join(uploadDir, report.image_filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await query("DELETE FROM tiktok_live_reports WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete report: " + error.message,
    });
  }
});

export default router;
