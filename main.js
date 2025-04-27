// Remove the guest feature and related code
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
    let loggedInGuide = null; // Store logged in guide object
    // Removed isGuest variable as we're removing this feature

    // Show login options or registration
    async function showLoginOptions() {
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
        <input id="login-email" type="email" placeholder="Email" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <input id="login-password" type="password" placeholder="Password" 
          style="width: 100%; padding: 12px; margin: 10px 0; font-size: 16px; background: #111; color: white; border: 1px solid #00ffe1; border-radius: 8px;">
        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
          <button id="guide-login" style="padding: 10px 20px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer;">Guide Login</button>
          <button id="admin-login" style="padding: 10px 20px; background: #00ffe1; color: black; border: none; border-radius: 8px; cursor: pointer;">Admin Login</button>
          <!-- Removed guest login button -->
        </div>
        <hr style="margin: 20px 0; border-color: #555;">
        <p>New guide? <button id="show-register" style="background: none; border: none; color: #00ffe1; cursor: pointer; text-decoration: underline;">Register here</button></p>
      `;
      document.body.appendChild(loginPopup);

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
      
      // Removed guest login handling
      
      document.getElementById("show-register").onclick = () => {
        loginPopup.remove();
        showRegistrationForm();
      };
    }
    
    // Show registration form for new guides
    function showRegistrationForm() {
      // Registration code remains the same
    }
    
    // Check if guide credentials are valid
    async function checkGuideCredentials(email, password) {
      // Unchanged function
    }
    
    // Check if email already exists
    async function checkEmailExists(email) {
      // Unchanged function
    }
    
    // Register new guide
    async function registerGuide(name, email, password) {
      // Unchanged function
    }

    async function fetchSignups() {
      // Unchanged function
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

    function renderCalendar() {
      const cal = document.getElementById("calendar");
      cal.innerHTML = "";
      
      // Removed guest message
      
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

        // Allow clicking days for everyone (removed guest check)
        div.onclick = () => toggleDay(day, div);
        div.ondblclick = () => showDaySignups(dateKey);

        cal.appendChild(div);
      }
      
      // Hide name input for logged-in guides, show it for admins
      const nameInput = document.getElementById("name");
      if (nameInput) {
        if (loggedInGuide) {
          nameInput.style.display = "none";
        } else {
          nameInput.style.display = "block";
        }
      }
      
      // Update submit button label for logged-in guides
      const submitButton = document.getElementById("submit");
      if (submitButton && loggedInGuide) {
        submitButton.textContent = "Sign Up for Selected Shifts";
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
      // Unchanged function
    }

    window.removeSignup = async function(id) {
      // Unchanged function
    };

    window.approveSignup = async function(id) {
      // Unchanged function
    };
    
    function renderMyShiftsWithName(guideName) {
      // Unchanged function
    }
    
    function renderMyShiftsView() {
      // Unchanged function
    }

    function showCommentPopup(callback) {
      // Unchanged function
    }

    async function submitSignup() {
      // No longer need to check for guest status
      
      // Use logged in guide's name instead of input field
      const name = loggedInGuide ? loggedInGuide.name : document.getElementById("name").value.trim();
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
      // Unchanged function
    }

    async function initApp() {
      // Show appropriate badge based on user type
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
      } else if (loggedInGuide) {
        // Add badge for logged in guide
        const guideBadge = document.createElement("div");
        guideBadge.style.position = "fixed";
        guideBadge.style.top = "10px";
        guideBadge.style.right = "10px";
        guideBadge.style.background = "#555";
        guideBadge.style.color = "white";
        guideBadge.style.padding = "10px 20px";
        guideBadge.style.borderRadius = "8px";
        guideBadge.innerText = `Guide: ${loggedInGuide.name}`;
        document.body.appendChild(guideBadge);
        
        // Add logout button - moved to top left
        const logoutButton = document.createElement("button");
        logoutButton.innerText = "Logout";
        logoutButton.style.position = "fixed";
        logoutButton.style.top = "10px";
        logoutButton.style.left = "10px"; // Positioned at top left
        logoutButton.style.padding = "10px 20px";
        logoutButton.style.background = "#444";
        logoutButton.style.color = "white";
        logoutButton.style.border = "none";
        logoutButton.style.borderRadius = "8px";
        logoutButton.style.cursor = "pointer";
        logoutButton.onclick = () => {
          location.reload(); // Simple reload to log out
        };
        document.body.appendChild(logoutButton);
      }
      // Removed guest mode block entirely

      // Set up submit button handler
      document.getElementById("submit").onclick = submitSignup;
      
      // Fetch data and render appropriate view
      await fetchSignups();
      renderTabs();
      
      if (loggedInGuide) {
        viewingMyShifts = true;
        renderTabs();
        renderMyShiftsWithName(loggedInGuide.name);
      } else {
        renderCalendar();
      }
    }

    // Check if the 'guides' collection exists, create it if not
    async function ensureGuidesCollection() {
      // Unchanged function
    }

    // Initialize the app
    await ensureGuidesCollection();
    showLoginOptions();

  }, 100);
};
