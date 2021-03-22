
let db
const request = window.indexedDB.open("transactionList", 1)
request.onerror = e => console.log(e.target.errorCode)

request.onupgradeneeded = e => {
    const db = e.target.result
    db.createObjectStore("transactions", { keypath: "id", autoIncrement: true })
}

request.onsuccess = e => {
    db = e.target.result
    console.log(`Successfully opened ${db.name}`)
    if (navigator.onLine) {
        downLoadDb()
    }
}

const saveRecord = (transaction) => {
    console.log("save:", transaction)
    const indexTransaction = db.transaction(["transactions"], "readwrite")
    const store = indexTransaction.objectStore("transactions")
    console.log("record:", transaction.name, transaction.value, transaction.date)
    console.log(store)
    const addStore = store.put(
        {
            name: transaction.name,
            value: transaction.value,
            date: transaction.date
        }
    )
    addStore.onsuccess = e => {
        console.log(addStore.result)
        console.log(navigator.onLine)
    }
}
const getRecords = () => {
    const indexTransaction = db.transaction(["transactions"], "readonly")
    const store = indexTransaction.objectStore("transactions")
    const getAllRequest =
        store.getAll()
    getAllRequest.onsuccess = (e) => {
        transactions = getAllRequest.result
        populateTotal()
        populateTable()
        populateChart()
    }
}

const addRecords = transactions => {
    const indexTransaction = db.transaction(["transactions"], "readwrite")
    const store = indexTransaction.objectStore("transactions")
    transactions.forEach(transaction => {
        console.log("record:", transaction)
        console.log(db)
        store.put(
            {
                id: transaction._id,
                name: transaction.name,
                value: transaction.value,
                date: transaction.date
            }
        )
        console.log("stored:", transaction)
    }
    )
}
function downLoadDb() {
    const indexTransaction = db.transaction(["transactions"], "readwrite")
    const store = indexTransaction.objectStore("transactions")
    const storedDB = store.getAll()
    storedDB.onsuccess = e => {
        if (storedDB.result.length > 0) {
            console.log(navigator.onLine)
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(storedDB.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response => response.json())
              .then(() => {
                const transaction = db.transaction(["transactions"], "readwrite");
                const store = transaction.objectStore("transactions");
                store.clear();
              })
              .catch(err => {
                  if (err) throw err
                });
        }
    }
}

