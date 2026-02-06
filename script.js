const API_URL =
  "https://script.google.com/macros/s/AKfycbznSjat0-YZA-V_5ObEix3yhTdfAmSWZOjHpddtTtA2o7B1nQWmY8gnirIj173YTQfXBQ/exec";
const FORM_STATE_KEY = "hmr-form-state-v1";

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

function initApp() {
  if (window.__hmrInitialized) {
    return;
  }
  window.__hmrInitialized = true;

  const roles = [...new Set(MANPOWER_MASTER.map((manpower) => manpower.role))];
  const container = document.getElementById("roles");
  const addEquipmentButton = document.getElementById("add-equipment");
  const manpowerSelect = document.getElementById("manpower-select");
  const addManpowerButton = document.getElementById("add-manpower");

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

  updateManpowerSelect(manpowerSelect);

  addManpowerButton.addEventListener("click", () => {
    const selectedName = manpowerSelect.value;
    if (!selectedName) {
      return;
    }

    addManpowerByName(selectedName);
    updateManpowerSelect(manpowerSelect);
    saveState();
  });

  addEquipmentButton.addEventListener("click", () => {
    addEquipmentRow();
    saveState();
  });
  addEquipmentRow();

  document.getElementById("submit").addEventListener("click", submitData);

  // Save all user edits so values remain after refresh.
  document.body.addEventListener("input", saveState);
  document.body.addEventListener("change", saveState);

  loadState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

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
      saveState();
      updateManpowerSelect(document.getElementById("manpower-select"));
    }
  });

  container.appendChild(row);
}

function addManpowerByName(name) {
  const data = MANPOWER_MASTER.find((entry) => entry.name === name);
  if (!data) {
    return;
  }

  const roleBox = Array.from(document.querySelectorAll(".role-box")).find((box) => {
    const header = box.querySelector("h3");
    return header && header.textContent === data.role;
  });

  if (!roleBox) {
    return;
  }

  const list = roleBox.querySelector("[data-role]");
  if (!list) {
    return;
  }

  addManpowerRow(list, data);
}

function updateManpowerSelect(select) {
  if (!select) {
    return;
  }

  const existingNames = new Set(
    Array.from(document.querySelectorAll(".manpower-row")).map((row) => row.dataset.name)
  );
  const availableNames = MANPOWER_MASTER.filter((entry) => !existingNames.has(entry.name));

  select.innerHTML = "";

  if (availableNames.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "All manpower added";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  availableNames.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.name;
    option.textContent = `${entry.name} (${entry.role})`;
    select.appendChild(option);
  });

  select.disabled = false;
}

function addEquipmentRow(initialData = {}) {
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

  row.querySelector(".equipment_name").value = initialData.name || "";
  row.querySelector(".equipment_before_hmr").value = initialData.before || "";
  row.querySelector(".equipment_after_hmr").value = initialData.after || "";

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
      saveState();
    }
  });

  equipmentList.appendChild(row);
  updateEquipmentHmr(row);
}

function updateEquipmentHmr(row) {
  const beforeValue = parseFloat(row.querySelector(".equipment_before_hmr").value) || 0;
  const afterValue = parseFloat(row.querySelector(".equipment_after_hmr").value) || 0;
  const computedHmr = afterValue - beforeValue;

  row.querySelector(".equipment_hmr").value = computedHmr.toFixed(1);
}

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

  saveState();
}

function toggleRate(button) {
  const rateInput = button.parentElement.querySelector(".daily_rate");
  rateInput.disabled = !rateInput.disabled;
  button.textContent = rateInput.disabled ? "✏️" : "🔒";
  saveState();
}

function getStateFromDom() {
  const manpower = Array.from(document.querySelectorAll(".manpower-row")).map((row) => ({
    name: row.dataset.name,
    role: row.dataset.role,
    work: row.querySelector(".work_hours").value,
    ot: row.querySelector(".ot_hours").value,
    rate: row.querySelector(".daily_rate").value,
    rateLocked: row.querySelector(".daily_rate").disabled,
  }));

  const equipment = Array.from(document.querySelectorAll(".equipment-row")).map((row) => ({
    name: row.querySelector(".equipment_name").value,
    before: row.querySelector(".equipment_before_hmr").value,
    after: row.querySelector(".equipment_after_hmr").value,
  }));

  return {
    date: document.getElementById("date").value,
    volumeCp1: document.getElementById("volume-cp1").value,
    volumeCp2: document.getElementById("volume-cp2").value,
    manpower,
    equipment,
  };
}

function saveState() {
  localStorage.setItem(FORM_STATE_KEY, JSON.stringify(getStateFromDom()));
}

function loadState() {
  const rawState = localStorage.getItem(FORM_STATE_KEY);
  if (!rawState) {
    return;
  }

  try {
    const state = JSON.parse(rawState);

    document.getElementById("date").value = state.date || "";
    document.getElementById("volume-cp1").value = state.volumeCp1 || "";
    document.getElementById("volume-cp2").value = state.volumeCp2 || "";

    const manpowerStateByName = new Map((state.manpower || []).map((row) => [row.name, row]));
    document.querySelectorAll(".manpower-row").forEach((row) => {
      const saved = manpowerStateByName.get(row.dataset.name);
      if (!saved) {
        row.remove();
        return;
      }

      row.querySelector(".work_hours").value = saved.work || "";
      row.querySelector(".ot_hours").value = saved.ot || "";
      row.querySelector(".daily_rate").value = saved.rate || row.querySelector(".daily_rate").value;
      row.querySelector(".daily_rate").disabled = saved.rateLocked !== false;
      row.querySelector("[data-action='toggle']").textContent =
        row.querySelector(".daily_rate").disabled ? "✏️" : "🔒";
    });

    const equipmentList = document.getElementById("equipment-list");
    equipmentList.innerHTML = "";
    const equipmentRows = state.equipment || [];
    if (equipmentRows.length === 0) {
      addEquipmentRow();
      return;
    }

    equipmentRows.forEach((item) => addEquipmentRow(item));

    updateManpowerSelect(document.getElementById("manpower-select"));
  } catch (error) {
    localStorage.removeItem(FORM_STATE_KEY);
  }
}

function buildRecords() {
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
      role: "Equipment",
      name,
      equipment_name: name,
      start_hmr: before,
      end_hmr: after,
      equipment_hmr: hmr,
      volume_cp1: volumeCp1,
      volume_cp2: volumeCp2,
    });
  });

  if ((volumeCp1 || volumeCp2) && records.length === 0) {
    records.push({
      entry_type: "volume",
      date: selectedDate,
      volume_cp1: volumeCp1,
      volume_cp2: volumeCp2,
    });
  }

  return { records, selectedDate };
}

async function postRecords(records) {
  const payload = JSON.stringify(records);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: payload,
    });
  }
}

async function submitData() {
  const status = document.getElementById("status");
  const submitButton = document.getElementById("submit");
  const { records, selectedDate } = buildRecords();

  if (!selectedDate) {
    status.innerText = "Please select a date first.";
    return;
  }

  if (records.length === 0) {
    status.innerText = "No records to submit.";
    return;
  }

  submitButton.disabled = true;
  status.innerText = "Saving...";

  try {
    await postRecords(records);
    status.innerText = "Saved ✅";
    carryForwardEquipmentBeforeValues();
  } catch (error) {
    status.innerText = "Error ❌";
  } finally {
    submitButton.disabled = false;
  }
}
