const API_URL =
  "https://script.google.com/macros/s/AKfycbznSjat0-YZA-V_5ObEix3yhTdfAmSWZOjHpddtTtA2o7B1nQWmY8gnirIj173YTQfXBQ/exec";

// Master list (fixed as provided).
const MANPOWER_MASTER = [
  { role: "HEO", name: "Michael Pedres", rate: 873.04 },
  { role: "HEO", name: "Edmundo Aragdon", rate: 750 },
  { role: "HEO", name: "Florentino Estrella", rate: 735 },
  { role: "HEO", name: "Francis Erick Codog", rate: 750 },
  { role: "Nightshift", name: "Solaiman Pasandalan", rate: 695 },
  { role: "Spotter", name: "Crispin Rosales", rate: 695 },
  { role: "Spotter", name: "Angelo Dela Cruz", rate: 695 },
  { role: "Spotter", name: "Rafael Jr. Geromo", rate: 695 },
  { role: "Spotter", name: "Richard Pamposa", rate: 695 },
  { role: "Spotter", name: "Jonathan Sison", rate: 695 },
  { role: "Spotter", name: "Ruther Borabo", rate: 695 },
  { role: "Spotter", name: "Robert Geromo", rate: 695 },
  { role: "Spotter", name: "Richard Carian", rate: 695 },
  { role: "Helpers", name: "Felipe Robrigado", rate: 695 },
  { role: "Helpers", name: "Raffy Gonzales", rate: 695 },
  { role: "Helpers", name: "Ricardo Delim", rate: 695 },
  { role: "Helpers", name: "Jarenz Bayuon", rate: 695 },
  { role: "Helpers", name: "Mark Joseph Rufila", rate: 695 },
  { role: "Helpers", name: "Edeson Gonzales", rate: 695 },
  { role: "Helpers", name: "Kelvin Medina", rate: 695 },
];

window.addEventListener("load", () => {
  const roles = [...new Set(MANPOWER_MASTER.map((manpower) => manpower.role))];
  const container = document.getElementById("roles");
  const addEquipmentButton = document.getElementById("add-equipment");

  roles.forEach((role) => {
    const box = document.createElement("div");
    box.className = "role-box";
    box.innerHTML = `<h3>${role}</h3>`;

    const list = document.createElement("div");
    list.dataset.role = role;

    MANPOWER_MASTER.filter((manpower) => manpower.role === role).forEach((manpower) =>
      addManpowerRow(list, manpower)
    );

    box.appendChild(list);
    container.appendChild(box);
  });

  addEquipmentButton.addEventListener("click", () => addEquipmentRow());
  addEquipmentRow();

  document.getElementById("submit").addEventListener("click", submitData);
});

// Add a single manpower row.
function addManpowerRow(container, data) {
  const row = document.createElement("div");
  row.className = "manpower-row";
  row.dataset.name = data.name;
  row.dataset.role = data.role;

  row.innerHTML = `
    <strong>${data.name}</strong>
    <input type="number" class="work_hours" placeholder="Work" step="0.1" />
    <input type="number" class="ot_hours" placeholder="OT" step="0.1" />
    <input type="number" class="daily_rate" value="${data.rate}" disabled />
    <button type="button" class="add-btn" data-action="toggle">✏️</button>
    <button type="button" class="remove-btn" data-action="remove">❌</button>
  `;

  row.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    if (target.dataset.action === "toggle") {
      toggleRate(target);
    }

    if (target.dataset.action === "remove") {
      row.remove();
    }
  });

  container.appendChild(row);
}

// Add a single equipment row.
function addEquipmentRow() {
  const equipmentList = document.getElementById("equipment-list");
  const row = document.createElement("div");
  row.className = "equipment-row";

  row.innerHTML = `
    <input type="text" class="equipment_name" placeholder="Equipment name" />
    <input type="number" class="equipment_start_hmr" placeholder="Start HMR" step="0.1" min="0" />
    <input type="number" class="equipment_end_hmr" placeholder="End HMR" step="0.1" min="0" />
    <button type="button" class="remove-btn" data-action="remove">❌</button>
  `;

  row.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    if (target.dataset.action === "remove") {
      row.remove();
    }
  });

  equipmentList.appendChild(row);
}

// Toggle rate lock.
function toggleRate(button) {
  const rateInput = button.parentElement.querySelector(".daily_rate");
  rateInput.disabled = !rateInput.disabled;
  button.textContent = rateInput.disabled ? "✏️" : "🔒";
}

// Submit all records to the API URL.
function submitData() {
  const records = [];

  document.querySelectorAll(".manpower-row").forEach((row) => {
    const work = row.querySelector(".work_hours").value;
    const ot = row.querySelector(".ot_hours").value;

    if (!work && !ot) {
      return;
    }

    const rate = parseFloat(row.querySelector(".daily_rate").value);
    const otRate = rate / 8;
    const amount = work * (rate / 8) + ot * otRate;

    records.push({
      entry_type: "manpower",
      date: document.getElementById("date").value,
      role: row.dataset.role,
      name: row.dataset.name,
      daily_rate: rate,
      work_hours: work,
      ot_hours: ot,
      ot_rate: otRate,
      amount,
    });
  });

  document.querySelectorAll(".equipment-row").forEach((row) => {
    const name = row.querySelector(".equipment_name").value.trim();
    const start = row.querySelector(".equipment_start_hmr").value;
    const end = row.querySelector(".equipment_end_hmr").value;

    if (!name && !start && !end) {
      return;
    }

    records.push({
      entry_type: "equipment",
      date: document.getElementById("date").value,
      equipment_name: name,
      start_hmr: start,
      end_hmr: end,
    });
  });

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(records),
  })
    .then(() => {
      document.getElementById("status").innerText = "Saved ✅";
    })
    .catch(() => {
      document.getElementById("status").innerText = "Error ❌";
    });
}
