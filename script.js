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
            closeForm();
        };

        request.onerror = (event) => {
            reject('Error al agregar usuario: ' + event.target.error);
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
            .then((mensaje) => {
                alert(mensaje);
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
        });
    } else {
        alert('Por favor, introduce un nombre de usuario y contraseña válidos.');
    }
});


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



let table = [];
let tableIdCounter = 0;
let taskIdCounter = 0;

function createTable() {
    const username = localStorage.getItem('username');
    const nametable = document.getElementById("nameA").value.trim();
    if (nametable) {    
        let tableA = {
            id: taskIdCounter++,
            name: nametable,
            task: []
        };
        
        table.push(tableA);
        const index = tableA.id;

        let dove = document.createElement("div");
        dove.setAttribute("id", `div-${index}`);
        dove.classList.add("col-md-4", "border");
        dove.innerHTML = `
            <h3>${nametable}</h3>

            <div class="input-group mb-3">

                <input type="text" class="form-control tascaB" placeholder="Tasca" id="nameB-${index}">
                <button type="button" class="btn btn-success" onclick="createTask(${index})">Crear tasca
                </button>
                <button type="button" class="btn btn-danger" onclick="eliminateTable(${index})">Eliminar
                </button>
            
            </div>

            <table class="table">

                <thead>

                    <tr>
                    
                        <th scope="col">Tasques</th>
                        <th scope="col">Accions</th>

                    </tr>

                </thead>

                <tbody id="taskA-${index}">

                </tbody>
                
            </table>`;

        document.getElementById("table").appendChild(dove);
        actualizarTablasUsuario(username, table);

    } else {
        alert("Intrudueix un nombre valid per la taula");
    }
}   
function createTask(tableId) {
    const nametask = document.getElementById(`nameB-${tableId}`).value.trim();
    const tableA = table.find(t => t.id === tableId);

    if (nametask && tableA) {
        let taskB = {
            id: taskIdCounter++,
            name: nametask,
            description: ''
        };
        tableA.task.push(taskB);

        let dit = document.createElement("tr");
        dit.setAttribute("id", `td-${tableId}-${taskB.id}`);
        dit.innerHTML = `
            <td>${nametask}</td>

            <td>

                <button type="button" class="btn btn-danger" onclick="createEliminate(${tableId}, ${taskB.id})">
                Eliminar</button>
                <button type="button" class="btn btn-primary" onclick="modal(${tableId}, ${taskB.id})">
                Editar</button>
            
            </td>`;

        document.getElementById(`taskA-${tableId}`).appendChild(dit);
        updateUserTables(username, tables);
    } else {
        alert("Intrudueix un nombre valid per la tasca");
    }
}

function createEliminate(tableId, taskId) {
    const tableA = table.find(t => t.id === tableId);

    if (tableA) {
        const taskElement = document.getElementById(`td-${tableId}-${taskId}`);
        if (taskElement) {
            if (confirm("Estàs segur que desitges eliminar aquesta tasca?")) {
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


function modal(tableId, taskid) {
    const tableB = table.find(t => t.id === tableId);
    const taskB = tableB.task.find(c => c.id === taskid);
    let col = taskB.description;
    let namet = taskB.name;
        if(tableB) {
            const taskElementB = document.getElementById(`td-${tableId}-${taskid}`);
                if (taskElementB) {
                    let ros = document.createElement("div");
                    ros.innerHTML =
                        `<div class="modal fade" id="myModal" tabindex="-1" aria-labelledby="myModalLabel"
                        aria-hidden="true">

                            <div class="modal-dialog">

                                <div class="modal-content">

                                    <div class="modal-header">

                                        <input type="text" class="form-control" placeholder="Nom de la tasca" 
                                        id="taskaZ" value="${namet}">

                                    </div>

                                    <div class="input-group">

                                        <textarea class="form-control" aria-label="With textarea" 
                                        placeholder="Descripció" id="descripcióA" rows="10"
                                        >${col}</textarea>
                                
                                    </div>

                                    <div class="modal-footer">

                                        <button type="button" class="btn btn-secondary" onclick="createCancer()
                                        "data-bs-dismiss="modal">Tancar</button>
                                        <button type="button" class="btn btn-primary" 
                                        onclick="createSave(${tableId}, ${taskid})">Guardar canvis</button>

                                    </div>

                                </div>

                            </div>

                        </div>`
                    
                    document.getElementById("table").appendChild(ros);
                    var myModal = new bootstrap.Modal(document.getElementById('myModal'));
                    myModal.show();
                }
        }
}

function createCancer() {
    let remo = document.getElementById("myModal");
    remo.remove()
}

function createSave(tableId, taskid) {
    const tableB = table.find(t => t.id === tableId);
    const taskB = tableB.task.find(c => c.id === taskid);
    let ram = document.getElementById("descripcióA").value;
    taskB.description = ram;
    alert("Tasca modificada correctament")
}