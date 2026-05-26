import express from "express";
import { authenticateToken } from "../auth.js";
import { getAllCategories, getCategoryByName, createCategory, updateCategory, deleteCategory } from "../services/leadCategoryService.js";

const router = express.Router();

router.get("/lead-categories", authenticateToken, async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Error get lead categories:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/lead-categories", authenticateToken, async (req, res) => {
  try {
    const { name, label, color, icon, keywords } = req.body;
    if (!name || !label) {
      return res.status(400).json({ success: false, message: "name and label required" });
    }
    const cat = await createCategory({ name, label, color, icon, keywords });
    res.json({ success: true, data: cat });
  } catch (err) {
    console.error("Error create lead category:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/lead-categories/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await updateCategory(parseInt(id), req.body);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, data: cat });
  } catch (err) {
    console.error("Error update lead category:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/lead-categories/:id", authenticateToken, async (req, res) => {
  try {
    await deleteCategory(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error("Error delete lead category:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
