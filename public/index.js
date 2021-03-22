let transactions = [];
let myChart;
// let db
// let mongoTransactions = []
// console.log("mongo", mongoTransactions)
// const request = window.indexedDB.open("transactionList", 1)

// request.onerror = e => console.log(e.target.errorCode)

// request.onupgradeneeded = e => {
//   const db = e.target.result
//   db.createObjectStore("transactions",
//     {
//       keyPath: "id",
//     })
// }



// request.onsuccess = e => {
//   db = e.target.result
//   console.log(`Successfully opened ${db.name}`)
//   // getRecords()
//   addRecords(mongoTransactions)
// }

// const saveRecord = (transaction) => {
//   console.log("save:", transaction)
//   const indexTransaction = db.transaction(["transactions"], "readwrite")
//   const store = indexTransaction.objectStore("transactions")
//   console.log("record:", transaction.name, transaction.value, transaction.date)
//   console.log(store)
//   const addStore = store.put(
//     {
//       id: transaction.date,
//       name: transaction.name,
//       value: transaction.value,
//       date: transaction.date
//     }
//   )
//   addStore.onsuccess = e => {
//     console.log(addStore.result)
//   }

// }
// const getRecords = () => {

//   const indexTransaction = db.transaction(["transactions"], "readonly")
//   const store = indexTransaction.objectStore("transactions")
//   const getAllRequest =
//     store.getAll()
//   getAllRequest.onsuccess = (e) => {
//     transactions = getAllRequest.result
//     populateTotal()
//     populateTable()
//     populateChart()
//   }

// }
// const addRecords = transactions => {
//   const indexTransaction = db.transaction(["transactions"], "readwrite")
//   const store = indexTransaction.objectStore("transactions")
//   transactions.forEach(transaction => {
//     console.log("record:", transaction)
//     console.log(db)
//     store.put(
//       {
//         id: transaction._id,
//         name: transaction.name,
//         value: transaction.value,
//         date: transaction.date
//       }
//     )
//     console.log("stored:", transaction)
//   }
//   )
// }

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;
    console.log("data:", transactions)
    // transactions.forEach(transaction => {
    //   console.log(transaction)
    //   mongoTransactions.push(transaction)
    // })
    populateTotal();
    populateTable();
    populateChart();
  })
  .catch(err => {
    if (err) {
      console.log(err)
    }
    // getRecords()
  })

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);
  console.log("total:", total)
  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    console.log("tableTrans:", transaction)
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      console.log(err)
      console.log("page:", transaction)
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};
