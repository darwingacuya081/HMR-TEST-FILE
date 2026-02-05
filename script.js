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

// Add a single equipment row. HMR auto-computes as After - Before.
function addEquipmentRow() {
  const equipmentList = document.getElementById("equipment-list");
  const row = document.createElement("div");
  row.className = "equipment-table equipment-row";

  row.innerHTML = `
    <input type="text" class="equipment_name" placeholder="Equipment name" />
    <input type="number" class="equipment_before_hmr" placeholder="0" step="0.1" min="0" />
    <input type="number" class="equipment_after_hmr" placeholder="0" step="0.1" min="0" />
    <input type="number" class="equipment_hmr" placeholder="0" step="0.1" readonly />
    <button type="button" class="remove-btn" data-action="remove">❌</button>
  `;

  const beforeInput = row.querySelector(".equipment_before_hmr");
  const afterInput = row.querySelector(".equipment_after_hmr");

  beforeInput.addEventListener("input", () => updateEquipmentHmr(row));
  afterInput.addEventListener("input", () => updateEquipmentHmr(row));

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

// Update computed HMR value for an equipment row.
function updateEquipmentHmr(row) {
  const beforeValue = parseFloat(row.querySelector(".equipment_before_hmr").value) || 0;
  const afterValue = parseFloat(row.querySelector(".equipment_after_hmr").value) || 0;
  const computedHmr = afterValue - beforeValue;

  row.querySelector(".equipment_hmr").value = computedHmr.toFixed(1);
}

// Carry After value into Before after successful submission.
function carryForwardEquipmentBeforeValues() {
  document.querySelectorAll(".equipment-row").forEach((row) => {
    const beforeInput = row.querySelector(".equipment_before_hmr");
    const afterInput = row.querySelector(".equipment_after_hmr");

    if (afterInput.value !== "") {
      beforeInput.value = afterInput.value;
      afterInput.value = "";
      updateEquipmentHmr(row);
    }
  });
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
  const selectedDate = document.getElementById("date").value;
  const volumeCp1 = document.getElementById("volume-cp1").value;
  const volumeCp2 = document.getElementById("volume-cp2").value;

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
      date: selectedDate,
      role: row.dataset.role,
      name: row.dataset.name,
      daily_rate: rate,
      work_hours: work,
      ot_hours: ot,
      ot_rate: otRate,
      amount,
      volume_cp1: volumeCp1,
      volume_cp2: volumeCp2,
    });
  });

  document.querySelectorAll(".equipment-row").forEach((row) => {
    const name = row.querySelector(".equipment_name").value.trim();
    const before = row.querySelector(".equipment_before_hmr").value;
    const after = row.querySelector(".equipment_after_hmr").value;
    const hmr = row.querySelector(".equipment_hmr").value;

    if (!name && !before && !after) {
      return;
    }

    records.push({
      entry_type: "equipment",
      date: selectedDate,
      equipment_name: name,
      start_hmr: before,
      end_hmr: after,
      equipment_hmr: hmr,
      volume_cp1: volumeCp1,
      volume_cp2: volumeCp2,
    });
  });

  // Send a dedicated volume record if user only entered volume values.
  if ((volumeCp1 || volumeCp2) && records.length === 0) {
    records.push({
      entry_type: "volume",
      date: selectedDate,
      volume_cp1: volumeCp1,
      volume_cp2: volumeCp2,
    });
  }

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(records),
  })
    .then(() => {
      document.getElementById("status").innerText = "Saved ✅";
      carryForwardEquipmentBeforeValues();
    })
    .catch(() => {
      document.getElementById("status").innerText = "Error ❌";
    });
}
