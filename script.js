const STORAGE_KEY = "todo_list_tasks";

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");
const counter = document.getElementById("counter");
const filter = document.getElementById("filterSelect");
const search = document.getElementById("searchInput");
const clearDoneBtn = document.getElementById("clearDoneBtn");

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// salvar no localStorage
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// renderizar lista
function render() {
  list.innerHTML = "";

  let filtered = tasks.filter(task => {
    if (filter.value === "done") return task.done;
    if (filter.value === "active") return !task.done;
    return true;
  });

  filtered = filtered.filter(task =>
    task.text.toLowerCase().includes(search.value.toLowerCase())
  );

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = "item" + (task.done ? " done" : "");

    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""}>
      <span class="text">${task.text}</span>
      <button>Excluir</button>
    `;

    li.querySelector("input").addEventListener("change", () => {
      task.done = !task.done;
      save();
      render();
    });

    li.querySelector("button").addEventListener("click", () => {
      tasks = tasks.filter(t => t !== task);
      save();
      render();
    });

    list.appendChild(li);
  });

  counter.textContent = `${tasks.length} tarefa(s)`;
}

// adicionar tarefa
form.addEventListener("submit", e => {
  e.preventDefault();

  if (input.value.trim() === "") return;

  tasks.unshift({
    text: input.value.trim(),
    done: false
  });

  input.value = "";
  save();
  render();
});

filter.addEventListener("change", render);
search.addEventListener("input", render);
clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.done);
  save();
  render();
});

render();
