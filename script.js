// ========== DOM SELECTORS ==========
const form = document.getElementById("activityForm");
const logsList = document.getElementById("logsList");
const weeklySummary = document.getElementById("weeklySummary");
const monthlySummary = document.getElementById("monthlySummary");
const calendarGrid = document.getElementById("calendarGrid");
const chartCanvas = document.getElementById("financeChart");
const logDateDisplay = document.getElementById("logDateDisplay");
const dayLogEntries = document.getElementById("dayLogEntries");
const dayLogView = document.getElementById("dayLogView");
let projectChart = null;
// ========== LOCAL STORAGE ==========
let activities = JSON.parse(localStorage.getItem("activities") || "[]");

function shouldExport(interval) {
  const lastExport = localStorage.getItem(`lastExport_${interval}`);
  const today = new Date().toISOString().split("T")[0];

  if (!lastExport || new Date(today) > new Date(lastExport)) {
    localStorage.setItem(`lastExport_${interval}`, today);
    return true;
  }
  return false;
}

// ========== FORM SUBMIT ==========
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const category = form.category.value;
  const date = new Date().toISOString().split("T")[0];

  let input = form.input?.value?.trim(); // default input
  let isValid = true;

  // Finance
  if (category === "finance") {
    const receivedFrom = document.getElementById("financeReceivedFrom")?.value.trim();
    const amountReceived = document.getElementById("financeAmountReceived")?.value.trim();
    const spentOn = document.getElementById("financeSpentOn")?.value.trim();
    const amountSpent = document.getElementById("financeAmountSpent")?.value.trim();

    if (!receivedFrom && !spentOn) {
      alert("Fill out at least Received From or Spent On in Finance.");
      return;
    }

    input = {
      receivedFrom: receivedFrom || null,
      amountReceived: parseFloat(amountReceived) || 0,
      spentOn: spentOn || null,
      amountSpent: parseFloat(amountSpent) || 0
    };
  }

  // Projects
  else if (category === "projects") {
    const scam = document.getElementById("scamSentryNote")?.value.trim();
    const scent = document.getElementById("scentNetNote")?.value.trim();
    const pega = document.getElementById("pegasusNote")?.value.trim();
    const other = document.getElementById("otherProjectNote")?.value.trim();

    if (!scam && !scent && !pega && !other) {
      alert("Add at least one project note.");
      return;
    }

    input = `Scam Sentry: ${scam || "—"}, ScentNet: ${scent || "—"}, Pegasus: ${pega || "—"}, Other: ${other || "—"}`;
  }

  // Drugs — ✅ move this before default input check
  else if (category === "drugs") {
    const drugType = document.getElementById("drugType")?.value;
    const drugNote = document.getElementById("drugNote")?.value.trim();

    if (!drugType || !drugNote) {
      alert("Please select drug type and enter a note.");
      return;
    }

    input = {
      drugType,
      drugNote
    };
  }

  // Lifting
  else if (category === "lifting") {
    input = "Done";
  }

  // Default activities
  else if (!input) {
    alert("Fill out the activity!");
    return;
  }

  // Save entry
  const entry = { category, input, date };
  activities.push(entry);
  localStorage.setItem("activities", JSON.stringify(activities));
  // Save to activityLogs for chart tracking
const activityLogs = JSON.parse(localStorage.getItem("activityLogs") || "[]");

if (category === "drugs" && typeof input === "object") {
  activityLogs.push({
    activity: "drug",
    subtype: input.drugType.toLowerCase(),
    note: input.drugNote,
    date: date,
  });
}

localStorage.setItem("activityLogs", JSON.stringify(activityLogs));
if (category === "drugs" && typeof input === "object") {
  const logEntry = {
    activity: "drug",
    subtype: input.drugType.toLowerCase(),
    note: input.drugNote,
    date: date,
  };

  activityLogs.push(logEntry);
  console.log("🚀 Drug activity log saved:", logEntry);  // <-- ADD THIS
}


  localStorage.setItem("activities", JSON.stringify(activities));

  form.reset();
  customFields.innerHTML = ""; // clear dynamic fields
  renderLogs();
  renderSummary();
  renderFinanceChart();
  buildCalendarView();
});

// ========== RENDER FUNCTIONS ==========
const drugEmojis = {
  weed: "🌿",
  alcohol: "🍺",
  medication: "💊"
};

function renderLogs() {
  const latest = activities.slice(-10).reverse();
  logsList.innerHTML = "";

  latest.forEach(log => {
    const li = document.createElement("li");

    let displayInput = log.input;

    // Handle finance logs
    if (log.category === "finance" && typeof log.input === "object") {
      const { amountReceived, receivedFrom, amountSpent, spentOn } = log.input;
      displayInput = `Received: ${amountReceived} from ${receivedFrom || "N/A"} | Spent: ${amountSpent} on ${spentOn || "N/A"}`;
    }

    // ✅ Handle drug logs with emoji
    else if (log.category === "drugs" && typeof log.input === "object") {
      const { drugType, drugNote } = log.input;
      const emoji = drugEmojis[drugType] || "💊"; // fallback emoji
      displayInput = `${emoji} ${drugType}: ${drugNote}`;
    }

    li.textContent = `${log.date}: [${log.category}] ${displayInput}`;
    logsList.appendChild(li);
  });
}


function renderSummary() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weekly = activities.filter(entry => new Date(entry.date) >= weekAgo);
  const monthly = activities.filter(entry => new Date(entry.date) >= monthAgo);
  const weedCount = weekly.filter(e => e.category === "drugs" && e.input.drugType === "weed").length;
const alcoholCount = weekly.filter(e => e.category === "drugs" && e.input.drugType === "alcohol").length;

weeklySummary.textContent = `Weekly: ${weekly.length} activities | 🌿 Weed: ${weedCount} | 🍺 Alcohol: ${alcoholCount}`;


  weeklySummary.textContent = `Weekly: ${weekly.length} activities`;
  monthlySummary.textContent = `Monthly: ${monthly.length} activities`;
}

function buildCalendarView() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarGrid.innerHTML = "";

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;

    const logsForDay = activities.filter(entry => entry.date === dateKey);
    const icons = [];

    logsForDay.forEach(entry => {
      const cat = entry.category.toLowerCase();
      if (cat === "lifting" && !icons.includes("🏋️‍♂️")) icons.push("🏋️‍♂️");
      if (cat === "writing" && !icons.includes("✍️")) icons.push("✍️");
      if (cat === "coding" && !icons.includes("💻")) icons.push("💻");
      if (cat === "drugs" && !icons.includes("💊")) icons.push("💊");
      if (cat === "travel" && !icons.includes("✈️")) icons.push("✈️");
      if (cat === "finance" && !icons.includes("💰")) icons.push("💰");
      if (cat === "projects" && !icons.includes("📂")) icons.push("📂");
      if (cat === "misc" && !icons.includes("📝")) icons.push("📝");
    });

    const dayDiv = document.createElement("div");
    dayDiv.classList.add("calendar-day");
    dayDiv.innerHTML = `
      <span class="date">${day}</span>
      <span class="emoji-icons">${icons.join(" ")}</span>
    `;
    dayDiv.dataset.date = dateKey;

    dayDiv.addEventListener("click", () => showDayLog(dateKey));
    calendarGrid.appendChild(dayDiv);
  }
}

function showDayLog(dateKey) {
  const logs = activities.filter(entry => {
    const entryDate = new Date(entry.date).toISOString().split("T")[0];
    return entryDate === dateKey;
  });

  if (!logs.length) {
    alert("No entries for this date.");
    return;
  }

  logDateDisplay.textContent = dateKey;
  dayLogEntries.innerHTML = "";

  logs.forEach(entry => {
    const li = document.createElement("li");
    let inputText = entry.input;

    if (entry.category === "finance" && typeof entry.input === "object") {
      const { amountReceived, receivedFrom, amountSpent, spentOn } = entry.input;
      inputText = `Received: ${amountReceived || 0} from ${receivedFrom || "N/A"} | Spent: ${amountSpent || 0} on ${spentOn || "N/A"}`;
    } else if (entry.category === "drugs" && typeof entry.input === "object") {
      inputText = `${entry.input.drugType || "Unknown"}: ${entry.input.drugNote || ""}`;
    }

    li.innerHTML = `<strong>${entry.category.toUpperCase()}:</strong> ${inputText}`;
    dayLogEntries.appendChild(li);
  });
}


function renderFinanceChart() {
  const financeEntries = activities.filter(entry => entry.category === "finance");

  let income = 0;
  let expenses = 0;

  financeEntries.forEach(entry => {
    const data = entry.input;
    if (data.amountReceived) income += Number(data.amountReceived);
    if (data.amountSpent) expenses += Number(data.amountSpent);
  });

  const ctx = document.getElementById("financeChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.financeChartInstance) {
    window.financeChartInstance.destroy();
  }
console.log("Income:", income, "Expenses:", expenses);

  window.financeChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ["green", "red"]
      }]
    },
    options: {
      responsive: false
    }
  });
}
// Global so we can update it

function renderProjectChart(data) {
  const ctx = document.getElementById("projectChart").getContext("2d");

  const scam = Number(data.scam || 0);
  const scent = Number(data.scent || 0);
  const pega = Number(data.pega || 0);
  const other = Number(data.other || 0);

  projectChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Scam Sentry", "ScentNet", "Pegasus", "Other"],
      datasets: [
        {
          label: "Project Progress (%)",
          data: [scam, scent, pega, other],
          backgroundColor: ["#4ade80", "#60a5fa", "#facc15", "#f87171"],
          borderWidth: 1,
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}


// ========== EXPORT TO CSV ==========
document.getElementById("exportBtn").addEventListener("click", () => {
  const header = "Date,Category,Input\n";
  const rows = activities.map(a => {
    let inputStr = "";

    if (a.category === "finance" && typeof a.input === "object") {
      const { amountReceived, receivedFrom, amountSpent, spentOn } = a.input;
      inputStr = `Received: ${amountReceived || 0} from ${receivedFrom || "N/A"} | Spent: ${amountSpent || 0} on ${spentOn || "N/A"}`;
    } else if (a.category === "drugs" && typeof a.input === "object") {
      inputStr = `${a.input.drugType || "Unknown"}: ${a.input.drugNote || ""}`;
    } else {
      inputStr = typeof a.input === "object" ? JSON.stringify(a.input) : a.input;
    }

    const safeDate = a.date || new Date().toISOString().split("T")[0]; // fallback
    return `"${safeDate}","${a.category}","${inputStr.replace(/"/g, '""')}"`;
  }).join("\n");

  const csv = "\uFEFF" + header + rows; // Add BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "activity_log.csv";
  link.click();
});


// ========== INIT ==========
window.onload = () => {
  renderLogs();
  renderSummary();
  renderFinanceChart();
  buildCalendarView();
};
function checkReminderTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Only remind between 9:00 and 9:05 PM (to prevent too many popups)
  if (hours === 21 && minutes >= 0 && minutes <= 5) {
    if (!localStorage.getItem("remindedToday")) {
      setTimeout(() => {
        const confirmFill = confirm("📝 Reminder: Did you fill in your tracker today?");
        if (confirmFill) {
          // Optional: focus the first input field
          document.querySelector("input, select, textarea")?.focus();
        }
        localStorage.setItem("remindedToday", "yes");
      }, 1000); // Wait 1s after page load
    }
  }
}

// Clear reminder flag every new day
function resetReminderFlag() {
  const lastDate = localStorage.getItem("lastReminderDate");
  const today = new Date().toDateString();

  if (lastDate !== today) {
    localStorage.removeItem("remindedToday");
    localStorage.setItem("lastReminderDate", today);
  }
}

resetReminderFlag();
checkReminderTime();



window.addEventListener("load", () => {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const date = now.getDate();

  // Export every Sunday
  if (day === 0 && shouldExport("weekly")) {
    exportCSV();
  }

  // Export on the 1st of each month
  if (date === 1 && shouldExport("monthly")) {
    exportCSV();
  }
});
function loadProjectData() {
  const saved = JSON.parse(localStorage.getItem("projectData")) || {};

  document.getElementById("progressScam").value = saved.scam || 0;
  document.getElementById("noteScam").value = saved.noteScam || "";
  document.getElementById("timeScam").textContent = saved.updatedScam ? `Last updated: ${saved.updatedScam}` : "";

  document.getElementById("progressScent").value = saved.scent || 0;
  document.getElementById("noteScent").value = saved.noteScent || "";
  document.getElementById("timeScent").textContent = saved.updatedScent ? `Last updated: ${saved.updatedScent}` : "";

  document.getElementById("progressPega").value = saved.pega || 0;
  document.getElementById("notePega").value = saved.notePega || "";
  document.getElementById("timePega").textContent = saved.updatedPega ? `Last updated: ${saved.updatedPega}` : "";
console.log("Loaded saved data:", saved);

  document.getElementById("progressOther").value = saved.other || 0;
  document.getElementById("noteOther").value = saved.noteOther || "";
  document.getElementById("timeOther").textContent = saved.updatedOther ? `Last updated: ${saved.updatedOther}` : "";
}









function updateProjectChart() {
   console.log("Updating project chart...");
  const scam = Number(document.getElementById("progressScam").value);
  const scent = Number(document.getElementById("progressScent").value);
  const pega = Number(document.getElementById("progressPega").value);
  const other = Number(document.getElementById("progressOther").value);

  const ctx = document.getElementById('projectChart').getContext('2d');

  if (window.projectChart) window.projectChart.destroy(); // avoid chart duplication

  window.projectChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Scam Sentry', 'ScentNet', 'Pegasus', 'Other'],
      datasets: [{
        label: 'Project Completion (%)',
        data: [scam, scent, pega, other],
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0']
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}
function exportProjectsToCSV() {
  const data = JSON.parse(localStorage.getItem("projectData")) || {};
  let csv = "Project,Note,Progress (%),Last Updated\n";

  const projects = [
    { key: "Scam", name: "Scam Sentry" },
    { key: "Scent", name: "ScentNet" },
    { key: "Pega", name: "Pegasus" },
    { key: "Other", name: "Other" }
  ];

  projects.forEach(({ key, name }) => {
    const note = data[`note${key}`] || "";
    const progress = data[`progress${key}`] || 0;
    const updated = data[`updated${key}`] || "";
    csv += `"${name}","${note}",${progress},"${updated}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "project_data.csv";
  link.click();
  URL.revokeObjectURL(url);
}


function saveProjectProgress(projectKey) {
  const progress = document.getElementById(`progress${projectKey}`).value;
  const note = document.getElementById(`note${projectKey}`).value;
  const updated = new Date().toLocaleString();

  // Get existing projectData or create new one
  let projectData = JSON.parse(localStorage.getItem("projectData")) || {};

  // Update only the current project
  projectData[`progress${projectKey}`] = progress;
  projectData[`note${projectKey}`] = note;
  projectData[`updated${projectKey}`] = updated;

  // Save back to localStorage
  localStorage.setItem("projectData", JSON.stringify(projectData));

  // Show updated time immediately
  document.getElementById(`time${projectKey}`).textContent = `Updated: ${updated}`;
}

document.getElementById("saveProjects").addEventListener("click", () => {
  ["Scam", "Scent", "Pega", "Other"].forEach(saveProjectProgress);
  renderProjectChart(); // Refresh chart after saving all
});

function loadProjectProgress() {
  const projectData = JSON.parse(localStorage.getItem("projectData")) || {};

  ["Scam", "Scent", "Pega", "Other"].forEach(projectKey => {
    const note = projectData[`note${projectKey}`] || "";
    const progress = projectData[`progress${projectKey}`] || 0;
    const updated = projectData[`updated${projectKey}`] || "";

    document.getElementById(`note${projectKey}`).value = note;
    document.getElementById(`progress${projectKey}`).value = progress;
    document.getElementById(`time${projectKey}`).textContent = updated ? `Updated: ${updated}` : "";
  });
}
// We need to store the chart so we can update it later
function renderProjectChart() {
  const saved = JSON.parse(localStorage.getItem("projectData") || "{}");

  const labels = ["Scam Sentry", "ScentNet", "Pegasus", "Other"];
  const progress = [
    parseInt(saved.progressScam) || 0,
    parseInt(saved.progressScent) || 0,
    parseInt(saved.progressPega) || 0,
    parseInt(saved.progressOther) || 0,
  ];

  const chartCanvas = document.getElementById("projectChart");
  if (!chartCanvas) return; // Exit if the canvas doesn't exist

  const ctx = chartCanvas.getContext("2d");

  // Destroy if chart already exists and is a valid Chart instance
  if (window.projectChart instanceof Chart) {
    window.projectChart.destroy();
  }

  window.projectChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Project Progress (%)",
          data: progress,
          backgroundColor: ["#f87171", "#60a5fa", "#34d399", "#facc15"],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}
function getWeeklySubstanceData() {
  console.log("Drug subtype counts:", typeTotals);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const storedLogs = JSON.parse(localStorage.getItem("activityLogs")) || [];

  const drugLogs = storedLogs.filter(log =>
    (log.type === "drugs" || log.activity === "drug") &&
    new Date(log.date) >= weekAgo
  );

  const typeTotals = {
    weed: 0,
    alcohol: 0,
    medication: 0,
  };

  drugLogs.forEach(log => {
    const type = log.subtype || (log.note?.toLowerCase().includes("alcohol") ? "alcohol" :
                  log.note?.toLowerCase().includes("weed") ? "weed" :
                  log.note?.toLowerCase().includes("med" || "pill") ? "medication" : "unknown");

    if (type === "weed") typeTotals.weed++;
    else if (type === "alcohol") typeTotals.alcohol++;
    else if (type === "medication") typeTotals.medication++;
  });

  return typeTotals;
}

function renderSubstanceTrackerChart() {
  const activityLogs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
  console.log("📊 Loaded activityLogs for chart:", activityLogs);

  const pastWeek = activityLogs.filter(log => {
    const logDate = new Date(log.date);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return log.activity === "drug" && logDate >= oneWeekAgo;
  });

  let weedCounts = 0;
  let alcoholCounts = 0;
  let medicationCounts = 0;

  pastWeek.forEach(log => {
    const qty = parseInt(log.note) || 1; // default to 1 if note is text or empty
    if (log.subtype === "weed") weedCounts += qty;
    if (log.subtype === "alcohol") alcoholCounts += qty;
    if (log.subtype === "medication") medicationCounts += qty;
  });

  const chart = document.getElementById("substanceChart").getContext("2d");
  if (window.substanceChartInstance) {
    window.substanceChartInstance.destroy();
  }

  window.substanceChartInstance = new Chart(chart, {
    type: "bar",
    data: {
      labels: ["Weed 🌿", "Alcohol 🍺", "Medication 💊"],
      datasets: [{
        label: "Substance use (last 7 days)",
        data: [weedCounts, alcoholCounts, medicationCounts],
        backgroundColor: ["#4caf50", "#2196f3", "#ff9800"]
      }]
    },
    
    options: {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Substance Use This Week',
      font: {
        size: 20
      }
    },
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
}

  });
}


function getWeekStartEnd() {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const start = new Date(now.setDate(diffToMonday));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
function extractAmountFromNote(note) {
  const match = note.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 1;
}



// Call safely after DOM is loaded
window.addEventListener("DOMContentLoaded", renderProjectChart);


document.getElementById("exportProjectsCSV").addEventListener("click", exportProjectsToCSV);
window.addEventListener("load", () => {
  loadProjectData();
  renderSubstanceTrackerChart();

   loadProjectProgress();
  renderProjectChart(); // <- this ensures the chart shows when you reload
});
["Scam", "Scent", "Pega", "Other"].forEach(projectKey => {
  const slider = document.getElementById(`progress${projectKey}`);
  const note = document.getElementById(`note${projectKey}`);

  // Live update on slider move
  slider.addEventListener("input", () => {
    saveProjectProgress(projectKey);
    renderProjectChart();
  });

  // Update chart when note is blurred (finished editing)
  note.addEventListener("blur", () => {
    saveProjectProgress(projectKey);
    renderProjectChart();
  });
});

