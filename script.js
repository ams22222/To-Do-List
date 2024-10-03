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
}   

function createTable() {
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
            </table>`;

        document.getElementById("table").appendChild(dove);
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


function modal(tableId, taskId){
    const tableA = table.find(t => t.id === tableId);
    const taskElement = document.getElementById(`td-${tableId}-${taskId}`);
    let dove = document.createElement("div");
    dove.classList.add("modal");
    dove.innerHTML =`
        <div class="modal" tabindex="-1"></div>
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">tasca</h4>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Modal body text gos here</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primari">Saves changes</button>
                    </div>
                </div>
            </div>
        </div>`
}