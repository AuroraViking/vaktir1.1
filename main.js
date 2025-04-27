import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

window.onload = function() {
  setTimeout(async function() {
    // App configuration
    const months = ["September", "October", "November", "December", "January", "February", "March", "April"];
    const daysInMonth = {
      September: 30, October: 31, November: 30, December: 31,
      January: 31, February: 29, March: 31, April: 30
    };

    // App state
    let selectedMonth = "September";
    let selectedDays = [];
    let signupsData = {};
    let viewingMyShifts = false;
    let tempComment = "";
    let isAdmin = false;
    let loggedInGuide = null;

    // Create hidden inputs needed by the app - ensuring they remain hidden
    function setupHiddenElements() {
      // Check if elements already exist and remove them
      const existingNameInput = document.getElementById("name");
      if (existingNameInput) existingNameInput.remove();
      
      const existingSubmitButton = document.getElementById("submit");
      if (existingSubmitButton) existingSubmitButton.remove();
      
      // Create truly hidden elements
      const hiddenNameInput = document.createElement("input");
      hiddenNameInput.id = "name";
      hiddenNameInput.type = "text";
      hiddenNameInput.style.display = "none";
      hiddenNameInput.setAttribute("aria-hidden", "true");
      document.body.appendChild(hiddenNameInput);

      const hiddenSubmitButton = document.createElement("button");
      hiddenSubmitButton.id = "submit";
      hiddenSubmitButton.style.display = "none";
      hiddenSubmitButton.setAttribute("aria-hidden", "true");
      document.body.appendChild(hiddenSubmitButton);
    }
    
    // Create styled element with common properties
    function createStyledElement(tagName, styles, properties = {}) {
      const element = document.createElement(tagName);
      Object.assign(element.style, styles);
      Object.entries(properties).forEach(([key, value]) => {
        element[key] = value;
      });
      return element;
    }
    
    // Common styles
    const commonStyles = {
      popupStyles: {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#222",
        padding: "30px",
        border: "2px solid #00ffe1",
        borderRadius: "10px",
        zIndex: "1000",
        textAlign: "center"
      },
      inputStyles: {
        width: "100%",
        padding: "12px",
        margin: "10px 0",
        fontSize: "16px",
        background: "#111",
        color: "white",
        border: "1px solid #00ffe1",
        borderRadius: "8px"
      },
      buttonStyles: {
        padding: "10px 20px",
        background: "#555",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        margin: "5px"
      },
      primaryButtonStyles: {
        padding: "10px 20px",
        background: "#00ffe1",
        color: "black",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        margin: "5px"
      }
    };

    // Show login options or registration
    function showLoginOptions() {
      const loginPopup = createStyledElement("div", commonStyles.popupStyles);
      
      loginPopup.innerHTML = `
        <h2 style="margin-bottom: 20px;">Login</h2>
        <input id="login-email" type="email" placeholder="Email" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <input id="login-password" type="password" placeholder="Password" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
          <button id="guide-login" style="padding: 10px 20px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer;">Guide Login</button>
          <button id="admin-login" style="padding: 10px 20px; background: #00ffe1; color: black; border: none; border-radius: 8px; cursor: pointer;">Admin Login</button>
        </div>
        <hr style="margin: 20px 0; border-color: #555;">
        <p>New guide? <button id="show-register" style="background: none; border: none; color: #00ffe1; cursor: pointer; text-decoration: underline;">Register here</button></p>
      `;

      document.body.appendChild(loginPopup);

      // Setup event handlers
      document.getElementById("guide-login").onclick = async () => {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        
        if (!email || !password) {
          alert("Please enter both email and password");
          return;
        }
        
        try {
          const guideExists = await checkGuideCredentials(email, password);
          if (guideExists) {
            loggedInGuide = guideExists;
            loginPopup.remove();
            initApp();
            // Automatically show guide's shifts
            viewingMyShifts = true;
            renderTabs();
            renderMyShiftsWithName(loggedInGuide.name);
          } else {
            alert("Invalid credentials");
          }
        } catch (error) {
          console.error("Login error:", error);
          alert("Login failed. Please try again.");
        }
      };

      document.getElementById("admin-login").onclick = () => {
        const password = document.getElementById("login-password").value.trim();
        if (password === "aurora123") {
          isAdmin = true;
          alert("Admin mode enabled!");
          loginPopup.remove();
          initApp();
        } else {
          alert("Incorrect admin password");
        }
      };
      
      document.getElementById("show-register").onclick = () => {
        loginPopup.remove();
        showRegistrationForm();
      };
    }
    
    // Show registration form for new guides
    function showRegistrationForm() {
      const registerPopup = createStyledElement("div", commonStyles.popupStyles);
      
      registerPopup.innerHTML = `
        <h2 style="margin-bottom: 20px;">Guide Registration</h2>
        <input id="reg-name" type="text" placeholder="Full Name" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <input id="reg-email" type="email" placeholder="Email" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <input id="reg-password" type="password" placeholder="Password" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <input id="reg-confirm-password" type="password" placeholder="Confirm Password" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
          <button id="register-guide" style="padding: 10px 20px; background: #00ffe1; color: black; border: none; border-radius: 8px; cursor: pointer;">Register</button>
          <button id="back-to-login" style="padding: 10px 20px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer;">Back to Login</button>
        </div>
      `;
      
      document.body.appendChild(registerPopup);
      
      document.getElementById("register-guide").onclick = async () => {
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();
        const confirmPassword = document.getElementById("reg-confirm-password").value.trim();
        
        if (!name || !email || !password) {
          alert("Please fill out all fields");
          return;
        }
        
        if (password !== confirmPassword) {
          alert("Passwords do not match");
          return;
        }
        
        try {
          // Check if email already exists
          const emailExists = await checkEmailExists(email);
          if (emailExists) {
            alert("Email already registered. Please use a different email.");
            return;
          }
          
          // Register new guide
          await registerGuide(name, email, password);
          alert("Registration successful! You can now log in.");
          registerPopup.remove();
          showLoginOptions();
        } catch (error) {
          console.error("Registration error:", error);
          alert("Registration failed. Please try again.");
        }
      };
      
      document.getElementById("back-to-login").onclick = () => {
        registerPopup.remove();
        showLoginOptions();
      };
    }
    
    // Firestore data operations
    
    // Check if guide credentials are valid
    async function checkGuideCredentials(email, password) {
      try {
        const guidesRef = collection(window.db, "guides");
        const q = query(guidesRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const guideDoc = querySnapshot.docs[0];
          const guideData = guideDoc.data();
          
          if (guideData.password === password) {
            return {
              id: guideDoc.id,
              name: guideData.name,
              email: guideData.email
            };
          }
        }
        return null;
      } catch (error) {
        console.error("Error checking guide credentials:", error);
        throw error;
      }
    }
    
    // Check if email already exists
    async function checkEmailExists(email) {
      try {
        const guidesRef = collection(window.db, "guides");
        const q = query(guidesRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error checking email:", error);
        throw error;
      }
    }
    
    // Register new guide
    async function registerGuide(name, email, password) {
      try {
        await addDoc(collection(window.db, "guides"), {
          name,
          email,
          password,
          registeredOn: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error registering guide:", error);
        throw error;
      }
    }

    // Fetch all signups from database
    async function fetchSignups() {
      try {
        const snapshot = await getDocs(collection(window.db, "signups"));
        signupsData = {};
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (!signupsData[data.date]) {
            signupsData[data.date] = [];
          }
          signupsData[data.date].push({ 
            id: docSnap.id, 
            name: data.name, 
            approved: data.approved || false 
          });
        });
      } catch (error) {
        console.error("Error fetching signups:", error);
        alert("Error loading schedule data. Please try again.");
      }
    }
    
    // UI Rendering Functions
    
    // Render month tabs and status
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

      // Only show "My Shifts" tab for logged in guides or admin
      if (loggedInGuide || isAdmin) {
        const myShiftsBtn = document.createElement("button");
        myShiftsBtn.textContent = loggedInGuide ? `${loggedInGuide.name}'s Shifts` : "My Shifts";
        myShiftsBtn.className = "month-tab";
        if (viewingMyShifts) {
          myShiftsBtn.classList.add("selected");
        }
        myShiftsBtn.onclick = () => {
          viewingMyShifts = true;
          renderTabs();
          if (loggedInGuide) {
            renderMyShiftsWithName(loggedInGuide.name);
          } else {
            renderMyShiftsView();
          }
        };
        tabDiv.appendChild(myShiftsBtn);
      }
    }

    // Render the calendar view
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

    // Toggle day selection
    function toggleDay(day, element) {
      if (selectedDays.includes(day)) {
        selectedDays = selectedDays.filter(d => d !== day);
        element.classList.remove("selected");
      } else {
        selectedDays.push(day);
        element.classList.add("selected");
      }
    }
    
    // Show signups for a specific day
    function showDaySignups(dateKey) {
      const guides = signupsData[dateKey] || [];
      if (guides.length === 0) {
        alert("No guides signed up for this date.");
        return;
      }
      
      const popup = createStyledElement("div", {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#222",
        padding: "20px",
        border: "2px solid #00ffe1",
        zIndex: "999"
      });
      
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

    // Admin functions for removing a signup
    window.removeSignup = async function(id) {
      try {
        await deleteDoc(doc(window.db, "signups", id));
        alert("Guide removed!");
        await fetchSignups();
        renderCalendar();
        const popup = document.querySelector("div[style*='position: fixed']");
        if (popup) popup.remove();
      } catch (error) {
        console.error("Error removing signup:", error);
        alert("Failed to remove guide. Please try again.");
      }
    };

    // Admin function for approving a signup
    window.approveSignup = async function(id) {
      try {
        const docRef = doc(window.db, "signups", id);
        await updateDoc(docRef, { approved: true });
        await fetchSignups();
        renderCalendar();
        const popup = document.querySelector("div[style*='position: fixed']");
        if (popup) popup.remove();
      } catch (error) {
        console.error("Error approving signup:", error);
        alert("Failed to approve guide. Please try again.");
      }
    };
    
    // Render guide's shifts view
    function renderMyShiftsWithName(guideName) {
      const cal = document.getElementById("calendar");
      cal.innerHTML = '';
      
      const headerDiv = document.createElement("div");
      headerDiv.innerHTML = `<h3>Welcome, ${guideName}!</h3>`;
      headerDiv.style.textAlign = "center";
      headerDiv.style.marginBottom = "20px";
      cal.appendChild(headerDiv);
      
      const myShifts = [];
      const myApprovedShifts = [];

      for (const [date, entries] of Object.entries(signupsData)) {
        entries.forEach(e => {
          if (e.name === guideName) {
            myShifts.push(date);
            if (e.approved) {
              myApprovedShifts.push(date);
            }
          }
        });
      }

      const resultsDiv = document.createElement("div");
      resultsDiv.innerHTML = `
        <h3>Your Shifts:</h3>
        ${myShifts.length > 0 ? `<ul>${myShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No shifts found.</p>'}
        <h3>✅ Approved Shifts:</h3>
        ${myApprovedShifts.length > 0 ? `<ul>${myApprovedShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No approved shifts yet.</p>'}
      `;
      cal.appendChild(resultsDiv);
      
      // Add a button to sign up for more shifts
      const signupButton = createStyledElement("button", {
        display: "block",
        margin: "20px auto",
        padding: "10px 20px",
        background: "#00ffe1",
        color: "black",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer"
      }, {
        textContent: "Sign up for more shifts"
      });
      
      signupButton.onclick = () => {
        selectedMonth = "September";
        viewingMyShifts = false;
        renderTabs();
        renderCalendar();
        // Pre-fill the name field with the guide's name
        const nameInput = document.getElementById("name");
        if (nameInput) {
          nameInput.value = guideName;
        }
      };
      
      cal.appendChild(signupButton);
    }
    
    // Admin function to view shifts by guide name
    function renderMyShiftsView() {
      const cal = document.getElementById("calendar");
      cal.innerHTML = '';

      const input = createStyledElement("input", {
        marginBottom: "10px",
        padding: "8px",
        width: "100%"
      }, {
        type: "text",
        placeholder: "Enter guide name"
      });
      
      cal.appendChild(input);

      const button = createStyledElement("button", {
        display: "block",
        margin: "10px auto",
        padding: "8px 15px",
        background: "#00ffe1",
        color: "black",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
      }, {
        textContent: "Find Shifts"
      });
      
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
          <h3>Shifts for ${name}:</h3>
          ${myShifts.length > 0 ? `<ul>${myShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No shifts found.</p>'}
          <h3>✅ Approved Shifts:</h3>
          ${myApprovedShifts.length > 0 ? `<ul>${myApprovedShifts.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p>No approved shifts yet.</p>'}
        `;
      };
    }

    // Show comment popup for shift signup
    function showCommentPopup(callback) {
      const popup = createStyledElement("div", {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#222",
        padding: "20px",
        border: "2px solid #00ffe1",
        zIndex: "999"
      });
      
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

    // Submit signup for selected days
    async function submitSignup() {
      if (!loggedInGuide) {
        alert("Please log in as a guide to sign up for shifts");
        return;
      }
      
      const nameInput = document.getElementById("name");
      const name = nameInput ? nameInput.value.trim() : "";
      
      if (!name) {
        alert("Guide name is missing");
        return;
      }
      
      if (selectedDays.length === 0) {
        alert("Please select at least one day");
        return;
      }

      showCommentPopup(async () => {
        try {
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
          
          const confirmation = document.getElementById("confirmation");
          if (confirmation) {
            confirmation.style.display = "block";
            setTimeout(() => {
              confirmation.style.display = "none";
            }, 3000);
          }

          await fetchSignups();
          renderTabs();
          renderCalendar();
        } catch (error) {
          console.error("Error submitting signup:", error);
          alert("Failed to submit signup. Please try again.");
        }
      });
    }

    // Admin function to export signups to CSV
    async function exportSignups() {
      try {
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
      } catch (error) {
        console.error("Error exporting data:", error);
        alert("Failed to export data. Please try again.");
      }
    }

    // Create navigation menu for both admin and guide views
    function createNavigationMenu() {
      const navMenu = createStyledElement("div", {
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: "999"
      });

      navMenu.innerHTML = `
        <select id="navigationSelect" style="
          font-size: 16px;
          padding: 8px 12px;
          background: #111;
          border: 2px solid #00ffe1;
          color: #00ffe1;
          border-radius: 8px;
          font-weight: bold;
          box-shadow: 0 0 15px #00ffe1, 0 0 30px #00ffe1;
          animation: glowPulse 2.5s infinite alternate;
          cursor: pointer;
        ">
          <option value="">Valmöguleikar</option>
          <option value="tracker">Fleet Tracker - Tablet</option>
          ${isAdmin ? '<option value="dashboard">Fleet Dashboard - Admin</option>' : ''}
          <option value="logout">Logout</option>
        </select>
      `;
      
      document.body.appendChild(navMenu);

      // Handle selection changes
      document.getElementById('navigationSelect').addEventListener('change', (e) => {
        const choice = e.target.value;
        if (choice === "tracker") {
          window.location.href = "https://auroraviking.github.io/FleetTracker1.0/";
        } else if (choice === "dashboard") {
          window.location.href = "https://auroraviking.github.io/FleetTracker1.0/dashboard.html";
        } else if (choice === "logout") {
          location.reload(); // simple logout
        }
      });
    }

    // Add signup button to the UI
    function createSignupButton() {
      const skraMigButton = createStyledElement("button", {
        position: "fixed",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "15px 30px",
        background: "#00ffe1",
        color: "black",
        border: "none",
        borderRadius: "8px",
        fontSize: "20px",
        cursor: "pointer",
        boxShadow: "0 0 20px #00ffe1, 0 0 40px #00ffe1",
        animation: "glowPulse 2s infinite alternate"
      }, {
        innerText: "✅ Skrá mig á valda daga"
      });
      
      skraMigButton.onclick = submitSignup;
      document.body.appendChild(skraMigButton);
    }

    // Initialize app UI based on user role
    async function initApp() {
      // Common setup
      createNavigationMenu();
      
      // Role-specific setup
      if (isAdmin) {
        // Admin badge
        const adminBadge = createStyledElement("div", {
          position: "fixed",
          top: "10px", 
          right: "10px",
          background: "#00ffe1",
          color: "black",
          padding: "10px 20px",
          borderRadius: "8px"
        }, {
          innerText: "Admin Mode"
        });
        document.body.appendChild(adminBadge);

        // Export button for admin
        const exportButton = createStyledElement("button", {
          position: "fixed",
          bottom: "10px",
          right: "10px",
          padding: "10px 20px",
          background: "#00ffe1",
          color: "black",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }, {
          innerText: "Export Shifts"
        });
        exportButton.onclick = exportSignups;
        document.body.appendChild(exportButton);
      } 
      else if (loggedInGuide) {
        // Guide badge
        const guideBadge = createStyledElement("div", {
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#555",
          color: "white",
          padding: "10px 20px",
          borderRadius: "8px"
        }, {
          innerText: `Guide: ${loggedInGuide.name}`
        });
        document.body.appendChild(guideBadge);
        
        // Setup name for the guide - ensure it's hidden
        const nameInput = document.getElementById("name");
        if (nameInput) {
          nameInput.style.display = "none";
          nameInput.setAttribute("aria-hidden", "true");
          nameInput.value = loggedInGuide.name;
        }
        
        // Create signup button for the guide
        createSignupButton();
      }

    // Load data and render calendar
      await fetchSignups();
      renderTabs();
      renderCalendar();
    }

    // Check if guides collection exists
    async function ensureGuidesCollection() {
      try {
        const guidesRef = collection(window.db, "guides");
        await getDocs(guidesRef);
        console.log("Guides collection checked");
      } catch (error) {
        console.error("Error checking guides collection:", error);
        // Collection may not exist, but this will be handled when adding guides
      }
    }

    // Start the application
    setupHiddenElements();
    await ensureGuidesCollection();
    showLoginOptions();

  }, 100);
};
