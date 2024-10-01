let table = [];

function createTable() {
    const nametable = document.getElementById("nameA").value.trim();
    if (nametable) {
        let tableA = {
            name: nametable,
            task: {}
        };
        
        table.push(tableA);
        let dove = document.createElement("div");
        dove.innerHTML = 
            `<h3>${nametable}</h3>
            
            <div  class="input-group mb-3">

                <input type="text" class="form-control" placeholder="Tasca">

                <button type="button" class="btn btn-success"
                onclick="createTask()">Crear tasca
                </button>
    
            </div>
            
            <table class="table"
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