let currentUser = null;
let tables = [];
let tableIdCounter = 0;
let taskIdCounter = 0;

const dbName = 'usersdb';
let db;

const abrirBaseDatos = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains("users")) {
                const userStore = db.createObjectStore("users", { keyPath: 'username' });
                userStore.createIndex('tables', 'tables', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject('Error al abrir la base de datos: ' + event.target.error);
        };
    });
};


const agregarUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const user = { username, password, tables: [] };

        const request = objectStore.add(user);
        request.onsuccess = () => {
            resolve('Nuevo usuario añadido');
            localStorage.setItem('username', username);
            currentUser = username;
            closeForm();
        };

        request.onerror = (event) => {
            reject('Error al agregar usuario: ' + event.target.error);
        };
    });
};


const cargarTablasUsuario = (username) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.get(username);

        request.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                resolve(user.tables);
            } else {
                reject('Usuario no encontrado');
            }
        };

        request.onerror = (event) => {
            reject('Error al cargar las tablas: ' + event.target.error);
        };
    });
};



const iniciarSesion = (username, password) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.get(username);

        request.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                if (user.password === password) {
                    localStorage.setItem('username', username);
                    resolve('Inicio de sesión exitoso');
                    closeForm();
                } else {
                    reject('Contraseña incorrecta');
                }
            } else {
                reject('Usuario no registrado');
            }
        };

        request.onerror = (event) => {
            reject('Error al verificar usuario: ' + event.target.error);
        };
    });
};


document.getElementById("login").addEventListener("click", function() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("psw").value.trim();

    if (username && password) {
        abrirBaseDatos().then(() => {
            iniciarSesion(username, password)
                .then(() => {
                    alert('Benvolgut de nou '+ username);
                    currentUser = username;
                    cargarTablasUsuario(username)
                        .then(userTables => {
                            tables = userTables;
                            renderTables();
                        })
                        .catch(error => {
                            console.error(error);
                            alert(error);
                        });
                })
                .catch((error) => {
                    if (error === 'Usuario no registrado') {
                        if (confirm('Usuario no registrado. ¿Quieres crear una nueva cuenta?')) {
                            agregarUser(username, password)
                                .then((mensaje) => {
                                    alert(mensaje);
                                })
                                .catch((error) => {
                                    alert(error);
                                });
                        }
                    } else {
                        alert(error);
                    }
                });
        }).catch(error => {
            console.error(error);
            alert(error);
        });
    } else {
        alert('Por favor, introduce un nombre de usuario y contraseña válidos.');
    }
});



function renderTables() {
    const tableContainer = document.getElementById("table");
    tableContainer.innerHTML = ''; 

    tables.forEach(tableA => {

        const index = tableA.id;
 
        let dove = document.createElement("div");
        dove.setAttribute("id", `div-${index}`);
        dove.classList.add("col-md-4", "border", "p-3", "mb-4", "rounded");
        dove.innerHTML = `
            <h3>${tableA.name}</h3>

            <div class="input-group mb-3">
                <input type="text" class="form-control tascaB" placeholder="Tarea" id="nameB-${index}">
                <button type="button" class="btn btn-success" onclick="createTask(${index})">Crear tarea</button>
                <button type="button" class="btn btn-danger" onclick="eliminateTable(${index})">Eliminar</button>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Tareas</th>
                        <th scope="col">Acciones</th>
                    </tr>
                </thead>
                <tbody id="taskA-${index}">
                </tbody>
            </table>
        `;

        tableContainer.appendChild(dove);

        tableA.tasks.forEach(taskB => {
            renderTask(index, taskB);
        });
    });
}


function openForm() {
    document.getElementById("myForm").style.display = "block";
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
}


const actualizarTablasUsuario = (username, tables) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.get(username);

        request.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                user.tables = tables;
                const updateRequest = objectStore.put(user);
                updateRequest.onsuccess = () => {
                    resolve('Tablas actualizadas correctamente');
                };
                updateRequest.onerror = (event) => {
                    reject('Error al actualizar las tablas: ' + event.target.error);
                };
            } else {
                reject('Usuario no encontrado');
            }
        };

        request.onerror = (event) => {
            reject('Error al obtener el usuario: ' + event.target.error);
        };
    });
};



function createTable() {
    if (!currentUser) {
        alert('Por favor, inicia sesión primero.');
        return;
    }


    let maxId = 0;

    if (tables.length > 0) {
        tables.forEach((table) => {
            if (table.id > maxId) {
                maxId = table.id;
            }
        });
        tableIdCounter=maxId+1;
    }


    const nametable = document.getElementById("nameA").value.trim();
    
    if (nametable) {
        let tableA = {
            id: tableIdCounter++,
            name: nametable,
            tasks: []
        };

        tables.push(tableA);

        actualizarTablasUsuario(currentUser, tables)
            .then(() => {
                console.log('Tabla creada y guardada en IndexedDB');
                renderTables();
                document.getElementById("nameA").value = '';
            })
            .catch((error) => {
                console.error(error);
                alert(error);
            });
    } else {
        alert("Introduce un nombre válido para la tabla");
    }
}


function createTask(tableId) {
    if (!currentUser) {
        alert('Por favor, inicia sesión primero.');
        return;
    }

    taskIdCounter=0;
    let maxId = 0;

    const tableA = tables.find(t => t.id === tableId);

    if (tableA.tasks.length > 0) {
        tableA.tasks.forEach((task) => {
            if (task.id > maxId) {
                maxId = task.id;
            }
        });
        taskIdCounter=maxId+1;
    }

    console.log(maxId);
    console.log(taskIdCounter);

    const nametask = document.getElementById(`nameB-${tableId}`).value.trim();

    if (nametask && tableA) {
        let taskB = {
            id: taskIdCounter++,
            name: nametask,
            description: ''
        };

        tableA.tasks.push(taskB);

        actualizarTablasUsuario(currentUser, tables)
            .then(() => {
                console.log('Tarea creada y guardada en IndexedDB');
                renderTask(tableId, taskB);
                document.getElementById(`nameB-${tableId}`).value = '';
            })
            .catch((error) => {
                console.error(error);
                alert(error);
            });
    } else {
        alert("Introduce un nombre válido para la tarea");
    }
}


function renderTask(tableId, taskB) {
    const taskContainer = document.getElementById(`taskA-${tableId}`);
    let dit = document.createElement("tr");
    dit.setAttribute("id", `td-${tableId}-${taskB.id}`);
    dit.innerHTML = `
        <td>${taskB.name}</td>
        <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="createEliminate(${tableId}, ${taskB.id})">Eliminar</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="openModal(${tableId}, ${taskB.id})">Editar</button>
        </td>
    `;
    taskContainer.appendChild(dit);
}



function createEliminate(tableId, taskId) {
    if (!currentUser) {
        alert('Por favor, inicia sesión primero.');
        return;
    }

    const tableA = tables.find(t => t.id === tableId);
    if (tableA) {
        const taskElement = document.getElementById(`td-${tableId}-${taskId}`);

        if (taskElement) {
            if (confirm("¿Estás seguro de eliminar esta tarea?")) {
                taskElement.remove();
                tableA.tasks = tableA.tasks.filter(t => t.id !== taskId);
                actualizarTablasUsuario(currentUser, tables)
                    .then(() => {
                        console.log("Tarea eliminada correctamente");
                    })
                    .catch((error) => {
                        console.error(error);
                        alert(error);
                    });
            }
        }
    }
}



function eliminateTable(tableId) {
    if (!currentUser) {
        alert('Por favor, inicia sesión primero.');
        return;
    }

    const tableElement = document.getElementById(`div-${tableId}`);

    if (tableElement) {
        if (confirm("¿Estás seguro de eliminar esta tabla?")) {
            tableElement.remove();
            tables = tables.filter(t => t.id !== tableId);
            actualizarTablasUsuario(currentUser, tables)
                .then(() => {
                    console.log("Tabla eliminada correctamente");
                })
                .catch((error) => {
                    console.error(error);
                    alert(error);
                });
        }
    }
}

// Variables para la edición de tareas
let editingTableId = null;
let editingTaskId = null;

// Función para abrir el modal de edición de tareas
function openModal(tableId, taskId) {
    const tableA = tables.find(t => t.id === tableId);
    const taskB = tableA ? tableA.tasks.find(c => c.id === taskId) : null;

    if (tableA && taskB) {
        editingTableId = tableId;
        editingTaskId = taskId;

        document.getElementById("taskaZ").value = taskB.name;
        document.getElementById("descripcióA").value = taskB.description;

        var myModal = new bootstrap.Modal(document.getElementById('myModal'));
        myModal.show();
    }
}

// Función para guardar los cambios de una tarea desde el modal
function saveTaskChanges() {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Por favor, inicia sesión primero.');
        return;
    }

    if (editingTableId === null || editingTaskId === null) {
        alert('No se ha seleccionado una tarea para editar.');
        return;
    }

    const taskName = document.getElementById("taskaZ").value.trim();
    const taskDescription = document.getElementById("descripcióA").value.trim();

    if (!taskName) {
        alert('El nombre de la tarea no puede estar vacío.');
        return;
    }

    const tableA = tables.find(t => t.id === editingTableId);
    const taskB = tableA ? tableA.tasks.find(c => c.id === editingTaskId) : null;

    if (tableA && taskB) {
        taskB.name = taskName;
        taskB.description = taskDescription;

        actualizarTablasUsuario(username, tables)
            .then(() => {
                console.log("Tarea modificada correctamente");
                renderTables(); // Actualizar la interfaz
                // Cerrar el modal
                var myModal = bootstrap.Modal.getInstance(document.getElementById('myModal'));
                myModal.hide();
            })
            .catch((error) => {
                console.error(error);
                alert(error);
            });
    }
}

// Función para cerrar el modal manualmente (si se necesita)
function closeModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('myModal'));
    myModal.hide();
}

// Opcional: Función para cerrar sesión
function logout() {
    localStorage.removeItem('username');
    currentUser = null;
    tables = [];
    renderTables();
    alert('Has cerrado sesión.');
}

// Opcional: Añadir un botón de logout en el header
// Puedes añadir el siguiente código en el HTML dentro del header
/*
<button class="btn btn-outline-light btn-lg ms-2" type="button" onclick="logout()">Cerrar sesión</button>
*/

