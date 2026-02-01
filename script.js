const STORAGE_KEY = "todo_list_tasks";

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");
const counter = document.getElementById("counter");
const filter = document.getElementById("filterSelect");
const search = document.getElementById("searchInput");
const clearDoneBtn = document.getElementById("clearDoneBtn");

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

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
  // evita abrir editor se já estiver editando
  if (textEl.querySelector("input")) return;

  const current = task.text;
  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.type = "text";
  editInput.value = current;

  // substitui o texto por um input
  textEl.innerHTML = "";
  textEl.appendChild(editInput);
  editInput.focus();
  editInput.select();

  const finish = (commit) => {
    const newValue = editInput.value.trim();

    if (commit) {
      if (!newValue) {
        // se apagar tudo, volta pro texto antigo
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

function render() {
  list.innerHTML = "";
  const visible = getVisibleTasks();

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "item" + (task.done ? " done" : "");

    li.innerHTML = `
      <input class="checkbox" type="checkbox" ${task.done ? "checked" : ""} aria-label="Concluir tarefa">
      <span class="text">${escapeHtml(task.text)}</span>
      <div class="actions">
        <button class="btn-edit" type="button" title="Editar">Editar</button>
        <button class="btn-delete" type="button" title="Excluir">Excluir</button>
      </div>
    `;

    // eventos
    li.querySelector(".checkbox").addEventListener("change", () => {
      task.done = !task.done;
      save();
      render();
    });

    const textEl = li.querySelector(".text");
    textEl.addEventListener("dblclick", () => startEdit(task, textEl));

    li.querySelector(".btn-edit").addEventListener("click", () => startEdit(task, textEl));

    li.querySelector(".btn-delete").addEventListener("click", () => {
      const ok = confirm(`Excluir a tarefa:\n\n"${task.text}" ?`);
      if (!ok) return;

      tasks = tasks.filter((t) => t !== task);
      save();
      render();
    });

    list.appendChild(li);
  });

  updateCounter();
}

// adicionar tarefa
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({
    text,
    done: false,
  });

  input.value = "";
  save();
  render();
  input.focus();
});

filter.addEventListener("change", render);
search.addEventListener("input", render);

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  save();
  render();
});

render();
