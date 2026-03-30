require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const HF_TOKEN = process.env.HF_TOKEN;

// Delete time in milliseconds (5 min)
const DELETE_DELAY = 5 * 60 * 1000; 

// ✅ Root
app.get("/", (req, res) => {
  res.send("🚀 Free Image API Running FINAL with Auto-Delete");
});

// ✅ Generate Image
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt missing" });
  }

  try {
    console.log("🧠 Generating image...");

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

    console.log("✅ Image saved:", fileName);

    // 🔹 Schedule auto delete
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("❌ Failed to delete:", fileName, err);
          else console.log("🗑️ Auto-deleted:", fileName);
        });
      }
    }, DELETE_DELAY);

    res.json({
      message: "✅ Image generated",
      file: fileName,
      note: `File will be auto-deleted in ${DELETE_DELAY / 60000} minutes`,
    });

  } catch (err) {
    let errorMsg = err.message;

    try {
      const data = JSON.parse(err.response.data.toString());
      errorMsg = data.error;
    } catch {}

    console.error("❌ Error:", errorMsg);

    res.status(500).json({
      error: "Generation failed",
      details: errorMsg,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});