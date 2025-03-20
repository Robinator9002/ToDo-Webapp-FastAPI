document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    const loggedInSection = document.getElementById("logged-in-section");

    // Login Inputs
    const loginUsername = document.getElementById("login-username");
    const loginPassword = document.getElementById("login-password");
    const loginBtn = document.getElementById("login-btn");

    // Register Inputs
    const registerUsername = document.getElementById("register-username");
    const registerEmail = document.getElementById("register-email");
    const registerPassword = document.getElementById("register-password");
    const registerBtn = document.getElementById("register-btn");

    // Navigation Buttons
    const showRegisterBtn = document.getElementById("show-register-btn");
    const showLoginBtn = document.getElementById("show-login-btn");

    // Logout & Delete
    const logoutBtn = document.getElementById("logout-btn");
    const deleteBtn = document.getElementById("delete-btn");

    // ToDo-Controls
    const checkAllTodosBtn = document.getElementById("checkAll")
    const removeCheckedTodosBtn = document.getElementById("removeChecked")

    // ToDo-Elemente
    const todoList = document.getElementById("todo-list");
    const todoTitleInput = document.getElementById("todo-title");
    const todoDescriptionInput = document.getElementById("todo-description");
    const addTodoBtn = document.getElementById("add-todo-btn");

    // ToDo-Details
    const todoDetails = document.getElementById("todo-details");
    const detailTitle = document.getElementById("detail-title");
    const detailDescription = document.getElementById("detail-description");

    let currentUser = null; // Aktueller Benutzer

    // Wechsel zwischen Login und Registrierung
    showRegisterBtn.addEventListener("click", () => {
        loginSection.style.display = "none";
        registerSection.style.display = "block";
    });

    showLoginBtn.addEventListener("click", () => {
        registerSection.style.display = "none";
        loginSection.style.display = "block";
    });

    // Funktion für Login
    loginBtn.addEventListener("click", async () => {
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (username) {
            currentUser = username;
            loadTodos(username);
        }

        if (!username || !password) {
            showError("Bitte alle Felder ausfüllen!", loginSection, [loginUsername, loginPassword]);
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError("Login fehlgeschlagen: " + errorData.detail, loginSection, [loginUsername, loginPassword]);
                return;
            }

            // Erfolg: Login anzeigen
            loginSection.style.display = "none";
            loggedInSection.style.display = "block";
        } catch (error) {
            showError("Serverfehler!", loginSection);
        }
    });

    // Funktion für Registrierung
    registerBtn.addEventListener("click", async () => {
        const username = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();

        if (!username || !email || !password) {
            showError("Bitte alle Felder ausfüllen!", registerSection, [registerUsername, registerEmail, registerPassword]);
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/users/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError("Registrierung fehlgeschlagen: " + errorData.detail, registerSection, [registerUsername, registerEmail, registerPassword]);
                return;
            }

            showSuccess("Account erstellt! Du kannst dich nun einloggen.", registerSection, [registerUsername, registerEmail, registerPassword]);
            setTimeout(() => {
                registerSection.style.display = "none";
                loginSection.style.display = "block";
            }, 2000);

        } catch (error) {
            showError("Serverfehler!", registerSection);
        }
    });

    // Funktion für Logout
    logoutBtn.addEventListener("click", () => {
        loginSection.style.display = "block";
        loggedInSection.style.display = "none";
        loginUsername.value = "";
        loginPassword.value = "";
    });

    // Funktion für Account löschen
    deleteBtn.addEventListener("click", async () => {
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            showError("Bitte zuerst einloggen!", loggedInSection);
            return;
        }

        if (!confirm("Bist du sicher, dass du deinen Account löschen möchtest?")) {
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/users/", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError("Löschen fehlgeschlagen: " + errorData.detail, loggedInSection);
                return;
            }

            showSuccess("Account wurde gelöscht.", loggedInSection);
            setTimeout(() => logoutBtn.click(), 1000);
        } catch (error) {
            showError("Serverfehler!", loggedInSection);
        }
    });

    // 🔹 Neues ToDo hinzufügen
    addTodoBtn.addEventListener("click", async () => {
        const title = todoTitleInput.value.trim();
        const description = todoDescriptionInput.value.trim();

        if (todoList.children.length >= 15) {
            showError("Du kannst maximal 15 ToDos haben!", loggedInSection, [todoTitleInput, todoDescriptionInput]);
            return;
        }

        if (!title) {
            showError("ToDo benötigt einen Namen!", loggedInSection, [todoTitleInput]);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${currentUser}/todos/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (!response.ok) throw new Error("Fehler beim Hinzufügen des ToDos.");

            loadTodos(currentUser);
            todoTitleInput.value = "";
            todoDescriptionInput.value = "";
        } catch (error) {
            console.error("Fehler beim Hinzufügen:", error);
        }
    });

    checkAllTodosBtn.addEventListener("click", async () => {
        let allChecked = true
        document.querySelectorAll(".todo-item input[type='checkbox']").forEach(checkbox => {
            allChecked = checkbox.checked;
        });
        document.querySelectorAll(".todo-item input[type='checkbox']").forEach(checkbox => {
            if (allChecked) {
                checkbox.checked = false;
                const title = checkbox.nextElementSibling;
                title.style.textDecoration = "none";
                title.style.color = "#333";
                updateTodoStatus(title.textContent, false); // Backend-Update
            }
            else {
                checkbox.checked = true;
                const title = checkbox.nextElementSibling;
                title.style.textDecoration = "line-through";
                title.style.color = "#888";
                updateTodoStatus(title.textContent, true); // Backend-Update
            }
        });
    });

    removeCheckedTodosBtn.addEventListener("click", async () => {
        const checkedCheckboxes = Array.from(document.querySelectorAll(".todo-item input[type='checkbox']:checked")); // Statisches Array erstellen
    
        for (const checkbox of checkedCheckboxes) {
            const li = checkbox.parentElement;
            const title = checkbox.nextElementSibling.textContent;
            await deleteTodo(title);
            li.remove(); // Jetzt wird nichts mehr übersprungen! 🎉
        }
    });
    
    // Hilfsfunktionen für visuelles Feedback
    function showSuccess(message, section, inputFields = []) {
        // Fehler-Text anzeigen
        const successDiv = document.createElement("div");
        successDiv.textContent = message;
        successDiv.style.color = "green";
        successDiv.style.marginTop = "10px";
        section.appendChild(successDiv);

        // Markiere fehlerhafte Felder
        inputFields.forEach(input => {
            input.classList.add("input-success");

            // Entferne Fehler-Hervorhebung, wenn User tippt
            input.addEventListener("input", () => {
                input.classList.remove("input-success");
            });
        });

        // Fehler nach 3 Sekunden ausblenden
        setTimeout(() => successDiv.remove(), 3000);
    }

    // Hilfsfunktionen für visuelles Feedback
    function showError(message, section, inputFields = []) {
        // Fehler-Text anzeigen
        const errorDiv = document.createElement("div");
        errorDiv.textContent = message;
        errorDiv.style.color = "red";
        errorDiv.style.marginTop = "10px";
        section.appendChild(errorDiv);

        // Markiere fehlerhafte Felder
        inputFields.forEach(input => {
            input.classList.add("input-error");

            // Entferne Fehler-Hervorhebung, wenn User tippt
            input.addEventListener("input", () => {
                input.classList.remove("input-error");
            });
        });

        // Fehler nach 3 Sekunden ausblenden
        setTimeout(() => errorDiv.remove(), 3000);
    }

    function loadTodos(username) {
        if (!username) {
            console.error("❌ Fehler: Username ist null oder undefined!");
            return;
        }

        fetch(`http://127.0.0.1:8000/users/${username}/todos/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Fehler beim Abrufen der ToDos");
                }
                return response.json();
            })
            .then(todos => {
                renderTodos(todos);
            })
            .catch(error => console.error("Fehler:", error));
    }

    // 🔹 ToDo löschen
    async function deleteTodo(title) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${currentUser}/todos?todo_title=${title}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Fehler beim Löschen des ToDos.");

            loadTodos(currentUser);
            hideDetails();
        } catch (error) {
            console.error("Fehler beim Löschen:", error);
        }
    }

    // 🔹 ToDos in die Liste rendern
    function renderTodos(todos) {
        todoList.innerHTML = ""; // Liste leeren

        Object.entries(todos).forEach(([title, data]) => {
            const li = document.createElement("li");
            li.classList.add("todo-item");

            // ✅ Checkbox für "Erledigt"
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = data.done;
            checkbox.addEventListener("change", () => updateTodoStatus(title, checkbox.checked));

            // 📌 Titel
            const titleSpan = document.createElement("span");
            titleSpan.textContent = title;

            // 📝 Hovern -> Details anzeigen
            titleSpan.addEventListener("mouseenter", () => showDetails(title, data.description));
            titleSpan.addEventListener("mouseleave", () => hideDetails());

            // ❌ Löschen-Button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "❌";
            deleteBtn.classList.add("danger-btn");
            deleteBtn.addEventListener("click", () => deleteTodo(title));

            // 🔗 Elemente zusammenfügen
            li.appendChild(checkbox);
            li.appendChild(titleSpan);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    }

    async function updateTodoStatus(title, isDone) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${currentUser}/todos/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, done: isDone }),
            });

            if (!response.ok) throw new Error("Fehler beim Aktualisieren des ToDos.");

            console.log(`ToDo '${title}' auf ${isDone ? "erledigt" : "offen"} gesetzt.`);
        } catch (error) {
            console.error("Fehler beim Aktualisieren:", error);
        }
    }

    // 🔹 ToDo-Beschreibung anzeigen
    function showDetails(title, description) {
        detailTitle.textContent = title;
        detailDescription.textContent = description;
        todoDetails.style.display = "block";
    }

    // 🔹 ToDo-Beschreibung verstecken
    function hideDetails() {
        todoDetails.style.display = "none";
    }
});
