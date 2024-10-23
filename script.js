const TRELLO_API_KEY = '32d223eeb92fac193b1a18f4c9ce2852';
const TRELLO_TOKEN = 'TOKEN_DE_API_AQUI';

function obtenerListasDeTablero(tableroId) {
    const url = `https://api.trello.com/1/boards/${tableroId}/lists?cards=open&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log('Listas y tarjetas del tablero:', data);

        // Convertir las listas de Trello en la estructura de tu app
        const importedTables = data.map(lista => ({
            id: tableIdCounter++, 
            name: lista.name,
            tasks: lista.cards.map(tarjeta => ({
                id: taskIdCounter++, 
                name: tarjeta.name,
                description: tarjeta.desc || ''
            }))
        }));

        // Guardar las tablas importadas en tu app
        tables = tables.concat(importedTables); 
        actualizarTablasUsuario(currentUser, tables)
            .then(() => {
                alert('Tablas importadas correctamente de Trello.');
                renderTables();  // Mostrar las tablas en tu app
            })
            .catch(error => {
                console.error('Error al actualizar las tablas:', error);
                alert(error);
            });
    })
    .catch(error => console.error('Error al obtener listas y tarjetas:', error));
}

function obtenerTablerosDeTrello() {
    const url = `https://api.trello.com/1/members/me/boards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log('Tableros en Trello:', data);

        // Llenar el selector con los tableros obtenidos
        const tableroSelector = document.getElementById('tableroSelector');
        tableroSelector.innerHTML = ''; // Limpiar el selector

        data.forEach(tablero => {
            const option = document.createElement('option');
            option.value = tablero.id;
            option.text = tablero.name;
            tableroSelector.appendChild(option);
        });

        // Mostrar el modal de selección de tablero
        const myModal = new bootstrap.Modal(document.getElementById('tableroModal'));
        myModal.show();
    })
    .catch(error => console.error('Error al obtener tableros:', error));
}



document.getElementById('importarTableroBtn').addEventListener('click', () => {
    obtenerTablerosDeTrello(); 
});

document.getElementById('exportButton').addEventListener('click', exportarTablasATrello);

function exportarTablasATrello() {
    const nombreTablero = prompt('Introduce el nombre del tablero que quieres crear en Trello:');
    
    if (nombreTablero) {
        const urlCrearTablero = `https://api.trello.com/1/boards/?name=${nombreTablero}&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

        // Crear un tablero en Trello
        fetch(urlCrearTablero, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log('Tablero creado en Trello:', data);
            const tableroId = data.id;

            // Después de crear el tablero, exportar las listas y tareas
            exportarListasATrello(tableroId);
        })
        .catch(error => console.error('Error al crear el tablero en Trello:', error));
    } else {
        alert('Nombre del tablero no puede estar vacío.');
    }
}

document.getElementById('confirmarImportarTableroBtn').addEventListener('click', () => {
    const tableroId = document.getElementById('tableroSelector').value;
    if (tableroId) {
        obtenerListasDeTablero(tableroId);  // Importar las listas y tarjetas de Trello
        const myModal = bootstrap.Modal.getInstance(document.getElementById('tableroModal'));  // Cerrar el modal
        myModal.hide();
    } else {
        alert('Por favor, selecciona un tablero.');
    }
});




function exportarListasATrello(tableroId) {
    tables.forEach(tableA => {
        const urlCrearLista = `https://api.trello.com/1/lists?name=${tableA.name}&idBoard=${tableroId}&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

        // Crear cada lista en Trello
        fetch(urlCrearLista, { method: 'POST' })
        .then(response => response.json())
        .then(lista => {
            console.log(`Lista "${lista.name}" creada en Trello:`, lista);

            // Después de crear la lista, exportar las tareas
            exportarTareasATrello(lista.id, tableA.tasks);
        })
        .catch(error => console.error(`Error al crear la lista "${tableA.name}" en Trello:`, error));
    });
}

function exportarTareasATrello(listaId, tasks) {
    tasks.forEach(task => {
        const urlCrearTarea = `https://api.trello.com/1/cards?idList=${listaId}&name=${task.name}&desc=${task.description}&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

        // Crear cada tarjeta (tarea) en Trello
        fetch(urlCrearTarea, { method: 'POST' })
        .then(response => response.json())
        .then(tarea => {
            console.log(`Tarea "${tarea.name}" creada en Trello:`, tarea);
        })
        .catch(error => console.error(`Error al crear la tarea "${task.name}" en Trello:`, error));
    });
}


document.getElementById('importButton').addEventListener('click', () => {
    obtenerTablerosDeTrello(); // Primero obtenemos los tableros disponibles en Trello para importar
    // Luego puedes llamar a obtenerListasDeTablero() con el ID del tablero seleccionado
});

document.getElementById('exportButton').addEventListener('click', exportarTablasATrello); // Exporta las tablas a Trello


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
            reject('Error a l\'obrir la base de dades: ' + event.target.error);
        };
    });
};


const bcrypt = dcodeIO.bcrypt;
const saltRounds = 10;

const agregarUser = (username, password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                reject('Error al hashear la contraseña: ' + err);
                return;
            }
            
            const transaction = db.transaction(['users'], 'readwrite');
            const objectStore = transaction.objectStore('users');
            const user = { username, password: hash, tables: [] };

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
                reject('Usuari no trobat');
            }
        };

        request.onerror = (event) => {
            reject('Error al carregar les llistes: ' + event.target.error);
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
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        reject('Error al comparar contraseñas: ' + err);
                        return;
                    }

                    if (result) {
                        localStorage.setItem('username', username);
                        document.getElementById("is").style.display = 'none';
                        document.getElementById("logoutButton").innerText = username;
                        document.getElementById("logoutButton").style.display = 'inline-block';
                        resolve('Inicio de sesión exitoso');
                        closeForm();
                    } else {
                        reject('Contraseña incorrecta');
                    }
                });
            } else {
                reject('Usuari no registrat');
            }
        };

        request.onerror = (event) => {
            reject('Error al verificar el usuario: ' + event.target.error);
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
    alert('Has tancat sessió.');
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
                    if (error === 'Usuari no registrat') {
                        if (confirm('Usuari no registrat. Vols crear una nova compte?')) {
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
        alert('Siusplau, introdueix un nom d\'usuari i contrasenya vàlids.');
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
            <h3 style="word-break: break-word;">${tableA.name}</h3>

            <div class="input-group mb-3">
                <input type="text" class="form-control tascaB" placeholder="Tasca" id="nameB-${index}">
                <button type="button" class="btn btn-success" onclick="createTask(${index})">Crear tasca</button>
                <button type="button" class="btn btn-danger" onclick="eliminateTable(${index})">Eliminar</button>
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
        <td style="word-break: break-word;">${taskB.name}</td>
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
                    resolve('Llistes actualitzades correctament');
                };
                updateRequest.onerror = (event) => {
                    reject('Error a l\'actualizar les llistes: ' + event.target.error);
                };
            } else {
                reject('Usuari no definit');
            }
        };

        request.onerror = (event) => {
            reject('Error a l\'obtenir l\'usuari: ' + event.target.error);
        };
    });
};



function createTable() {
    if (!currentUser) {
        alert('Siusplau, inicia sessió primer.');
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
                console.log('Llista creada i guardada en IndexedDB');
                renderTables();
                document.getElementById("nameA").value = '';
            })
            .catch((error) => {
                console.error(error);
                alert(error);
            });
    } else {
        alert("Introdueix un nom vàlid per a la llista");
    }
}


function createTask(tableId) {
    if (!currentUser) {
        alert('Siusplau, inicia sessió primer.');
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
                console.log('Tasca creada i guardada en IndexedDB');
                renderTask(tableId, taskB);
                document.getElementById(`nameB-${tableId}`).value = '';
            })
            .catch((error) => {
                console.error(error);
                alert(error);
            });
    } else {
        alert("Introdueix un nom vàlid per a la tasca");
    }
}



function eliminateTable(tableId) {
    if (!currentUser) {
        alert('Siusplau, inicia sessió primer.');
        return;
    }

    const tableElement = document.getElementById(`div-${tableId}`);

    if (tableElement) {
        if (confirm("Estàs segur d\'eliminar aquesta llista?")) {
            tableElement.remove();
            tables = tables.filter(t => t.id !== tableId);
            actualizarTablasUsuario(currentUser, tables)
                .then(() => {
                    console.log("Llista eliminada correctament");
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
        alert('Siusplau, inicia sessió primer.');
        return;
    }

    const tableA = tables.find(t => t.id === tableId);
    if (tableA) {
        const taskElement = document.getElementById(`td-${tableId}-${taskId}`);

        if (taskElement) {
            if (confirm("Estàs segur d\'eliminar aquesta tasca?")) {
                taskElement.remove();
                tableA.tasks = tableA.tasks.filter(t => t.id !== taskId);
                actualizarTablasUsuario(currentUser, tables)
                    .then(() => {
                        console.log("Tasca eliminada correctament");
                    })
                    .catch((error) => {
                        console.error(error);
                        alert(error);
                    });
            }
        }
    }
}



function modal(tableId, taskid) {
    const tableB = tables.find(t => t.id === tableId);
    const taskB = tableB.tasks.find(c => c.id === taskid);
    let description = taskB.description;
    let taskName = taskB.name;

    let tableOptions = tables.map(t => 
        `<option value="${t.id}" ${t.id === tableId ? 'selected' : ''}>${t.name}</option>`
    ).join('');


    if (tableB) {
        const taskElementB = document.getElementById(`td-${tableId}-${taskid}`);
        if (taskElementB) {
            let modalContent = `
                <div class="modal fade" id="myModal" tabindex="-1" aria-labelledby="myModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <input type="text" class="form-control" placeholder="Nom de la tasca" id="taskaZ" value="${taskName}">
                            </div>
                            <div class="input-group">
                                <textarea class="form-control" aria-label="With textarea" placeholder="Descripció" id="descripcióA" rows="10">${description}</textarea>
                            </div>
                            <div class="input-group mt-3">
                                <label for="tableSelect" class="form-label">Moure a llista:</label>
                                <select class="form-select" id="tableSelect">
                                    ${tableOptions}
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="createCancer()" data-bs-dismiss="modal">Tancar</button>
                                <button type="button" class="btn btn-primary" onclick="createSave(${tableId}, ${taskid})">Guardar canvis</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.getElementById("table").appendChild(document.createElement("div")).innerHTML = modalContent;

            let myModal = new bootstrap.Modal(document.getElementById('myModal'));
            myModal.show();
        }
    }
}


function createCancer() {
    const modalElement = document.getElementById('myModal');
    
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
        document.body.classList.remove('modal-open');
    });

    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
}



function createSave(tableId, taskid) {
    const tableB = tables.find(t => t.id === tableId);
    const taskB = tableB.tasks.find(c => c.id === taskid);

    let taskName = document.getElementById("taskaZ").value;
    let taskDescription = document.getElementById("descripcióA").value;
    let selectedTableId = parseInt(document.getElementById("tableSelect").value);

    taskB.name = taskName;
    taskB.description = taskDescription;

    if (selectedTableId !== tableId) {
        const newTable = tables.find(t => t.id === selectedTableId);
        if (newTable) {
            tableB.tasks = tableB.tasks.filter(t => t.id !== taskid);

            const existingTask = newTable.tasks.find(t => t.id === taskid);
            if (existingTask) {
                let maxId = 0;
                newTable.tasks.forEach(task => {
                    if (task.id > maxId) {
                        maxId = task.id;
                    }
                });

                taskB.id = maxId + 1;
            }

            newTable.tasks.push(taskB);
        }
    }

    const modalElement = document.getElementById('myModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();

    actualizarTablasUsuario(currentUser, tables)
        .then(() => {
            alert("Tasca modificada correctament");
            renderTables();
        })
        .catch((error) => {
            console.error(error);
            alert(error);
        });
}


function exportarTablas() {
    if (!currentUser) {
        alert('Siusplau, inicia sessió primer.');
        return;
    }
    
    const dataStr = JSON.stringify(tables, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tablas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('importButton').addEventListener('click', () => {
    if (!currentUser) {
        alert('Siusplau, inicia sessió primer.');
        return;
    }
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTables = JSON.parse(e.target.result);
                if (Array.isArray(importedTables)) {
                    tables = importedTables;
                    actualizarTablasUsuario(currentUser, tables)
                        .then(() => {
                            alert('Tablas importadas correctamente.');
                            renderTables();
                        })
                        .catch((error) => {
                            console.error(error);
                            alert('Error al importar las tablas: ' + error);
                        });
                } else {
                    alert('El archivo JSON no contiene una lista de tablas válida.');
                }
            } catch (error) {
                alert('Error al parsear el archivo JSON: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});