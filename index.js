/**
 * 🚀 Image Generation API
 * Author: SUJON-BOSS
 * Features:
 * - Hugging Face Stable Diffusion XL 1.0
 * - 4K/8K image generation
 * - Auto-delete images after 5 minutes
 * - Public image access for browser
 */

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const HF_TOKEN = process.env.HF_TOKEN;

// ✅ Serve generated images publicly
app.use("/image", express.static(__dirname));

// ✅ Root
app.get("/", (req, res) => {
  res.send("<h2>🚀 Free Image API Running FINAL</h2><p>Author: SUJON-BOSS</p>");
});

// ✅ Generate Image
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt missing" });

  try {
    console.log("🧠 Generating image for prompt:", prompt);

    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        responseType: "arraybuffer",
      }
    );

    const fileName = `image_${Date.now()}.png`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, response.data);

    // ✅ Auto-delete after 5 minutes
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5 * 60 * 1000);

    res.json({
      message: "✅ Image generated",
      file: fileName,
      url: `/image/${fileName}`,
      note: "File will be auto-deleted in 5 minutes",
    });

    console.log("✅ Image saved:", fileName);

  } catch (err) {
    let errorMsg = err.message;
    try { 
      errorMsg = JSON.parse(err.response.data.toString()).error;
    } catch {}
    console.error("❌ Generation failed:", errorMsg);
    res.status(500).json({ error: "Generation failed", details: errorMsg });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
