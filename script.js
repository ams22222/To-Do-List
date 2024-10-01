let table = [];

function createTable() {
    const nametable = document.getElementById("nameA").value;
    if (nametable) {
        let tableA = {
            name: nametable,
            task: {}
        };
    }
    else {
        alert("Intrudueix un nombre valid per la taula");
    }
}