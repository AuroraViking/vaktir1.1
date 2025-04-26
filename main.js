import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

window.onload = function() {
  setTimeout(async function() {

    const months = ["September", "October", "November", "December", "January", "February", "March", "April"];
    const daysInMonth = {
      September: 30,
      October: 31,
      November: 30,
      December: 31,
      January: 31,
      February: 29,
      March: 31,
      April: 30,
    };

    let selectedMonth = "September";
    let selectedDays = [];
    let signupsData = {};
    let viewingMyShifts = false;
    let tempComment = "";
    let isAdmin = false;

    async function showAdminLogin() {
  const loginPopup = document.createElement("div");
  loginPopup.style.position = "fixed";
  loginPopup.style.top = "50%";
  loginPopup.style.left = "50%";
  loginPopup.style.transform = "translate(-50%, -50%)";
  loginPopup.style.background = "#222";
  loginPopup.style.padding = "30px";
  loginPopup.style.border = "2px solid #00ffe1";
  loginPopup.style.borderRadius = "10px";
  loginPopup.style.zIndex = "1000";
  loginPopup.style.textAlign = "center";
  loginPopup.innerHTML = `
    <h2 style="margin-bottom: 20px;">Login</h2>
    <input id="admin-password" type="password" placeholder="Admin password" 
      style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
    <div style="display: flex; justify-content: space-around; margin-top: 20px;">
      <button id="admin-login" style="padding: 10px 20px; background: #00ffe1; color: black; border: none; border-radius: 8px; cursor: pointer;">Admin Login</button>
      <button id="guide-login" style="padding: 10px 20px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer;">Guide Login</button>
    </div>
  `;
  document.body.appendChild(loginPopup);

  document.getElementById("admin-login").onclick = () => {
    const pwd = document.getElementById("admin-password").value.trim();
    if (pwd === "aurora123") {
      isAdmin = true;
      alert("Admin mode enabled!");
    }
    loginPopup.remove();
    initApp();
  };

  document.getElementById("guide-login").onclick = () => {
    loginPopup.remove();
    initApp();
  };
}


    async function fetchSignups() {
      const snapshot = await getDocs(collection(window.db, "signups"));
      signupsData = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!signupsData[data.date]) {
          signupsData[data.date] = [];
        }
        signupsData[data.date].push({ id: docSnap.id, name: data.name, approved: data.approved || false });
      });
    }
function renderTabs() {
  const tabDiv = document.getElementById("month-tabs");
  tabDiv.innerHTML = '';

  months.forEach(month => {
    const btn = document.createElement("button");
    btn.textContent = month;
    btn.className = "month-tab";
    if (month === selectedMonth && !viewingMyShifts) {
      btn.classList.add("selected");
    }
    btn.onclick = async () => {
      selectedMonth = month;
      viewingMyShifts = false;
      renderTabs();
      await fetchSignups();
      renderCalendar();
    };
    tabDiv.appendChild(btn);
  });

  const myShiftsBtn = document.createElement("button");
  myShiftsBtn.textContent = "My Shifts";
  myShiftsBtn.className = "month-tab";
  if (viewingMyShifts) {
    myShiftsBtn.classList.add("selected");
  }
  myShiftsBtn.onclick = () => {
    viewingMyShifts = true;
    renderTabs();
    renderMyShiftsView();
  };
  tabDiv.appendChild(myShiftsBtn);
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";
  for (let day = 1; day <= daysInMonth[selectedMonth]; day++) {
    const div = document.createElement("div");
    div.className = "day";
    const dateKey = `${selectedMonth}-${day}`;
    const guides = signupsData[dateKey] || [];
    const count = guides.length;

    let initialsHTML = guides.map(g => `<span style='color: ${g.approved ? "lightgreen" : "white"};'>${g.name[0]}</span>`).join(' ');

    div.innerHTML = `<strong>${day}</strong> (${count})<br><small>${initialsHTML}</small>`;

    if (count >= 5) {
      div.classList.add("full");
    }

    div.onclick = () => toggleDay(day, div);
    div.ondblclick = () => showDaySignups(dateKey);

    cal.appendChild(div);
  }
}

function toggleDay(day, element) {
  if (selectedDays.includes(day)) {
    selectedDays = selectedDays.filter(d => d !== day);
    element.classList.remove("selected");
  } else {
    selectedDays.push(day);
    element.classList.add("selected");
  }
}
function showDaySignups(dateKey) {
  const guides = signupsData[dateKey] || [];
  if (guides.length === 0) {
    alert("No guides signed up for this date.");
    return;
  }
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#222";
  popup.style.padding = "20px";
  popup.style.border = "2px solid #00ffe1";
  popup.style.zIndex = "999";
  popup.innerHTML = `
    <h3>Guides for ${dateKey}</h3>
    ${guides.map(g => `
      <div id="guide-${g.id}" style="margin:10px;${g.approved ? ' color: lightgreen;' : ''}">
        ${g.name}
        ${isAdmin ? `<button onclick="removeSignup('${g.id}')">Remove</button>` : ''}
        ${isAdmin ? `<button onclick="approveSignup('${g.id}')">Approve</button>` : ''}
      </div>
    `).join('')}
    <br>
    <button onclick="this.parentElement.remove()">Close</button>
  `;
  document.body.appendChild(popup);
}

window.removeSignup = async function(id) {
  await deleteDoc(doc(window.db, "signups", id));
  alert("Guide removed!");
  await fetchSignups();
  renderCalendar();
  const popup = document.querySelector("div[style*='position: fixed']");
  if (popup) popup.remove();
};

window.approveSignup = async function(id) {
  const docRef = doc(window.db, "signups", id);
  await updateDoc(docRef, { approved: true });
  await fetchSignups();
  renderCalendar();
  const popup = document.querySelector("div[style*='position: fixed']");
  if (popup) popup.remove();
};
function renderMyShiftsView() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = '';

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.style.marginBottom = "10px";
  cal.appendChild(input);

  const button = document.createElement("button");
  button.textContent = "Find My Shifts";
  button.style.display = "block";
  button.style.margin = "10px auto";
  cal.appendChild(button);

  const resultsDiv = document.createElement("div");
  cal.appendChild(resultsDiv);

  button.onclick = () => {
    const name = input.value.trim();
    if (!name) return;

    const myShifts = [];
    const myApprovedShifts = [];

    for (const [date, entries] of Object.entries(signupsData)) {
      entries.forEach(e => {
        if (e.name === name) {
          myShifts.push(date);
          if (e.approved) {
            myApprovedShifts.push(date);
          }
        }
      });
    }

    resultsDiv.innerHTML = `
      <h3>Your Shifts:</h3>
      ${myShifts.length > 0 ? `<ul>${myShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No shifts found.</p>'}
      <h3>✅ Approved Shifts:</h3>
      ${myApprovedShifts.length > 0 ? `<ul>${myApprovedShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No approved shifts yet.</p>'}
    `;
  };
}

function showCommentPopup(callback) {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#222";
  popup.style.padding = "20px";
  popup.style.border = "2px solid #00ffe1";
  popup.style.zIndex = "999";
  popup.innerHTML = `
    <h3>Add a comment?</h3>
    <input type="text" id="popup-comment" style="width: 100%; padding: 10px; margin-top: 10px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 6px;">
    <br><br>
    <button id="saveComment">Save Comment</button>
    <button id="skipComment">Skip</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("saveComment").onclick = function() {
    tempComment = document.getElementById("popup-comment").value.trim();
    popup.remove();
    callback();
  };

  document.getElementById("skipComment").onclick = function() {
    tempComment = "";
    popup.remove();
    callback();
  };
}

async function submitSignup() {
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  showCommentPopup(async () => {
    for (let day of selectedDays) {
      const dateKey = `${selectedMonth}-${day}`;
      await addDoc(collection(window.db, "signups"), {
        date: dateKey,
        name,
        comment: tempComment,
        approved: false
      });
    }

    selectedDays = [];
    document.getElementById("name").value = "";
    document.getElementById("calendar").innerHTML = "";
    document.getElementById("confirmation").style.display = "block";

    await fetchSignups();
    renderTabs();
    renderCalendar();

    setTimeout(() => {
      document.getElementById("confirmation").style.display = "none";
    }, 3000);
  });
}

async function exportSignups() {
  let csvContent = "data:text/csv;charset=utf-8,Date,Name,Approved\n";
  for (const [date, entries] of Object.entries(signupsData)) {
    entries.forEach(e => {
      csvContent += `${date},${e.name},${e.approved ? "Yes" : "No"}\n`;
    });
  }
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "aurora_viking_shifts.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function initApp() {
  if (isAdmin) {
    const adminBadge = document.createElement("div");
    adminBadge.style.position = "fixed";
    adminBadge.style.top = "10px";
    adminBadge.style.right = "10px";
    adminBadge.style.background = "#00ffe1";
    adminBadge.style.color = "black";
    adminBadge.style.padding = "10px 20px";
    adminBadge.style.borderRadius = "8px";
    adminBadge.innerText = "Admin Mode";
    document.body.appendChild(adminBadge);

    const exportButton = document.createElement("button");
    exportButton.innerText = "Export Shifts";
    exportButton.style.position = "fixed";
    exportButton.style.bottom = "10px";
    exportButton.style.right = "10px";
    exportButton.style.padding = "10px 20px";
    exportButton.style.background = "#00ffe1";
    exportButton.style.color = "black";
    exportButton.style.border = "none";
    exportButton.style.borderRadius = "8px";
    exportButton.style.cursor = "pointer";
    exportButton.onclick = exportSignups;
    document.body.appendChild(exportButton);
  }

  document.getElementById("submit").onclick = submitSignup;
  await fetchSignups();
  renderTabs();
  renderCalendar();
}

showAdminLogin();

}, 100);
};
