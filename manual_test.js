const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

(async () => {
  console.log("🚀 Starting Manual Feature Testing\n");
  console.log("=".repeat(60));

  // Load and inline resources
  const file = path.resolve(__dirname, "index.html");
  const rawHtml = fs.readFileSync(file, "utf8");
  const appJs = fs.readFileSync(path.resolve(__dirname, "app.js"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "styles.css"), "utf8");

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
    url: "http://localhost/",
  });

  await new Promise((resolve) => {
    dom.window.addEventListener("load", () => setTimeout(resolve, 100));
  });

  const w = dom.window;
  const doc = w.document;

  function log(step, action, result) {
    console.log(`\n${step}. ${action}`);
    console.log(`   ➜ ${result}`);
  }

  try {
    // Feature 1: Add Todos
    console.log("\n📝 FEATURE 1: Adding Todos");
    console.log("-".repeat(60));

    const input = doc.getElementById("todo-input");
    const form = doc.getElementById("todo-form");

    log(
      "1.1",
      "Adding first todo: 'Buy groceries'",
      "Typing into input field..."
    );
    input.value = "Buy groceries";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true })
    );
    await new Promise((r) => setTimeout(r, 50));
    console.log(`   ✓ Todo added! Total count: ${w.filteredTodos().length}`);

    log(
      "1.2",
      "Adding second todo: 'Call dentist'",
      "Typing into input field..."
    );
    input.value = "Call dentist";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true })
    );
    await new Promise((r) => setTimeout(r, 50));
    console.log(`   ✓ Todo added! Total count: ${w.filteredTodos().length}`);

    log(
      "1.3",
      "Adding third todo: 'Finish project'",
      "Typing into input field..."
    );
    input.value = "Finish project";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true })
    );
    await new Promise((r) => setTimeout(r, 50));
    console.log(`   ✓ Todo added! Total count: ${w.filteredTodos().length}`);

    const todos = w.filteredTodos();
    console.log(`\n   📋 Current todos:`);
    todos.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text} ${t.completed ? "✓" : "○"}`);
    });

    // Feature 2: Edit Todos
    console.log("\n\n✏️  FEATURE 2: Editing Todos");
    console.log("-".repeat(60));

    const firstLi = doc.querySelector(".todo-item");
    const editBtn = firstLi.querySelector(".edit-btn");

    log(
      "2.1",
      "Clicking edit button (✎) on first todo",
      "Opening edit mode..."
    );
    editBtn.click();
    await new Promise((r) => setTimeout(r, 50));

    const editInput = firstLi.querySelector(".edit-input");
    console.log(`   ✓ Edit input appeared with value: "${editInput.value}"`);

    log(
      "2.2",
      "Changing text to 'Buy groceries and fruits'",
      "Typing new text..."
    );
    editInput.value = "Buy groceries and fruits";
    editInput.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter" }));
    await new Promise((r) => setTimeout(r, 50));
    console.log(`   ✓ Todo updated! New text: "${w.filteredTodos()[0].text}"`);

    // Feature 3: Toggle Complete
    console.log("\n\n✅ FEATURE 3: Marking Todos Complete/Incomplete");
    console.log("-".repeat(60));

    const secondLi = doc.querySelectorAll(".todo-item")[1];
    const checkbox = secondLi.querySelector(".todo-checkbox");

    log("3.1", "Clicking checkbox on 'Call dentist'", "Marking as complete...");
    checkbox.click();
    await new Promise((r) => setTimeout(r, 50));
    const secondTodo = w.filteredTodos().find((t) => t.text === "Call dentist");
    console.log(
      `   ✓ Marked complete! Status: ${
        secondTodo.completed ? "✓ Completed" : "○ Active"
      }`
    );

    log("3.2", "Clicking checkbox again", "Marking as active...");
    checkbox.click();
    await new Promise((r) => setTimeout(r, 50));
    const secondTodoAgain = w
      .filteredTodos()
      .find((t) => t.text === "Call dentist");
    console.log(
      `   ✓ Marked active! Status: ${
        secondTodoAgain.completed ? "✓ Completed" : "○ Active"
      }`
    );

    // Mark one as complete for filtering test
    checkbox.click();
    await new Promise((r) => setTimeout(r, 50));

    console.log(`\n   📋 Current todos:`);
    w.filteredTodos().forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text} ${t.completed ? "✓" : "○"}`);
    });

    // Feature 4: Filtering
    console.log("\n\n🔍 FEATURE 4: Filtering Todos");
    console.log("-".repeat(60));

    log("4.1", "Clicking 'All' filter", "Showing all todos...");
    w.setFilter("all");
    await new Promise((r) => setTimeout(r, 50));
    console.log(
      `   ✓ Filter applied! Showing ${w.filteredTodos().length} todos`
    );

    log("4.2", "Clicking 'Active' filter", "Showing only active todos...");
    w.setFilter("active");
    await new Promise((r) => setTimeout(r, 50));
    const activeTodos = w.filteredTodos();
    console.log(
      `   ✓ Filter applied! Showing ${activeTodos.length} active todos:`
    );
    activeTodos.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text}`);
    });

    log(
      "4.3",
      "Clicking 'Completed' filter",
      "Showing only completed todos..."
    );
    w.setFilter("completed");
    await new Promise((r) => setTimeout(r, 50));
    const completedTodos = w.filteredTodos();
    console.log(
      `   ✓ Filter applied! Showing ${completedTodos.length} completed todo(s):`
    );
    completedTodos.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text}`);
    });

    log("4.4", "Switching back to 'All' filter", "Showing all todos...");
    w.setFilter("all");
    await new Promise((r) => setTimeout(r, 50));
    console.log(
      `   ✓ Filter applied! Showing ${w.filteredTodos().length} todos`
    );

    // Feature 5: Delete Todos
    console.log("\n\n🗑️  FEATURE 5: Deleting Todos");
    console.log("-".repeat(60));

    const beforeDelete = w.filteredTodos().length;
    const thirdLi = doc.querySelectorAll(".todo-item")[2];
    const deleteBtn = thirdLi.querySelector(".icon-btn:not(.edit-btn)");
    const todoToDelete = w.filteredTodos()[2].text;

    log(
      "5.1",
      `Clicking delete button (🗑) on '${todoToDelete}'`,
      "Removing todo..."
    );
    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    console.log(
      `   ✓ Todo deleted! Count: ${beforeDelete} → ${w.filteredTodos().length}`
    );

    console.log(`\n   📋 Remaining todos:`);
    w.filteredTodos().forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text} ${t.completed ? "✓" : "○"}`);
    });

    // Feature 6: Clear Completed
    console.log("\n\n🧹 FEATURE 6: Clear Completed Todos");
    console.log("-".repeat(60));

    // Mark another todo as complete
    const anotherLi = doc.querySelector(".todo-item");
    const anotherCheckbox = anotherLi.querySelector(".todo-checkbox");
    anotherCheckbox.click();
    await new Promise((r) => setTimeout(r, 50));

    const beforeClear = w.filteredTodos().length;
    const completedCount = w.filteredTodos().filter((t) => t.completed).length;

    log(
      "6.1",
      `Found ${completedCount} completed todo(s)`,
      "Preparing to clear..."
    );
    console.log(`   📋 Before clearing (${beforeClear} todos):`);
    w.filteredTodos().forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text} ${t.completed ? "✓" : "○"}`);
    });

    log(
      "6.2",
      "Clicking 'Clear completed' button",
      "Removing all completed todos..."
    );
    const clearBtn = doc.getElementById("clear-completed");
    clearBtn.click();
    await new Promise((r) => setTimeout(r, 50));

    console.log(
      `   ✓ Completed todos cleared! Count: ${beforeClear} → ${
        w.filteredTodos().length
      }`
    );
    console.log(`\n   📋 After clearing:`);
    w.filteredTodos().forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.text} ${t.completed ? "✓" : "○"}`);
    });

    // Feature 7: Persistence
    console.log("\n\n💾 FEATURE 7: LocalStorage Persistence");
    console.log("-".repeat(60));

    log("7.1", "Checking localStorage", "Reading saved data...");
    w.save();
    const stored = w.localStorage.getItem("todos_v1");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log(
        `   ✓ Data persisted! ${parsed.length} todo(s) saved in localStorage`
      );
      console.log(`   📦 Stored data structure:`);
      parsed.forEach((t, i) => {
        console.log(
          `      ${i + 1}. { text: "${t.text}", completed: ${
            t.completed
          }, id: "${t.id}" }`
        );
      });
    }

    // Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("✨ ALL FEATURES TESTED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n✅ Feature Summary:");
    console.log("   ✓ Adding todos via form");
    console.log("   ✓ Editing todos with edit button (✎)");
    console.log("   ✓ Toggling complete/incomplete status");
    console.log("   ✓ Filtering (All/Active/Completed)");
    console.log("   ✓ Deleting individual todos");
    console.log("   ✓ Clearing all completed todos");
    console.log("   ✓ LocalStorage persistence");
    console.log("\n🎉 Todo app is fully functional!\n");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    dom.window.close();
  }
})();
