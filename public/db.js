//file provided by instructor 
// and some of the Comments are by me so that I could understand it better. 

//declaring our db variable
let db;

// create a new db request for a "budget" database. When we call the open method
// on indexedDB this return a request object and on this request object
// we have access to success or error value that we can handle as an event. 
const request = indexedDB.open("budget", 1);

// when we create a new database or upgrade the version of an existing database
// the onupgradeneeded method on the request object will automatically get 
// called and on this event we create an objectStores we need. In this case
//we create an object store called pending when we create our database. 
request.onupgradeneeded = function(event) {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// if everything succeeds then the following function is called. Upon
// success it checks to see if the app is online. If it is online then 
// the checkDatabase function will be called. The checkDatabase function
// gets all the data from our indexedDB that we created and then it sends 
// that data back to our datbase to get stored. 
request.onsuccess = function(event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// The saveRecord function will get called if the post to our 
// database fails (which would occur if we were in offline mode).
// It writes the files that we were originally going to send
// to our database to IndexedDB. 
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access. Anytime
  // we want to read/write anything in our indexedDB we have to do through
  // a transaction object. Our Database can have several transaction associated
  // with it at a time and the scope of the transaction is determined by
  // the objectStore that its acting on. 
  const transaction = db.transaction(["pending"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to your store with add method.
  store.add(record);
}

//As mentioned above this get called when the datbase is bought back online
// or when our page first loads as well. 
//It will get all the data stored in the indexedDB and then send that over 
//to our database. Upon successful addition to the database we get back
//the json and then we clear out the indexedDB because we do need
//the data thats stored in there anymore.

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["pending"], "readwrite");

        // access your pending object store
        const store = transaction.objectStore("pending");

        // clear all items in your store
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
