const STORAGE_KEY = "todo_list_tasks";
const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");
const counter = document.getElementById("counter");
const filter = document.getElementById("filterSelect");
const search = document.getElementById("searchInput");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const priorityInput = document.getElementById("priorityInput");
const dueInput = document.getElementById("dueInput");

// ===== Tema (light/dark) =====
const THEME_KEY = "todo_theme";
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light", isLight);
  if (themeToggle) themeToggle.textContent = isLight ? "☀️ Tema" : "🌙 Tema";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved === "light" ? "light" : "dark";
  applyTheme(theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light");
  const next = isLight ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}
initTheme();


let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

// garante que todas as tasks tenham id (inclusive as antigas já salvas)
function ensureIds() {
  let changed = false;
  tasks = tasks.map(t => {
    if (!t.id) {
      changed = true;
      return { ...t, id: makeId() };
    }
    return t;
  });
  if (changed) save();
}
ensureIds();

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getVisibleTasks() {
  let filtered = tasks.filter((task) => {
    if (filter.value === "done") return task.done;
    if (filter.value === "active") return !task.done;
    return true;
  });

  const q = search.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((task) => task.text.toLowerCase().includes(q));
  }

  return filtered;
}

function updateCounter() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pending = total - done;

  counter.textContent = `${total} tarefa(s) • ${pending} pendente(s) • ${done} concluída(s)`;
}

function startEdit(task, textEl) {
  if (textEl.querySelector("input")) return;

  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.type = "text";
  editInput.value = task.text;

  textEl.innerHTML = "";
  textEl.appendChild(editInput);
  editInput.focus();
  editInput.select();

  const finish = (commit) => {
    const newValue = editInput.value.trim();

    if (commit) {
      if (!newValue) {
        textEl.textContent = task.text;
        return;
      }
      task.text = newValue;
      save();
    }

    textEl.textContent = task.text;
    render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });

  editInput.addEventListener("blur", () => finish(true));
}

/* =========================
   Drag & Drop (reordenar)
   ========================= */
let draggingId = null;

function moveTask(dragId, targetId) {
  if (!dragId || !targetId || dragId === targetId) return;

  const fromIndex = tasks.findIndex(t => t.id === dragId);
  const toIndex = tasks.findIndex(t => t.id === targetId);

  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);

  save();
  render();
}

function render() {
  list.innerHTML = "";
  const visible = getVisibleTasks();

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "item" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    // 🔥 torna arrastável
    li.draggable = true;
    const pr = task.priority || "medium";

const prLabel =
  pr === "high" ? "Alta" :
  pr === "low" ? "Baixa" :
  "Média";

const due = task.dueDate
  ? task.dueDate.split("-").reverse().join("/")
  : null;
  const isOverdue = (() => {
  if (task.done) return false;
  if (!task.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate + "T00:00:00");

  return dueDate < today;
})();

    li.innerHTML = `
  <span class="drag-handle" title="Arraste para reordenar">⠿</span>

  <input class="checkbox" type="checkbox" ${task.done ? "checked" : ""}>

  <div>
    <span class="text">${escapeHtml(task.text)}</span>

    <div class="meta">
      <span class="badge ${pr}">⚑ ${prLabel}</span>
      ${due ? `<span class="badge">📅 ${due}</span>` : ""}
      ${isOverdue ? `<span class="badge overdue">⏰ Atrasada</span>` : ""}
    </div>
  </div>

  <div class="actions">
    <button class="btn-edit" type="button">Editar</button>
    <button class="btn-delete" type="button">Excluir</button>
  </div>
`;


    // checkbox done
    li.querySelector(".checkbox").addEventListener("change", () => {
      task.done = !task.done;
      save();
      render();
    });

    // editar
    const textEl = li.querySelector(".text");
    textEl.addEventListener("dblclick", () => startEdit(task, textEl));
    li.querySelector(".btn-edit").addEventListener("click", () => startEdit(task, textEl));

    // excluir
    li.querySelector(".btn-delete").addEventListener("click", () => {
      const ok = confirm(`Excluir a tarefa:\n\n"${task.text}" ?`);
      if (!ok) return;
      tasks = tasks.filter((t) => t.id !== task.id);
      save();
      render();
    });

    // Drag events
    li.addEventListener("dragstart", (e) => {
      draggingId = task.id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      // ajuda alguns navegadores a iniciar o drag
      e.dataTransfer.setData("text/plain", task.id);
    });

    li.addEventListener("dragend", () => {
      draggingId = null;
      li.classList.remove("dragging");
      list.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault(); // necessário pra permitir drop
      li.classList.add("drag-over");
      e.dataTransfer.dropEffect = "move";
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const targetId = li.dataset.id;
      // alguns browsers pegam do dataTransfer, outros do draggingId
      const dragId = e.dataTransfer.getData("text/plain") || draggingId;
      moveTask(dragId, targetId);
    });

    list.appendChild(li);
  });

  updateCounter();
}

// adicionar
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({
  id: makeId(),
  text,
  done: false,
  priority: priorityInput?.value || "medium",
  dueDate: dueInput?.value || null, // formato YYYY-MM-DD
  createdAt: new Date().toISOString()
});


  input.value = "";
  if (priorityInput) priorityInput.value = "medium";
if (dueInput) dueInput.value = "";
});

filter.addEventListener("change", render);
search.addEventListener("input", render);

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  save();
  render();
});

render();
