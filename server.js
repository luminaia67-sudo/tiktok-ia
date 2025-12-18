// ============================================================
// BOOMINUM SERVER — VERSÃO FINAL ESTÁVEL (DEBUG LIMPO)
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";

// ------------------------------------------------------------
// EXPRESS
// ------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// GROQ — MODELO GRATUITO (ÚNICO PERMITIDO)
// ------------------------------------------------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const FIXED_MODEL = "llama-3.1-8b-instant";

// ------------------------------------------------------------
// ROTA PRINCIPAL
// ------------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  console.log("📩 REQUEST:", prompt);
  console.log("🤖 MODELO FIXO:", FIXED_MODEL);

  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt obrigatório." });
    }

    const completion = await groq.chat.completions.create({
      model: FIXED_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Você cria roteiros curtos, profissionais, criativos e virais para vídeos."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const result =
      completion?.choices?.[0]?.message?.content ||
      "Resposta vazia da IA.";

    return res.json({
      success: true,
      model: FIXED_MODEL,
      result
    });

  } catch (err) {
    console.error("❌ ERRO REAL GROQ:", err?.error || err);
    return res.status(500).json({
      error: err?.error?.message || err.message || "Erro desconhecido"
    });
  }
});

// ------------------------------------------------------------
// START
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🔥 BOOMINUM rodando na porta ${PORT}`);
});
