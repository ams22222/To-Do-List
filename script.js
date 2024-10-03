let table = [];

function createTable() {
    const nametable = document.getElementById("nameA").value.trim();
    if (nametable) {
        let tableA = {
            name: nametable,
            task: []
        };
        
        table.push(tableA);
        let dove = document.createElement("div");
        dove.setAttribute("id", `div-${table.length-1}`);
        dove.classList.add("col-md-4");
        dove.classList.add("border");
        dove.innerHTML = 
            `<h3>${nametable}</h3>
            
            <div class="input-group mb-3">

                <input type="text" class="form-control tascaB" placeholder="Tasca" id="nameB-${table.length-1}">

                <button type="button" class="btn btn-success"
                onclick="createTask(${table.length-1})">Crear tasca
                </button>

                <button type="button" class="btn btn-danger" 
                onclick="eliminateTable(${table.length-1})">Eliminar
                </button>
    
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Tasques</th>
                        <th scope="col">Accions</th>
                    </tr>
                </thead>
                <tbody id="taskA-${table.length-1}">
                    
                </tbody>
            </table>`

        
        document.getElementById("table").appendChild(dove);

    }

    else {
        alert("Intrudueix un nombre valid per la taula");
    }
}

function createTask(tp) {
    const nametask = document.getElementById(`nameB-${tp}`).value.trim();
    if (nametask) {
        let taskB = {
            name: nametask
        };

    table[tp].task.push(taskB);
    let dit = document.createElement("tr");
        dit.setAttribute("id", `td-${tp}-${table[tp].task.length-1}`);

    dit.innerHTML = 
        `<td>${nametask}</td>
        
        <td>

            <button type="button" class="btn btn-danger" 
            onclick="createEliminate(${tp},${table[tp].task.length-1})">Eliminar
            </button>
        
        </td>`

        document.getElementById(`taskA-${tp}`).appendChild(dit);

    }

    else {
        alert("Intrudueix un nombre valid per la tasca");
    }
}

function createEliminate(tp,tb) {

    if (table[tp] && table[tp].task) {
        const sda = document.getElementById(`td-${tp}-${tb}`);
        if(sda){
            table[tp].task.splice(tb, 1);
            sda.remove();
        }
    }
    else {
        console.error("No s'ha trobat la tasca o taula seleccionada");
    }
}

function eliminateTable(tp) {

    const ada = document.getElementById(`div-${tp}`)
    if(ada){
        table.splice(tp, 1);
        ada.remove();
    }

}