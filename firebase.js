import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, get, update, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFRrfv9YrfAYQ_sKSai6ILbEKDNlPa-Lc",
    authDomain: "salonwik-f0617.firebaseapp.com",
    projectId: "salonwik-f0617",
    storageBucket: "salonwik-f0617.appspot.com",
    messagingSenderId: "803323167072",
    appId: "1:803323167072:web:a4c16d4b98741c492b5e05",
    measurementId: "G-H0WKBC70PR",
    databaseURL: "https://salonwik-f0617-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Enable offline persistence
enableIndexedDbPersistence(database).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Offline persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable offline persistence.');
    }
});

export { database, ref, set, onValue, push, get, update, remove };