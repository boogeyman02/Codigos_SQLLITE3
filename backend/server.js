import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 👉 servir la carpeta frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// --- API: obtener todos los estudiantes ---
app.get("/api/estudiantes", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM estudiantes").all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al leer estudiantes:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- API: eliminar estudiante ---
app.delete("/api/estudiantes/:id", (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM estudiantes WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Estudiante no encontrado" });
    }
  } catch (error) {
    console.error("Error eliminando estudiante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
// --- API: agregar estudiante ---
app.post("/api/estudiantes", (req, res) => {
  try {
    const { nombre, codigo, docente, encargado } = req.body;
    const stmt = db.prepare("INSERT INTO estudiantes (nombre, codigo, docente, encargado) VALUES (?, ?, ?, ?)");
    const result = stmt.run(nombre, codigo, docente, encargado);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error insertando estudiante:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- API: actualizar estudiante ---
app.put("/api/estudiantes/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, docente, encargado } = req.body;
    const stmt = db.prepare("UPDATE estudiantes SET nombre=?, codigo=?, docente=?, encargado=? WHERE id=?");
    const result = stmt.run(nombre, codigo, docente, encargado, id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Estudiante no encontrado" });
    }
  } catch (err) {
    console.error("❌ Error actualizando estudiante:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- API: login sencillo ---
app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === "root" && password === "123") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Credenciales inválidas" });
  }
});

// 🚀 iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
