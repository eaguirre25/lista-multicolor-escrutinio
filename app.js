const TABLE_COUNT = 30;
const STORAGE_KEY = "lista-multicolor-escrutinio-v2";

const provincialOptions = [
  "Lista Celeste/Violeta",
  "Lista Multicolor - Verde/Granate/Rosa/Marron/Fucsia/Lilaroja/Gris",
  "Voto en blanco",
  "Voto impugnados",
  "Voto nulo",
  "Voto recurrido",
];

const seccionalOptions = [
  "Lista Celeste/Violeta/Dorada",
  'Lista Naranja-Marron-Roja-Rosa-Negra-Fucsia "Multicolor"',
  "Voto en blanco",
  "Voto impugnados",
  "Voto nulo",
  "Voto recurrido",
];

const shortLabels = {
  "Total padron": "Padron",
  "Lista Celeste/Violeta": "Celeste-Violeta",
  "Lista Multicolor - Verde/Granate/Rosa/Marron/Fucsia/Lilaroja/Gris": "P Multicolor",
  "Lista Celeste/Violeta/Dorada": "celeste-viol-dor",
  'Lista Naranja-Marron-Roja-Rosa-Negra-Fucsia "Multicolor"': "S Multicolor",
  "Voto en blanco": "Blanco",
  "Voto impugnados": "Impugn.",
  "Voto nulo": "Nulo",
  "Voto recurrido": "Recurr.",
  "Total provincial": "Total P",
  "Total seccional": "Total S",
};

const chartColors = ["#35d07f", "#f43f8f", "#f7f7fb", "#f59e0b", "#ef4444", "#a78bfa"];

const state = {
  tables: createEmptyTables(),
};

const summaryPadron = document.querySelector("#summaryPadron");
const summaryLoaded = document.querySelector("#summaryLoaded");
const summaryProvincial = document.querySelector("#summaryProvincial");
const summarySeccional = document.querySelector("#summarySeccional");
const scrutinyTable = document.querySelector("#scrutinyTable");
const provincialTotalsList = document.querySelector("#provincialTotalsList");
const seccionalTotalsList = document.querySelector("#seccionalTotalsList");
const provincialChart = document.querySelector("#provincialChart");
const seccionalChart = document.querySelector("#seccionalChart");
const lastSaved = document.querySelector("#lastSaved");
const loadStatus = document.querySelector("#loadStatus");

init();

function init() {
  loadStoredState();
  renderSheet();
  loadStatus?.classList.add("is-hidden");
  attachEvents();
  renderAllTotals();
}

function createEmptyTables() {
  return Array.from({ length: TABLE_COUNT }, (_, index) => ({
    number: index + 1,
    padron: 0,
    provincial: Object.fromEntries(provincialOptions.map((name) => [name, 0])),
    seccional: Object.fromEntries(seccionalOptions.map((name) => [name, 0])),
  }));
}

function loadStoredState() {
  const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lista-multicolor-escrutinio-v1");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed.tables)) {
      state.tables = normalizeTables(parsed.tables);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function normalizeTables(tables) {
  return createEmptyTables().map((emptyTable, index) => {
    const source = tables[index] || {};
    return {
      number: index + 1,
      padron: toNumber(source.padron),
      provincial: normalizeVotes(source.provincial, emptyTable.provincial),
      seccional: normalizeVotes(source.seccional, emptyTable.seccional),
    };
  });
}

function normalizeVotes(source = {}, fallback) {
  return Object.fromEntries(
    Object.keys(fallback).map((name) => [name, toNumber(source[name])])
  );
}

function renderSheet() {
  scrutinyTable.innerHTML = "";
  scrutinyTable.append(createColGroup(), createTableHead(), createTableBody(), createTableFoot());
}

function createColGroup() {
  const colgroup = document.createElement("colgroup");
  const classes = [
    "mesa-col",
    "padron-col",
    ...Array(provincialOptions.length).fill("vote-col"),
    "total-col",
    ...Array(seccionalOptions.length).fill("vote-col"),
    "total-col",
  ];

  classes.forEach((className) => {
    const col = document.createElement("col");
    col.className = className;
    colgroup.append(col);
  });

  return colgroup;
}

function createTableHead() {
  const thead = document.createElement("thead");
  const groupRow = document.createElement("tr");
  const labelRow = document.createElement("tr");

  [
    ["Mesa", 1, 2],
    ["Total padron", 1, 2],
    ["Nivel provincial", provincialOptions.length + 1, 1],
    ["Nivel seccional", seccionalOptions.length + 1, 1],
  ].forEach(([label, colspan, rowspan]) => {
    const th = document.createElement("th");
    th.textContent = label;
    th.colSpan = colspan;
    th.rowSpan = rowspan;
    th.className = label.includes("provincial") ? "group provincial-group" : label.includes("seccional") ? "group seccional-group" : "";
    groupRow.append(th);
  });

  [...provincialOptions, "Total provincial", ...seccionalOptions, "Total seccional"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = shortLabels[label] || label;
    th.title = label;
    labelRow.append(th);
  });

  thead.append(groupRow, labelRow);
  return thead;
}

function createTableBody() {
  const tbody = document.createElement("tbody");

  state.tables.forEach((table) => {
    const row = document.createElement("tr");
    row.append(createMesaCell(table.number));
    row.append(createInputCell("padron", table.number, "padron", table.padron));

    provincialOptions.forEach((option) => {
      row.append(createInputCell("provincial", table.number, option, table.provincial[option]));
    });
    row.append(createRowTotalCell("provincial", table));

    seccionalOptions.forEach((option) => {
      row.append(createInputCell("seccional", table.number, option, table.seccional[option]));
    });
    row.append(createRowTotalCell("seccional", table));

    tbody.append(row);
  });

  return tbody;
}

function createTableFoot() {
  const tfoot = document.createElement("tfoot");
  const row = document.createElement("tr");
  const label = document.createElement("td");
  label.textContent = "Totales";
  row.append(label);

  const padron = document.createElement("td");
  padron.dataset.total = "padron";
  row.append(padron);

  provincialOptions.forEach((option) => {
    const cell = document.createElement("td");
    cell.dataset.totalLevel = "provincial";
    cell.dataset.totalOption = option;
    row.append(cell);
  });

  const provincialTotal = document.createElement("td");
  provincialTotal.dataset.totalVotes = "provincial";
  row.append(provincialTotal);

  seccionalOptions.forEach((option) => {
    const cell = document.createElement("td");
    cell.dataset.totalLevel = "seccional";
    cell.dataset.totalOption = option;
    row.append(cell);
  });

  const seccionalTotal = document.createElement("td");
  seccionalTotal.dataset.totalVotes = "seccional";
  row.append(seccionalTotal);

  tfoot.append(row);
  return tfoot;
}

function createMesaCell(number) {
  const cell = document.createElement("td");
  cell.className = "mesa-cell";
  cell.textContent = `Mesa ${number}`;
  return cell;
}

function createInputCell(level, tableNumber, option, value) {
  const cell = document.createElement("td");
  cell.className = "input-cell";
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.inputMode = "numeric";
  input.value = value || "";
  input.dataset.level = level;
  input.dataset.table = String(tableNumber);
  input.dataset.option = option;
  input.setAttribute("aria-label", `${option} mesa ${tableNumber}`);
  cell.append(input);
  return cell;
}

function createRowTotalCell(level, table) {
  const totalCell = document.createElement("td");
  totalCell.className = "row-total";
  totalCell.dataset.level = level;
  totalCell.dataset.table = String(table.number);
  totalCell.textContent = formatNumber(sumValues(table[level]));
  return totalCell;
}

function attachEvents() {
  document.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-level]");
    if (!input) return;

    updateStateFromInput(input);
    renderAllTotals();
    autoPersist();
  });

  document.querySelector("#saveButton").addEventListener("click", () => {
    persist("Guardado");
  });

  document.querySelector("#clearButton").addEventListener("click", () => {
    const confirmed = confirm("Esto vacia las 30 mesas cargadas. Continuar?");
    if (!confirmed) return;
    state.tables = createEmptyTables();
    localStorage.removeItem(STORAGE_KEY);
    renderSheet();
    renderAllTotals();
    lastSaved.textContent = "Datos vaciados";
  });

  document.querySelector("#exportCsvButton").addEventListener("click", exportCsv);
}

function updateStateFromInput(input) {
  const table = state.tables[Number(input.dataset.table) - 1];
  const value = toNumber(input.value);

  if (input.dataset.level === "padron") {
    table.padron = value;
    mirrorPadronInput(input.dataset.table, value, input);
    return;
  }

  table[input.dataset.level][input.dataset.option] = value;
  updateRowTotal(input.dataset.level, input.dataset.table);
}

function mirrorPadronInput(tableNumber, value, changedInput) {
  document.querySelectorAll(`input[data-level="padron"][data-table="${tableNumber}"]`).forEach((input) => {
    if (input !== changedInput) input.value = value || "";
  });
}

function updateRowTotal(level, tableNumber) {
  const table = state.tables[Number(tableNumber) - 1];
  document.querySelectorAll(`.row-total[data-level="${level}"][data-table="${tableNumber}"]`).forEach((cell) => {
    cell.textContent = formatNumber(sumValues(table[level]));
  });
}

function renderAllTotals() {
  state.tables.forEach((table) => {
    updateRowTotal("provincial", table.number);
    updateRowTotal("seccional", table.number);
  });

  const totals = getAccumulatedTotals();
  summaryPadron.textContent = formatNumber(totals.padron);
  summaryLoaded.textContent = `${totals.loaded}/${TABLE_COUNT}`;
  summaryProvincial.textContent = formatNumber(sumValues(totals.provincial));
  summarySeccional.textContent = formatNumber(sumValues(totals.seccional));

  renderTableFooter("provincial", totals);
  renderTableFooter("seccional", totals);
  renderTotalsList(provincialTotalsList, totals.provincial);
  renderTotalsList(seccionalTotalsList, totals.seccional);
  renderChart(provincialChart, totals.provincial);
  renderChart(seccionalChart, totals.seccional);
}

function renderTableFooter(level, totals) {
  document.querySelectorAll(`[data-total="padron"]`).forEach((cell) => {
    cell.textContent = formatNumber(totals.padron);
  });

  document.querySelectorAll(`[data-total-level="${level}"]`).forEach((cell) => {
    cell.textContent = formatNumber(totals[level][cell.dataset.totalOption]);
  });

  const totalVotes = document.querySelector(`[data-total-votes="${level}"]`);
  if (totalVotes) totalVotes.textContent = formatNumber(sumValues(totals[level]));
}

function renderTotalsList(container, totals) {
  container.innerHTML = "";
  getRankedEntries(totals).forEach(([label, value], index) => {
    const row = document.createElement("div");
    row.className = `total-row${index === 0 && value > 0 ? " is-leading" : ""}`;
    row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${formatNumber(value)}</strong>`;
    container.append(row);
  });
}

function renderChart(container, totals) {
  const totalVotes = sumValues(totals);
  container.innerHTML = "";
  const rankedEntries = getRankedEntries(totals);
  const slices = [];
  let start = 0;

  rankedEntries.forEach(([, value], index) => {
    const percent = totalVotes > 0 ? (value / totalVotes) * 100 : 0;
    const end = start + percent;
    const color = chartColors[index % chartColors.length];
    if (percent > 0) {
      slices.push(`${color} ${start}% ${end}%`);
    }
    start = end;
  });

  const pie = document.createElement("div");
  pie.className = "pie";
  pie.style.background = totalVotes > 0
    ? `conic-gradient(${slices.join(", ")})`
    : "conic-gradient(#2a2f3a 0% 100%)";
  pie.innerHTML = `<span>${formatNumber(totalVotes)}</span>`;

  const legend = document.createElement("div");
  legend.className = "pie-legend";

  rankedEntries.forEach(([label, value], index) => {
    const percent = totalVotes > 0 ? (value / totalVotes) * 100 : 0;
    const row = document.createElement("div");
    row.className = `legend-row${index === 0 && value > 0 ? " is-leading" : ""}`;
    row.innerHTML = `
      <span class="swatch" style="background:${chartColors[index % chartColors.length]}"></span>
      <span class="legend-label">${escapeHtml(label)}</span>
      <strong>${formatNumber(value)} · ${percent.toFixed(1)}%</strong>
    `;
    legend.append(row);
  });

  container.append(pie, legend);
}

function getRankedEntries(totals) {
  return Object.entries(totals)
    .map(([label, value], index) => ({ label, value: toNumber(value), index }))
    .sort((a, b) => (b.value - a.value) || (a.index - b.index))
    .map(({ label, value }) => [label, value]);
}

function getAccumulatedTotals() {
  const totals = {
    padron: 0,
    loaded: 0,
    provincial: Object.fromEntries(provincialOptions.map((name) => [name, 0])),
    seccional: Object.fromEntries(seccionalOptions.map((name) => [name, 0])),
  };

  state.tables.forEach((table) => {
    totals.padron += table.padron;
    if (isTableLoaded(table)) totals.loaded += 1;
    provincialOptions.forEach((name) => {
      totals.provincial[name] += table.provincial[name] || 0;
    });
    seccionalOptions.forEach((name) => {
      totals.seccional[name] += table.seccional[name] || 0;
    });
  });

  return totals;
}

function isTableLoaded(table) {
  return table.padron > 0 || sumValues(table.provincial) > 0 || sumValues(table.seccional) > 0;
}

function autoPersist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables: state.tables, savedAt: new Date().toISOString() }));
  lastSaved.textContent = "Guardado automaticamente";
}

function persist(prefix) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables: state.tables, savedAt: new Date().toISOString() }));
  lastSaved.textContent = `${prefix} ${new Date().toLocaleString("es-AR")}`;
}

function exportCsv() {
  const headers = [
    "mesa",
    "total_padron",
    ...provincialOptions.map((name) => `provincial_${name}`),
    "provincial_total",
    ...seccionalOptions.map((name) => `seccional_${name}`),
    "seccional_total",
  ];

  const rows = state.tables.map((table) => [
    table.number,
    table.padron,
    ...provincialOptions.map((name) => table.provincial[name]),
    sumValues(table.provincial),
    ...seccionalOptions.map((name) => table.seccional[name]),
    sumValues(table.seccional),
  ]);

  downloadFile(
    "escrutinio-lista-multicolor.csv",
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"),
    "text/csv;charset=utf-8"
  );
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sumValues(values) {
  return Object.values(values).reduce((total, value) => total + toNumber(value), 0);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
