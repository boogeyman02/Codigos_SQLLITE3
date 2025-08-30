import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Crear tabla con nombre "estudiantes"
db.exec(`
CREATE TABLE IF NOT EXISTS estudiantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  docente TEXT,
  encargado TEXT
);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);
CREATE INDEX IF NOT EXISTS idx_estudiantes_nombre ON estudiantes(nombre);
`);

// 2) Leer JSON
const jsonPath = path.join(__dirname, "..", "..", "data", "estudiantes.json");
if (!fs.existsSync(jsonPath)) {
  console.error("❌ No se encontró data/estudiantes.json");
  process.exit(1);
}

let rows;
try {
  const raw = fs.readFileSync(jsonPath, "utf8");
  rows = JSON.parse(raw);
} catch (e) {
  console.error("❌ JSON inválido en data/estudiantes.json");
  process.exit(1);
}

// 3) Limpiar tabla antes de insertar
db.exec("DELETE FROM estudiantes; VACUUM;");

// 4) Insertar datos
const insert = db.prepare(
  "INSERT INTO estudiantes (nombre, codigo, docente, encargado) VALUES (@nombre, @codigo, @docente, @encargado)"
);

const insertMany = db.transaction((arr) => {
  for (const r of arr) {
    insert.run({
      nombre: (r.nombre || "").trim(),
      codigo: String(r.codigo || "").trim(),
      docente: r.docente || null,
      encargado: r.encargado || null,
    });
  }
});

insertMany(rows);

console.log(`✅ Insertados ${rows.length} estudiantes en la tabla "estudiantes".`);
