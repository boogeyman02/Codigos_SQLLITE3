document.addEventListener("DOMContentLoaded", async () => {
  const inputBuscar = document.getElementById("buscar");
  const tablaGrados = document.getElementById("tabla-grados");
  const modalNombre = document.getElementById("modalNombre");
  const modalCodigo = document.getElementById("modalCodigo");
  const checkAcudiente1 = document.getElementById("checkAcudiente1");
  const checkAcudiente2 = document.getElementById("checkAcudiente2");
  const labelAcudiente1 = document.getElementById("labelAcudiente1");
  const labelAcudiente2 = document.getElementById("labelAcudiente2");
  const btnGuardar = document.getElementById("btnGuardar");

  let estudiantes = []; // Lista completa desde la BD
  let estudianteSeleccionado = null; // Guarda el estudiante actual para editar

  // === Inicializar Supabase ===
  async function initSupabase() {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("No se pudo cargar la configuración");

      const config = await res.json();
      window.supabaseClient = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseKey
      );
      console.log("✅ Supabase inicializado correctamente");

      await cargarEstudiantes();
      escucharCambiosTiempoReal();
    } catch (err) {
      console.error("❌ Error inicializando Supabase:", err.message);
    }
  }

  // === Cargar lista completa ===
  async function cargarEstudiantes() {
    try {
      const res = await fetch("/api/grados");
      estudiantes = await res.json();
      mostrarEstudiantes(estudiantes);
    } catch (err) {
      console.error("❌ Error cargando estudiantes:", err.message);
    }
  }

  // === Mostrar estudiantes en la tabla ===
  function mostrarEstudiantes(lista) {
    if (!lista.length) {
      tablaGrados.innerHTML = `<tr><td colspan="7" class="text-center text-warning">No hay registros</td></tr>`;
      return;
    }

    tablaGrados.innerHTML = lista
      .map(
        (est) => `
      <tr>
        <td>${est.Estudiante}</td>
        <td>${est.Codigo}</td>
        <td>${est.Acudiente_1 || "-"}</td>
        <td class="${
          est.estado1 ? "text-success font-weight-bold" : "text-warning font-weight-bold"
        }">
          ${est.estado1 ? "Asistió" : "Pendiente"}
        </td>
        <td>${est.Acudiente_2 || "-"}</td>
        <td class="${
          est.estado2 ? "text-success font-weight-bold" : "text-warning font-weight-bold"
        }">
          ${est.estado2 ? "Asistió" : "Pendiente"}
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="abrirModal(${est.id})">
            Editar
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // === Filtrar conforme se escribe ===
  inputBuscar.addEventListener("input", () => {
    const query = inputBuscar.value.toLowerCase().trim();
    if (!query) {
      mostrarEstudiantes(estudiantes);
      return;
    }

    const filtrados = estudiantes.filter(
      (est) =>
        est.Estudiante.toLowerCase().includes(query) ||
        est.Codigo.toString().includes(query)
    );

    mostrarEstudiantes(filtrados);
  });

  // === Escuchar cambios en tiempo real ===
  function escucharCambiosTiempoReal() {
    const channel = supabaseClient
      .channel("public:grados") // 👈 nombre único para la tabla grados
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE y DELETE
          schema: "public",
          table: "grados",
        },
        (payload) => {
          console.log("🔄 Cambio detectado:", payload);

          if (payload.eventType === "INSERT") {
            estudiantes.push(payload.new);
          } else if (payload.eventType === "UPDATE") {
            const index = estudiantes.findIndex((est) => est.id === payload.new.id);
            if (index !== -1) estudiantes[index] = payload.new;
          } else if (payload.eventType === "DELETE") {
            estudiantes = estudiantes.filter((est) => est.id !== payload.old.id);
          }

          // Actualizar vista según búsqueda activa
          const query = inputBuscar.value.toLowerCase().trim();
          if (query) {
            const filtrados = estudiantes.filter(
              (est) =>
                est.Estudiante.toLowerCase().includes(query) ||
                est.Codigo.toString().includes(query)
            );
            mostrarEstudiantes(filtrados);
          } else {
            mostrarEstudiantes(estudiantes);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Estado de suscripción Realtime:", status);
      });

    console.log("👀 Escuchando cambios en tiempo real en la tabla 'grados'");
  }

  // === Abrir modal con datos del estudiante seleccionado ===
  window.abrirModal = (id) => {
    estudianteSeleccionado = estudiantes.find((e) => e.id === id);
    if (!estudianteSeleccionado) return;

    modalNombre.textContent = estudianteSeleccionado.Estudiante;
    modalCodigo.textContent = estudianteSeleccionado.Codigo;

    // Labels y estados actuales
    labelAcudiente1.textContent = estudianteSeleccionado.Acudiente_1 || "Acudiente 1";
    labelAcudiente2.textContent = estudianteSeleccionado.Acudiente_2 || "Acudiente 2";

    checkAcudiente1.checked = estudianteSeleccionado.estado1 || false;
    checkAcudiente2.checked = estudianteSeleccionado.estado2 || false;

    // Mostrar modal
    $("#modalAsistencia").modal("show");
  };

  // === Guardar cambios en la BD ===
  btnGuardar.addEventListener("click", async () => {
    if (!estudianteSeleccionado) return;

    try {
      const res = await fetch(`/api/grados/asistencia/${estudianteSeleccionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado1: checkAcudiente1.checked,
          estado2: checkAcudiente2.checked,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar asistencia");

      const data = await res.json();
      console.log("✅ Actualización exitosa:", data);

      $("#modalAsistencia").modal("hide");
    } catch (err) {
      console.error("❌ Error actualizando asistencia:", err.message);
      alert("Error al actualizar la asistencia. Intenta de nuevo.");
    }
  });

  initSupabase();
});
