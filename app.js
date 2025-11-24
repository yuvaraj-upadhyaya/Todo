/*
  Simple Todo app (separate file).
  Features: add, complete, delete, edit (double-click), filters (all/active/completed),
  clear completed, localStorage persistence, counts, keyboard support (Enter to add, Esc to cancel edit).
*/

const STORAGE_KEY = 'todos_v1';

let todos = [];
let filter = 'all'; // 'all' | 'active' | 'completed'

const elements = {
  form: document.getElementById('todo-form'),
  input: document.getElementById('todo-input'),
  list: document.getElementById('todo-list'),
  count: document.getElementById('todo-count'),
  filters: document.querySelectorAll('.filter-btn'),
  clearBtn: document.getElementById('clear-completed')
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch {
    todos = [];
  }
}

function addTodo(text) {
  if (!text || !text.trim()) return;
  todos.unshift({
    id: uid(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now()
  });
  save();
  render();
}

function toggleTodo(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  save();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(x => x.id !== id);
  save();
  render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  save();
  render();
}

function updateTodoText(id, newText) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.text = newText.trim();
  save();
  render();
}

function filteredTodos() {
  if (filter === 'active') return todos.filter(t => !t.completed);
  if (filter === 'completed') return todos.filter(t => t.completed);
  return todos;
}

function setFilter(newFilter) {
  filter = newFilter;
  elements.filters.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === newFilter);
    btn.setAttribute('aria-selected', btn.dataset.filter === newFilter ? 'true' : 'false');
  });
  render();
}

function updateCount() {
  const activeCount = todos.filter(t => !t.completed).length;
  elements.count.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
}

function createTodoNode(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = todo.id;

  // Checkbox
  const cb = document.createElement('button');
  cb.className = 'todo-checkbox' + (todo.completed ? ' checked' : '');
  cb.setAttribute('aria-label', todo.completed ? 'Mark as active' : 'Mark as completed');
  cb.title = cb.getAttribute('aria-label');
  cb.type = 'button';
  cb.addEventListener('click', () => toggleTodo(todo.id));
  cb.innerHTML = todo.completed ? '✓' : '';

  // Label (editable)
  const label = document.createElement('div');
  label.className = 'todo-label' + (todo.completed ? ' completed' : '');
  label.textContent = todo.text;
  label.title = 'Double-click to edit';
  label.addEventListener('dblclick', () => startEdit(li, todo));

  // Actions (delete)
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn';
  delBtn.title = 'Delete';
  delBtn.type = 'button';
  delBtn.innerHTML = '🗑';
  delBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.appendChild(delBtn);

  li.appendChild(cb);
  li.appendChild(label);
  li.appendChild(actions);

  return li;
}

function startEdit(listItem, todo) {
  const label = listItem.querySelector('.todo-label');
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = todo.text;
  input.setAttribute('aria-label', 'Edit todo');
  listItem.replaceChild(input, label);
  input.focus();
  // Move caret to end
  input.setSelectionRange(input.value.length, input.value.length);

  function finish(saveText) {
    if (saveText !== null) {
      const newText = saveText.trim();
      if (newText) updateTodoText(todo.id, newText);
      else deleteTodo(todo.id);
    } else {
      render(); // cancel - re-render to restore
    }
    cleanup();
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      finish(input.value);
    } else if (e.key === 'Escape') {
      finish(null);
    }
  }

  function onBlur() {
    finish(input.value);
  }

  function cleanup() {
    input.removeEventListener('keydown', onKey);
    input.removeEventListener('blur', onBlur);
  }

  input.addEventListener('keydown', onKey);
  input.addEventListener('blur', onBlur);
}

function render() {
  // Clear list
  elements.list.innerHTML = '';

  const list = filteredTodos();

  if (list.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-item';
    empty.style.justifyContent = 'center';
    empty.style.color = '#9aa4b2';
    empty.style.padding = '18px 0';
    empty.textContent = 'No todos';
    elements.list.appendChild(empty);
  } else {
    for (const t of list) {
      elements.list.appendChild(createTodoNode(t));
    }
  }

  updateCount();
}

function init() {
  load();
  render();

  // Form submit - add new todo
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = elements.input.value;
    addTodo(value);
    elements.input.value = '';
    elements.input.focus();
  });

  // Keyboard: Enter in input already handled by form; provide Esc to clear input
  elements.input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') elements.input.value = '';
  });

  // Filter buttons
  elements.filters.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
    });
  });

  // Clear completed
  elements.clearBtn.addEventListener('click', () => {
    clearCompleted();
  });

  // Accessibility: allow toggling by pressing Enter on checkbox element (it is a button so works)
  // Save on unload (already saved on mutations, but keep a fallback)
  window.addEventListener('beforeunload', save);
}

init();