const { JSDOM } = require("jsdom");
const path = require("path");

(async () => {
  const file = path.resolve(__dirname, "index.html");
  const fs = require("fs");
  // inline CSS and JS to avoid external fetches (jsdom won't fetch from a local server)
  const rawHtml = fs.readFileSync(file, "utf8");
  const appJs = fs.readFileSync(path.resolve(__dirname, "app.js"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "styles.css"), "utf8");

  // inject CSS and JS inline
  let html = rawHtml.replace(
    /<link[^>]*href="styles\.css"[^>]*>/i,
    `<style>${css}</style>`
  );
  html = html.replace(
    /<script[^>]*src="app\.js"[^>]*><\/script>/i,
    `<script>${appJs}</script>`
  );

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    // set a URL so localStorage is available (non-opaque origin)
    url: "http://localhost/",
  });

  // Wait for window load
  await new Promise((resolve) => {
    dom.window.addEventListener("load", () => setTimeout(resolve, 50));
  });

  const w = dom.window;

  function log(name, ok, details = "") {
    console.log(`${ok ? "✔" : "✖"} ${name} ${details}`);
  }

  try {
    // Initial state
    const initialCount =
      typeof w.filteredTodos === "function" ? w.filteredTodos().length : 0;
    log("Initial todos API available", typeof w.filteredTodos === "function");

    // 1) Add todo by simulating form submit
    const input = w.document.getElementById("todo-input");
    const form = w.document.getElementById("todo-form");
    input.value = "Test item";

    // dispatch submit
    const ev = new w.Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);

    // allow handlers
    await new Promise((r) => setTimeout(r, 50));

    const afterAddCount = w.filteredTodos().length;
    log(
      "Add todo via form",
      afterAddCount === initialCount + 1,
      `(${afterAddCount})`
    );

    const newTodo = w.filteredTodos()[0];
    log("New todo has expected text", newTodo && newTodo.text === "Test item");

    // 2) Edit todo via startEdit API
    // Simulate clicking edit button if present
    const firstLi = w.document.querySelector(".todo-item");
    const editBtn = firstLi && firstLi.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      const editInput = firstLi.querySelector(".edit-input");
      if (editInput) {
        editInput.value = "Edited item";
        const keyEv = new w.KeyboardEvent("keydown", { key: "Enter" });
        editInput.dispatchEvent(keyEv);
        await new Promise((r) => setTimeout(r, 50));
        log(
          "Edit via edit button updates todo",
          (w.filteredTodos()[0] && w.filteredTodos()[0].text) === "Edited item"
        );
      } else {
        log("Edit input appeared", false);
      }
    } else {
      // fallback: call startEdit directly
      if (typeof w.startEdit === "function") {
        w.startEdit(firstLi, w.todos[0]);
        await new Promise((r) => setTimeout(r, 20));
        const editInput = firstLi.querySelector(".edit-input");
        editInput.value = "Edited item";
        const keyEv = new w.KeyboardEvent("keydown", { key: "Enter" });
        editInput.dispatchEvent(keyEv);
        await new Promise((r) => setTimeout(r, 50));
        log(
          "Edit via startEdit updates todo",
          (w.filteredTodos()[0] && w.filteredTodos()[0].text) === "Edited item"
        );
      } else {
        log("No edit functionality", false);
      }
    }

    // 3) Toggle complete via checkbox click
    const cb = firstLi && firstLi.querySelector(".todo-checkbox");
    if (cb) {
      cb.click();
      await new Promise((r) => setTimeout(r, 20));
      const toggled = w.filteredTodos().find((t) => t.id === newTodo.id);
      log(
        "Toggle complete updates todo.completed",
        toggled && toggled.completed === true
      );
    } else {
      log("Checkbox present", false);
    }

    // 4) Filter: set filter to 'active' and check filteredTodos
    w.setFilter("active");
    await new Promise((r) => setTimeout(r, 20));
    const filteredActive = w.filteredTodos();
    log(
      "Filter active hides completed",
      filteredActive.every((t) => !t.completed)
    );

    // 5) Delete todo
    // find delete button
    const delBtn = firstLi && firstLi.querySelector(".icon-btn:not(.edit-btn)");
    if (delBtn) {
      delBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      log(
        "Delete removes todo",
        w.filteredTodos().findIndex((t) => t.id === newTodo.id) === -1
      );
    } else {
      log("Delete button present", false);
    }

    // 6) Clear completed: add two todos, mark one completed, clearCompleted
    w.addTodo("Keep me");
    w.addTodo("Remove me");
    // mark second completed
    const second = w.filteredTodos().find((t) => t.text === "Remove me");
    if (second) {
      w.toggleTodo(second.id);
      await new Promise((r) => setTimeout(r, 20));
      w.clearCompleted();
      await new Promise((r) => setTimeout(r, 20));
      const all = w.filteredTodos();
      log(
        "Clear completed removes completed items",
        all.every((t) => !t.completed) &&
          !all.find((t) => t.text === "Remove me")
      );
    }

    // 7) Persistence: ensure localStorage has data after save
    w.save();
    const raw = w.localStorage.getItem("todos_v1");
    log("LocalStorage saved", !!raw);

    console.log("\nAll tests finished");
  } catch (err) {
    console.error("Test harness error:", err);
    process.exitCode = 2;
  } finally {
    dom.window.close();
  }
})();
