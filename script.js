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

            crearTablasPredeterminadas();

            document.getElementById("is").style.display = 'none';
            document.getElementById("logoutButton").innerText = username;
            document.getElementById("logoutButton").style.display = 'inline-block';

            closeForm();
        };

        request.onerror = (event) => {
            reject('Error al agregar usuario: ' + event.target.error);
        };
    });
};


function crearTablasPredeterminadas() {
    if(tables.length===0){
        const defaultTables = ["Pendents", "En producció", "Acabades"];

        defaultTables.forEach((tableName) => {
            document.getElementById("nameA").value = tableName;
            createTable();
        });
    
        document.getElementById("nameA").value = '';  
        renderTables();
    }
}


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

                    document.getElementById("is").style.display = 'none';
                    document.getElementById("logoutButton").innerText = username;
                    document.getElementById("logoutButton").style.display = 'inline-block';

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


function logout() {
    currentUser = null;
    localStorage.removeItem('username');
    document.getElementById("is").style.display = 'inline-block';
    document.getElementById("logoutButton").style.display = 'none';

   
    const tableContainer = document.getElementById("table");
    tableContainer.innerHTML = ''; 

    tables=[];
    closelogoutForm();
    alert('Has cerrado sesión.');
}


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




function renderTask(tableId, taskB) {
    const taskContainer = document.getElementById(`taskA-${tableId}`);
    let dit = document.createElement("tr");
    dit.setAttribute("id", `td-${tableId}-${taskB.id}`);
    dit.innerHTML = `
        <td>${taskB.name}</td>
        <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="createEliminate(${tableId}, ${taskB.id})">Eliminar</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="modal(${tableId}, ${taskB.id})">Editar</button>
        </td>
    `;
    taskContainer.appendChild(dit);
}




function openForm() {
    document.getElementById("myForm").style.display = "block";
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
}


function logoutForm() {
    document.getElementById("lgout").style.display = "block";
}

function closelogoutForm() {
    document.getElementById("lgout").style.display = "none";
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
let table = [];
let tableIdCounter = 0;
let taskIdCounter = 0;
let sessi_on = 0;
comença();
// document.getElementById("nameA").innerText
function comença(){
    if(sessi_on == 0){
        let nameList = document.getElementById("nameA").value;
        document.getElementById("nameA").value = nameList + "Pendents";
        createTable();
        document.getElementById("nameA").value = nameList + "En producció";
        createTable();
        document.getElementById("nameA").value = nameList + "Acabades";
        createTable();
        document.getElementById("nameA").value = nameList + "";
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
            name: nametask
        };
        tableA.task.push(taskB);

        let dit = document.createElement("tr");
        dit.setAttribute("id", `td-${tableId}-${taskB.id}`);
        dit.innerHTML = `
            <td>${nametask}</td>
            <td>
                <button type="button" class="btn btn-danger" onclick="createEliminate(${tableId}, ${taskB.id})">Eliminar</button>
                <button type="button" class="btn btn-primary" onclick="modal(${tableId}, ${taskB.id})">Editar</button>
            
            </td>`;

        document.getElementById(`taskA-${tableId}`).appendChild(dit);
    } else {
        alert("Introduce un nombre válido para la tarea");
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
                tableA.task = tableA.task.filter(t => t.id !== taskId);
            }
        }
    }
}

function eliminateTable(tableId) {
    const tableElement = document.getElementById(`div-${tableId}`);
    if (tableElement) {
        if (confirm("Estàs segur que desitges eliminar aquesta taula?")) {
            tableElement.remove();
            table = table.filter(t => t.id !== tableId);
        }
    }
}

function modal(tableId, taskId) {
    console.log(`nameB-${tableId}  td-${tableId}-${taskId}`);
    const id = taskId;
    const tableB = table.find(t => t.id === tableId);
    const task = tableB.task.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found!');
        return;
    }

    const taskName = task.name || 'Task Name Not Found';
    const descName = task.descripcio || 'Description Not Found';
    let dove = document.createElement("div");
    dove.classList.add("modal");
    dove.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <input class="modal-title" value="${taskName}"></input>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input value="${descName}"></input>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dove);

    var myModal = new bootstrap.Modal(dove);
    myModal.show();
}