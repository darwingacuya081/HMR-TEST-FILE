const API_URL =
  "https://script.google.com/macros/s/AKfycbznSjat0-YZA-V_5ObEix3yhTdfAmSWZOjHpddtTtA2o7B1nQWmY8gnirIj173YTQfXBQ/exec";
const MASTER_URL = `${API_URL}?mode=master`;
const FORM_STATE_KEY = "hmr-form-state-v2";

let masterManpower = [];
let masterEquipment = [];

function initApp() {
  if (window.__hmrInitialized) {
    return;
  }
  window.__hmrInitialized = true;

  document.getElementById("submit").addEventListener("click", submitData);
  document.body.addEventListener("input", saveState);
  document.body.addEventListener("change", saveState);

  loadMasterData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

async function loadMasterData() {
  const status = document.getElementById("status");

  try {
    const response = await fetch(MASTER_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    masterManpower = Array.isArray(payload.manpower) ? payload.manpower : [];
    masterEquipment = Array.isArray(payload.equipment) ? payload.equipment : [];

    renderRoles();
    renderEquipmentControls();
    loadState();
  } catch (error) {
    status.innerText = "Failed to load master data. Please refresh.";
  }
}

function renderRoles() {
  const rolesContainer = document.getElementById("roles");
  rolesContainer.innerHTML = "";

  const roles = [...new Set(masterManpower.map((entry) => entry.role))];

  roles.forEach((role) => {
    const box = document.createElement("div");
    box.className = "role-box";
    box.innerHTML = `
      <div class="manpower-controls" data-role="${role}">
        <h3>${role}</h3>
        <label class="sr-only" for="manpower-select-${role}">Add manpower</label>
        <select id="manpower-select-${role}" aria-label="Available manpower"></select>
        <button type="button" class="add-btn" data-action="add-manpower" data-role="${role}">
          + Add ${role}
        </button>
      </div>
    `;

    const list = document.createElement("div");
    list.dataset.role = role;

    box.appendChild(list);
    rolesContainer.appendChild(box);
  });

  document.querySelectorAll("[data-action='add-manpower']").forEach((button) => {
    button.addEventListener("click", () => {
      const role = button.dataset.role;
      const select = document.getElementById(`manpower-select-${role}`);
      const selectedName = select.value;
      if (!selectedName) {
        return;
      }

      addManpowerByName(selectedName);
      updateManpowerSelects();
      saveState();
    });
  });

  updateManpowerSelects();
}

function renderEquipmentControls() {
  const equipmentSelect = document.getElementById("equipment-select");
  const addEquipmentButton = document.getElementById("add-equipment");

  addEquipmentButton.addEventListener("click", () => {
    const selectedEquipment = equipmentSelect.value;
    addEquipmentRow({ name: selectedEquipment || "" });
    saveState();
    updateEquipmentSelect(equipmentSelect);
  });

  updateEquipmentSelect(equipmentSelect);
}

function addManpowerRow(container, data, savedValues = {}) {
  const row = document.createElement("div");
  row.className = "manpower-row";
  row.dataset.name = data.name;
  row.dataset.role = data.role;

  row.innerHTML = `
    <strong>${data.name}</strong>
    <input type="number" class="work_hours" placeholder="Work" step="0.1" />
    <input type="number" class="ot_hours" placeholder="OT" step="0.1" />
    <input type="number" class="daily_rate" value="${data.rate ?? ""}" disabled />
    <button type="button" class="add-btn" data-action="toggle">✏️</button>
    <button type="button" class="remove-btn" data-action="remove">❌</button>
  `;

  row.querySelector(".work_hours").value = savedValues.work || "";
  row.querySelector(".ot_hours").value = savedValues.ot || "";
  row.querySelector(".daily_rate").value = savedValues.rate ?? data.rate ?? "";
  row.querySelector(".daily_rate").disabled = savedValues.rateLocked !== false;
  row.querySelector("[data-action='toggle']").textContent =
    row.querySelector(".daily_rate").disabled ? "✏️" : "🔒";

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
      updateManpowerSelects();
    }
  });

  container.appendChild(row);
}

function addManpowerByName(name, savedValues = {}) {
  const data = masterManpower.find((entry) => entry.name === name);
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

  addManpowerRow(list, data, savedValues);
}

function updateManpowerSelects() {
  const existingNames = new Set(
    Array.from(document.querySelectorAll(".manpower-row")).map((row) => row.dataset.name)
  );

  document.querySelectorAll("[id^='manpower-select-']").forEach((select) => {
    const role = select.id.replace("manpower-select-", "");
    const availableNames = masterManpower.filter(
      (entry) => entry.role === role && !existingNames.has(entry.name)
    );

    select.innerHTML = "";

    if (availableNames.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = `All ${role} added`;
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    availableNames.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.name;
      option.textContent = entry.name;
      select.appendChild(option);
    });

    select.disabled = false;
  });
}

function updateEquipmentSelect(select) {
  if (!select) {
    return;
  }

  const existingEquipment = new Set(
    Array.from(document.querySelectorAll(".equipment-row")).map((row) =>
      row.querySelector(".equipment_name").value.trim()
    )
  );

  select.innerHTML = "";

  const available = masterEquipment.filter((name) => !existingEquipment.has(name));
  if (available.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "All equipment added";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  available.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
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
      updateEquipmentSelect(document.getElementById("equipment-select"));
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
    updateManpowerSelects();
    updateEquipmentSelect(document.getElementById("equipment-select"));
    return;
  }

  try {
    const state = JSON.parse(rawState);

    document.getElementById("date").value = state.date || "";
    document.getElementById("volume-cp1").value = state.volumeCp1 || "";
    document.getElementById("volume-cp2").value = state.volumeCp2 || "";

    document.querySelectorAll(".manpower-row").forEach((row) => row.remove());
    (state.manpower || []).forEach((saved) => addManpowerByName(saved.name, saved));

    const equipmentList = document.getElementById("equipment-list");
    equipmentList.innerHTML = "";
    const equipmentRows = state.equipment || [];
    if (equipmentRows.length === 0) {
      return;
    }

    equipmentRows.forEach((item) => addEquipmentRow(item));
  } catch (error) {
    localStorage.removeItem(FORM_STATE_KEY);
  }

  updateManpowerSelects();
  updateEquipmentSelect(document.getElementById("equipment-select"));
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
