import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// --- Solución para __dirname con ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Inicializar Supabase ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error(
    "❌ ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY"
  );
  process.exit(1);
}
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --- Servir el frontend ---
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

    const { data, error } = await supabase
      .from("Codigos")
      .insert([{ Nombre, Codigo, Docente, Encargado }])
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
   6. MANEJO DE RUTAS NO ENCONTRADAS
==================================== */
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

/* ====================================
   7. INICIAR SERVIDOR (Render o local)
==================================== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

export default app; // Solo necesario si lo usas en Vercel
