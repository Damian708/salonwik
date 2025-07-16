import { db, doc, setDoc, getDoc, collection, getDocs, onSnapshot } from './firebase.js';

// Dane aplikacji
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDay = null;
let currentEmployee = null;
let selectedDuration = 30;
let selectedServices = [];
let currentDetailDay = null;
let currentDetailMonth = null;
let currentDetailYear = null;
let currentlyEditingAppointmentIndex = null;
let currentlyEditingAppointmentDateKey = null;

// Referencje do kolekcji Firebase
const employeesRef = collection(db, 'employees');
const clientsRef = collection(db, 'clients');

// Funkcje pomocnicze
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
}

// Inicjalizacja danych
async function initData() {
  // Sprawdź czy dane są w localStorage
  const localEmployees = localStorage.getItem('employeesData');
  const localClients = localStorage.getItem('clientsData');
  const localAppointments = localStorage.getItem('appointmentsData');

  // Jeśli nie ma danych lokalnych, spróbuj pobrać z Firebase
  if (!localEmployees || !localClients || !localAppointments) {
    await syncWithFirebase();
  } else {
    // Użyj danych lokalnych i zsynchronizuj w tle
    loadLocalData();
    syncWithFirebase();
  }

  // Nasłuchuj zmian w danych
  setupDataListeners();
}

// Ładowanie danych lokalnych
function loadLocalData() {
  employeesData = JSON.parse(localStorage.getItem('employeesData')) || [];
  appointmentsData = JSON.parse(localStorage.getItem('appointmentsData')) || {};
  clientsData = JSON.parse(localStorage.getItem('clientsData')) || [];
}

// Synchronizacja z Firebase
async function syncWithFirebase() {
  try {
    // Pobierz pracowników
    const employeesSnapshot = await getDocs(employeesRef);
    const employees = [];
    employeesSnapshot.forEach(doc => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    localStorage.setItem('employeesData', JSON.stringify(employees));
    
    // Pobierz klientów
    const clientsSnapshot = await getDocs(clientsRef);
    const clients = [];
    clientsSnapshot.forEach(doc => {
      clients.push(doc.data());
    });
    localStorage.setItem('clientsData', JSON.stringify(clients));
    
    // Pobierz wizyty dla każdego pracownika
    const appointments = {};
    for (const employee of employees) {
      const empAppointmentsRef = collection(db, `employees/${employee.id}/appointments`);
      const empAppointmentsSnapshot = await getDocs(empAppointmentsRef);
      const empAppointments = {};
      
      empAppointmentsSnapshot.forEach(doc => {
        empAppointments[doc.id] = doc.data();
      });
      
      appointments[employee.id] = empAppointments;
    }
    localStorage.setItem('appointmentsData', JSON.stringify(appointments));
    
    loadLocalData();
    console.log('Dane z Firebase zostały zsynchronizowane');
  } catch (error) {
    console.error('Błąd synchronizacji z Firebase:', error);
    // Jeśli nie ma połączenia, użyj danych lokalnych
    if (!localStorage.getItem('employeesData')) {
      localStorage.setItem('employeesData', JSON.stringify([
        { id: "1", name: "Wiktoria Wozowicz-Świniuch" },
        { id: "2", name: "Weronika Dyło" }
      ]));
    }
    if (!localStorage.getItem('appointmentsData')) {
      localStorage.setItem('appointmentsData', JSON.stringify({
        "1": {},
        "2": {}
      }));
    }
    if (!localStorage.getItem('clientsData')) {
      localStorage.setItem('clientsData', JSON.stringify([]));
    }
    loadLocalData();
  }
}

// Nasłuchiwanie zmian w danych
function setupDataListeners() {
  // Nasłuchuj zmian w pracownikach
  onSnapshot(employeesRef, (snapshot) => {
    const employees = [];
    snapshot.forEach(doc => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    localStorage.setItem('employeesData', JSON.stringify(employees));
    employeesData = employees;
    renderEmployeesList();
    renderEmployeesTable();
  });

  // Nasłuchuj zmian w klientach
  onSnapshot(clientsRef, (snapshot) => {
    const clients = [];
    snapshot.forEach(doc => {
      clients.push(doc.data());
    });
    localStorage.setItem('clientsData', JSON.stringify(clients));
    clientsData = clients;
    renderClientsList();
  });

  // Nasłuchuj zmian w wizytach dla każdego pracownika
  employeesData.forEach(employee => {
    const empAppointmentsRef = collection(db, `employees/${employee.id}/appointments`);
    onSnapshot(empAppointmentsRef, (snapshot) => {
      const appointments = {};
      snapshot.forEach(doc => {
        appointments[doc.id] = doc.data();
      });
      
      if (!appointmentsData[employee.id]) {
        appointmentsData[employee.id] = {};
      }
      
      Object.assign(appointmentsData[employee.id], appointments);
      localStorage.setItem('appointmentsData', JSON.stringify(appointmentsData));
      
      if (currentEmployee === employee.id) {
        renderCalendar();
        if (selectedDay) {
          renderDaySchedule();
          renderTimeline();
        }
      }
    });
  });
}

// Funkcje do zarządzania danymi
async function addEmployeeToFirebase(employee) {
  try {
    const employeeRef = doc(db, 'employees', employee.id.toString());
    await setDoc(employeeRef, { name: employee.name });
    return true;
  } catch (error) {
    console.error('Błąd dodawania pracownika:', error);
    return false;
  }
}

async function addClientToFirebase(client) {
  try {
    const clientRef = doc(clientsRef);
    await setDoc(clientRef, client);
    return true;
  } catch (error) {
    console.error('Błąd dodawania klienta:', error);
    return false;
  }
}

async function addAppointmentToFirebase(employeeId, dateKey, appointment) {
  try {
    const appointmentRef = doc(db, `employees/${employeeId}/appointments`, dateKey);
    await setDoc(appointmentRef, { appointments: appointment }, { merge: true });
    return true;
  } catch (error) {
    console.error('Błąd dodawania wizyty:', error);
    return false;
  }
}

// Modyfikacja istniejących funkcji (przykład dla addEmployee)
async function addEmployee() {
  const name = document.getElementById('new-employee-name').value.trim();
  if (!name) {
    alert('Podaj imię i nazwisko pracownika!');
    return;
  }

  // Generuj nowe ID
  const newId = employeesData.length > 0 ? Math.max(...employeesData.map(e => parseInt(e.id))) + 1 : 1;
  
  const employee = { id: newId.toString(), name: name };
  
  // Dodaj lokalnie
  employeesData.push(employee);
  localStorage.setItem('employeesData', JSON.stringify(employeesData));
  
  // Spróbuj dodać do Firebase
  const success = await addEmployeeToFirebase(employee);
  if (!success) {
    // Jeśli nie udało się dodać do Firebase, zapisz w kolejce do synchronizacji
    const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || { employees: [] };
    pendingSync.employees.push(employee);
    localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
  }

  document.getElementById('new-employee-name').value = '';
  renderEmployeesList();
  renderEmployeesTable();
}

// Pozostałe funkcje aplikacji pozostają bez zmian (jak w oryginalnym pliku)
// ... (tutaj wklej wszystkie pozostałe funkcje z oryginalnego skryptu)

// Inicjalizacja aplikacji
window.onload = async function() {
  await initData();
  initTimeOptions();
  
  // Sprawdź czy są oczekujące synchronizacje
  checkPendingSync();
};

// Sprawdź oczekujące synchronizacje
async function checkPendingSync() {
  const pendingSync = JSON.parse(localStorage.getItem('pendingSync'));
  if (pendingSync) {
    if (navigator.onLine) {
      // Synchronizuj pracowników
      for (const employee of pendingSync.employees || []) {
        await addEmployeeToFirebase(employee);
      }
      
      // Wyczyść kolejke synchronizacji
      localStorage.removeItem('pendingSync');
    }
  }
}

// Nasłuchuj zmian stanu połączenia
window.addEventListener('online', checkPendingSync);