const MANPOWER_NAMES = [
  "Aaron Ramos",
  "Bianca Cruz",
  "Carlo Dela Cruz",
  "Diane Santos",
  "Elliot Garcia",
  "Francis Lopez",
  "Grace Navarro",
  "Hannah Reyes",
];

const DAILY_RATE_KEY = "hmr-daily-rate";

document.addEventListener("DOMContentLoaded", () => {
  const dailyRateInput = document.querySelector("#daily-rate");
  const manpowerSelect = document.querySelector("#manpower-select");
  const manpowerBody = document.querySelector("#manpower-body");
  const equipmentBody = document.querySelector("#equipment-body");
  const addManpowerButton = document.querySelector("#add-manpower");
  const addEquipmentButton = document.querySelector("#add-equipment");

  // Load saved daily rate (persists until changed).
  const savedRate = localStorage.getItem(DAILY_RATE_KEY);
  if (savedRate) {
    dailyRateInput.value = savedRate;
  }

  dailyRateInput.addEventListener("input", () => {
    localStorage.setItem(DAILY_RATE_KEY, dailyRateInput.value);
  });

  // Initialize manpower options and starter rows.
  const initialManpower = [MANPOWER_NAMES[0], MANPOWER_NAMES[1]];
  initialManpower.forEach((name) => addManpowerRow(name, manpowerBody));
  updateManpowerSelect(manpowerSelect, manpowerBody);

  addManpowerButton.addEventListener("click", () => {
    const selectedName = manpowerSelect.value;
    if (!selectedName) {
      return;
    }
    addManpowerRow(selectedName, manpowerBody);
    updateManpowerSelect(manpowerSelect, manpowerBody);
  });

  manpowerBody.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.action === "remove") {
      const row = target.closest("tr");
      if (row) {
        row.remove();
        updateManpowerSelect(manpowerSelect, manpowerBody);
      }
    }
  });

  // Equipment rows can be freely added/removed.
  addEquipmentButton.addEventListener("click", () => {
    addEquipmentRow(equipmentBody);
  });

  equipmentBody.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.action === "remove") {
      const row = target.closest("tr");
      if (row) {
        row.remove();
      }
    }
  });

  // Start with one empty equipment row for convenience.
  addEquipmentRow(equipmentBody);
});

function addManpowerRow(name, tableBody) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>
      <input type="number" min="0" step="0.25" placeholder="0" aria-label="Work hours" />
    </td>
    <td>
      <input type="number" min="0" step="0.25" placeholder="0" aria-label="OT hours" />
    </td>
    <td>
      <button type="button" class="button--danger" data-action="remove">Remove</button>
    </td>
  `;
  tableBody.appendChild(row);
}

function updateManpowerSelect(select, tableBody) {
  const existingNames = Array.from(tableBody.querySelectorAll("tr td:first-child"))
    .map((cell) => cell.textContent.trim());
  const availableNames = MANPOWER_NAMES.filter((name) => !existingNames.includes(name));

  select.innerHTML = "";

  if (availableNames.length === 0) {
    const option = document.createElement("option");
    option.textContent = "All manpower added";
    option.value = "";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  availableNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
  select.disabled = false;
}

function addEquipmentRow(tableBody) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>
      <input type="text" placeholder="Equipment name" aria-label="Equipment name" />
    </td>
    <td>
      <input type="number" min="0" step="1" placeholder="0" aria-label="Equipment quantity" />
    </td>
    <td>
      <input type="number" min="0" step="0.5" placeholder="0" aria-label="Equipment hours" />
    </td>
    <td>
      <button type="button" class="button--danger" data-action="remove">Remove</button>
    </td>
  `;
  tableBody.appendChild(row);
}
