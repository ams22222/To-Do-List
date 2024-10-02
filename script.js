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
        dove.classList.add("col-md-4");
        dove.innerHTML = 
            `<h3>${nametable}</h3>
            
            <div  class="input-group mb-3">

                <input type="text" class="form-control tascaB" placeholder="Tasca" id="nameB-${table.length-1}">

                <button type="button" class="btn btn-success"
                onclick="createTask(${table.length-1})">Crear tasca
                </button>
    
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Tasques</th>
                        <th scope="col">Accions</th>
                    </tr>
                </thead>
                <tbody class="taskA">
                    
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
            task: nametask
        };

    table[tp].task.push(taskB);
    let dit = document.createElement("tr");

    dit.innerHTML = 
        `<td>${nametask}</td>`

    document.getElementById("table").appendChild(dit);
    }

    else {
        alert("Intrudueix un nombre valid per la tasca");
    }
}