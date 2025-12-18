// ============================================================
// BOOMINUM SERVER - VERSÃO FINAL DEFINITIVA (ESTÁVEL)
// GROQ + Supabase + Modelo FIXO (SEM ERRO)
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// ------------------------------------------------------------
// EXPRESS
// ------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// SUPABASE
// ------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const FREE_LIMIT = parseInt(process.env.FREE_LIMIT || "5", 10);

// ------------------------------------------------------------
// GROQ — MODELO QUE SUA CONTA REALMENTE TEM
// ------------------------------------------------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const FIXED_MODEL = "llama3-8b-8192";

// ------------------------------------------------------------
// ROTA PRINCIPAL
// ------------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { prompt, userId } = req.body;

  console.log("📩 REQUEST:", { prompt });

  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt obrigatório." });
    }

    // --------------------------------------------------------
    // LIMITE DIÁRIO (OPCIONAL)
    // --------------------------------------------------------
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today.getTime() + 86400000);

      const { count } = await supabase
        .from("scripts")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      if (count >= FREE_LIMIT) {
        return res.status(403).json({
          error: "Limite diário atingido."
        });
      }
    }

    // --------------------------------------------------------
    // CHAMADA GROQ (MODELO FIXO)
    // --------------------------------------------------------
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

    const generatedText =
      completion?.choices?.[0]?.message?.content ||
      "Erro: resposta vazia da IA.";

    // --------------------------------------------------------
    // SALVAR (SE LOGADO)
    // --------------------------------------------------------
    if (userId) {
      await supabase.from("scripts").insert([
        {
          user_id: userId,
          prompt,
          roteiro_final: generatedText,
          model_usado: FIXED_MODEL
        }
      ]);
    }

    return res.json({
      success: true,
      model: FIXED_MODEL,
      result: generatedText
    });

  } catch (err) {
    console.error("❌ ERRO GROQ:", err);
    return res.status(500).json({
      error: "Erro interno ao gerar roteiro."
    });
  }
});

// ------------------------------------------------------------
// START
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🔥 BOOMINUM rodando na porta ${PORT}`);
});
