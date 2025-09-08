import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Inicializar Supabase ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/* ====================================
   1. OBTENER TODOS LOS REGISTROS
==================================== */
app.get("/api/codigos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("Codigos")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error al obtener registros:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ====================================
   2. AGREGAR UN NUEVO REGISTRO
==================================== */
app.post("/api/codigos", async (req, res) => {
  try {
    const { Nombre, Codigo, Docente, Encargado } = req.body;

    // --- Obtener el mayor id actual ---
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("Codigos")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) throw maxIdError;

    const nuevoId = maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    // --- Insertar nuevo registro con id calculado ---
    const { data, error } = await supabase
      .from("Codigos")
      .insert([{ id: nuevoId, Nombre, Codigo, Docente, Encargado }])
      .select();

    if (error) throw error;

    res.json({ success: true, nuevo: data[0] });
  } catch (err) {
    console.error("❌ Error insertando registro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ====================================
   3. ACTUALIZAR REGISTRO EXISTENTE
==================================== */
app.put("/api/codigos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, Codigo, Docente, Encargado } = req.body;

    // Verificar que el registro exista
    const { data: existe, error: errorExiste } = await supabase
      .from("Codigos")
      .select("id")
      .eq("id", id);

    if (errorExiste) throw errorExiste;
    if (existe.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    // Actualizar el registro
    const { data, error } = await supabase
      .from("Codigos")
      .update({ Nombre, Codigo, Docente, Encargado })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({ success: true, actualizado: data[0] });
  } catch (err) {
    console.error("❌ Error actualizando registro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ====================================
   4. ELIMINAR UN REGISTRO
==================================== */
app.delete("/api/codigos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("Codigos")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.json({ success: true, eliminado: data[0] });
  } catch (err) {
    console.error("❌ Error eliminando registro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ====================================
   5. LOGIN SENCILLO (HARDCODED)
==================================== */
app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === "root" && password === "123") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Credenciales inválidas" });
  }
});

/* ====================================
   INICIAR SERVIDOR
==================================== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
