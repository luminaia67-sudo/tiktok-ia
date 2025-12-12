// ============================================================
// BOOMINUM SERVER - VERSÃO FINAL 2025 (CORRIGIDA DEFINITIVA)
// GROQ + Supabase + Limite diário + Compatível com script.js
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
// GROQ SDK (VERSÃO ATUAL 2025)
// ------------------------------------------------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Modelos suportados
const AVAILABLE_MODELS = [
  "llama-3.2-70b-text",
  "llama-3.2-11b-text",
  "mixtral-8x7b-32768"
];

const DEFAULT_MODEL = "llama-3.2-70b-text";

// ------------------------------------------------------------
// ROTA PRINCIPAL /api/generate
// ------------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { prompt, model, userId } = req.body;

  console.log("\n📩 REQUEST FRONT-END:", req.body);

  try {
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt obrigatório." });
    }

    // --------------------------------------------------------
    // 1. LIMITE DIÁRIO DO USUÁRIO
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
          error: "Limite de geração atingido.",
          details: `Você já gerou ${FREE_LIMIT} roteiros hoje.`
        });
      }
    }

    // --------------------------------------------------------
    // 2. VALIDAR MODELO
    // --------------------------------------------------------
    const selectedModel =
      AVAILABLE_MODELS.includes(model) ? model : DEFAULT_MODEL;

    console.log("🤖 Modelo escolhido:", selectedModel);

    // --------------------------------------------------------
    // 3. GERAR ROTEIRO COM GROQ (SDK NOVO)
    // --------------------------------------------------------
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content:
            "Você gera roteiros profissionais, curtos, criativos e virais para vídeos."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 900
    });

    const generatedText =
      completion?.choices?.[0]?.message?.content ||
      "Erro: resposta vazia da IA.";

    console.log("✅ Roteiro gerado com sucesso!");

    // --------------------------------------------------------
    // 4. SALVAR NO SUPABASE
    // --------------------------------------------------------
    if (userId) {
      await supabase.from("scripts").insert([
        {
          user_id: userId,
          prompt,
          roteiro_final: generatedText,
          model_usado: selectedModel
        }
      ]);
    }

    // --------------------------------------------------------
    // 5. ENVIAR PARA O FRONT
    // --------------------------------------------------------
    res.json({
      success: true,
      model: selectedModel,
      result: generatedText
    });
  } catch (err) {
    console.error("❌ ERRO NO /api/generate:", err);

    res.status(500).json({
      error: "Erro interno ao gerar roteiro.",
      details: err.message
    });
  }
});

// ------------------------------------------------------------
// INICIAR SERVIDOR
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🔥 Servidor BOOMINUM rodando na porta ${PORT}`);
});
