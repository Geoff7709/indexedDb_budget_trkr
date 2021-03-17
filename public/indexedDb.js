function indexedDB() {
    document.addEventListener("DOMContentLoaded", (e) => {
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
        }
    })
}


