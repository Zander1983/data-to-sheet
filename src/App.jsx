import React, { useMemo, useState } from "react";
import "./index.css";

const SAMPLE_SEU_DATA = `structured collected data goes here`;

function parseNumber(value) {
  if (!value) return "";
  const cleaned = String(value).replace(/[€,]/g, "").trim();
  if (cleaned === "-" || cleaned === "") return "";
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : "";
}

function getLightType(description) {
  const d = description.toLowerCase();
  if (d.includes("led")) return "LED";
  if (
    d.includes("fluor") ||
    d.includes("t8") ||
    d.includes("t5") ||
    d.includes("cfl") ||
    d.includes("u tube")
  )
    return "FLUOR";
  if (d.includes("halogen") || d.includes("incandescent"))
    return "Halogen/Incandescent";
  return "Unknown/Unreviewed";
}

function getBallastFactor(lightType) {
  return lightType === "FLUOR" ? 1.05 : 1.0;
}

function parseSEUs(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .slice(1)
    .map((line) => {
      const cols = line.includes("\t") ? line.split("\t") : line.split(/\s{2,}/);

      return {
        floor: cols[0] || "",
        location: cols[1] || "",
        category: cols[2] || "",
        description: cols[3] || "",
        control: cols[4] || "",
        power: parseNumber(cols[5]),
        quantity: parseNumber(cols[6]),
        notes: cols[11] || "",
      };
    })
    .filter(
      (row) =>
        row.category.toLowerCase() === "lighting" &&
        row.description &&
        row.power !== "" &&
        row.quantity !== ""
    );
}

function buildLightingRows(text) {
  return parseSEUs(text).map((row, index) => {
    const lightType = getLightType(row.description);

    return {
      id: index + 1,

      // Auto-filled from data collection workbook
      floor: row.floor,
      location: row.location,
      description: row.description,
      lightType,
      lightingControls: row.control || "",
      noFixtures: "",
      noLampsPerFixture: "",
      noLamps: row.quantity,
      wattsPerLamp: row.power,
      ballastFactor: getBallastFactor(lightType),

      // Left for auditor / Inputs sheet
      electricalLoadFormula: "=No. Lamps × Watts per Lamp / 1000",
      annualOperatingHours: "From Inputs tab",
      lightingControlFactor: "",
      loadFactor: "",
      annualConsumptionFormula:
        "=Electrical Load × Annual Operating Hours × Ballast Factor × Load Factor",
      annualCostFormula: "=Annual Consumption × Electricity Price",

      // Upgrade judgement fields
      proposedUpgrade: "",
      wattsPerFitting: "",
      upgradedNoFixtures: "",
      upgradedConsumptionFormula:
        "=Watts/fitting × No. Fixtures × Annual Operating Hours / 1000",
      upgradedCostFormula: "=Upgraded Annual Consumption × Electricity Price",
      annualSavingsKwhFormula:
        "=Annual Consumption - Upgraded Annual Consumption",
      annualSavingsEuroFormula: "=Annual Cost - Upgraded Annual Cost",

      // Costing fields
      unitCost: "",
      stripOutUnit: "",
      installUnit: "",
      testingUnit: "",
      supplyCostFormula: "=Unit Cost × No. Fixtures",
      stripInstallTestFormula:
        "=(Strip Out + Install + Testing) × No. Fixtures",
      overheadProfitFormula: "=Supply Cost × OH&P %",
      totalCostFormula:
        "=Supply Cost + Strip Out/Install/Test Cost + OH&P",

      currentWattageFormula: "=No. Lamps × Watts per Lamp",
      upgradedWattageFormula: "=No. Fixtures × Watts/fitting",
      percentReductionFormula:
        "=(Current Wattage - Upgraded Wattage) / Current Wattage",
    };
  });
}

const HEADINGS = [
  "Floor",
  "Location",
  "Description",
  "Light Type",
  "Lighting Controls",
  "No. Fixtures",
  "No. Lamps per Fixture",
  "No. Lamps",
  "Watts per Lamp",
  "Electrical Load",
  "Annual Operating Hours",
  "Lamp Type Ballast Factor",
  "Lighting Control Factor",
  "Load Factor",
  "Annual Consumption",
  "Annual Cost",
  "Proposed Upgraded Fitting Description",
  "Watts /fitting",
  "No. Fixtures",
  "Annual Consumption",
  "Annual Cost",
  "Annual Savings",
  "Annual Savings (€)",
  "Unit (€/unit)",
  "Existing Unit Strip Out (€/unit)",
  "New Unit Install (€/unit)",
  "Testing & Commissioning (€/unit)",
  "Supply Cost (€)",
  "Strip Out, Install, & Test Cost (€)",
  "Overhead & Profit (OH&P) (€)",
  "Total Cost (€)",
  "Current Total Wattage (W)",
  "Upgraded Total Wattage (W)",
  "% Reduction",
];

const MAPPED_SHEETS = [
  { sheet: "Lighting", source: "Item Category = Lighting", status: "Working demo" },
  { sheet: "Elec Load", source: "ICT / Electrical / Security / Refrigeration", status: "Placeholder" },
  { sheet: "Ther Load", source: "Boiler / HVAC / Water Heating / RAD", status: "Placeholder" },
  { sheet: "Openings", source: "Windows / Doors / Rooflights", status: "Placeholder" },
  { sheet: "Fabric", source: "Walls / Roof / Floor / Dims LBH", status: "Placeholder" },
  { sheet: "HVAC", source: "HVAC / AHU / AC units", status: "Placeholder" },
  { sheet: "Pumps", source: "Motors/Drives/Pumps", status: "Placeholder" },
  { sheet: "EV Charging", source: "EV Infrastructure / EV chargers", status: "Placeholder" },
  { sheet: "Solar PV", source: "Solar PV / Renewables", status: "Placeholder" },
  { sheet: "Metering", source: "Meter information", status: "Placeholder" },
];

export default function App() {
  const [input, setInput] = useState(SAMPLE_SEU_DATA);
  const rows = useMemo(() => buildLightingRows(input), [input]);
  function copyLightingTable() {
  const header = HEADINGS.join("\t");

  const body = rows
    .map((r) =>
      [
        r.floor,
        r.location,
        r.description,
        r.lightType,
        r.lightingControls,
        r.noFixtures || "manual",
        r.noLampsPerFixture || "manual",
        r.noLamps,
        r.wattsPerLamp,
        r.electricalLoadFormula,
        r.annualOperatingHours,
        r.ballastFactor,
        r.lightingControlFactor || "manual",
        r.loadFactor || "manual",
        r.annualConsumptionFormula,
        r.annualCostFormula,
        r.proposedUpgrade || "manual",
        r.wattsPerFitting || "manual",
        r.upgradedNoFixtures || "manual",
        r.upgradedConsumptionFormula,
        r.upgradedCostFormula,
        r.annualSavingsKwhFormula,
        r.annualSavingsEuroFormula,
        r.unitCost || "manual",
        r.stripOutUnit || "manual",
        r.installUnit || "manual",
        r.testingUnit || "manual",
        r.supplyCostFormula,
        r.stripInstallTestFormula,
        r.overheadProfitFormula,
        r.totalCostFormula,
        r.currentWattageFormula,
        r.upgradedWattageFormula,
        r.percentReductionFormula,
      ].join("\t")
    )
    .join("\n");

  navigator.clipboard.writeText(`${header}\n${body}`);
  alert("Lighting table copied. You can paste it into Excel.");
}

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold">
            TRESS Demo: SEUs → Worksheets
          </h1>
          <p className="mt-2 text-slate-600">
            This prototype auto-fills the Lighting worksheet structure using data
            already collected during the site visit. Auditor judgement fields are
            left blank, while mechanical calculation fields are shown as formulas.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-semibold">1. Site survey SEU data</h2>
            <textarea
              className="h-80 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-semibold">2. What was automated?</h2>
            <div className="grid grid-cols-2 gap-4">
              <SummaryCard label="Lighting rows found" value={rows.length} />
              <SummaryCard
                label="Fields auto-filled"
                value="Floor, location, description, controls, watts, lamps"
              />
              <SummaryCard
                label="Fields left editable"
                value="Hours, load factor, upgrade, costs"
              />
              <SummaryCard
                label="Calculation fields"
                value="Shown as formulas"
              />
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              This does not replace the audit model. It simply removes duplicate
              typing between the site collection workbook and the Lighting tab.
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              3. Pre-filled Lighting worksheet
            </h2>

            <button
              onClick={copyLightingTable}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Copy table for Excel
            </button>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-300">
            <table className="min-w-[3000px] text-left text-xs">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  {HEADINGS.map((h, index) => (
                    <th key={`${h}-${index}`} className="border border-slate-300 p-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                    <Cell>{r.floor}</Cell>
                    <Cell>{r.location}</Cell>
                    <Cell>{r.description}</Cell>
                    <Cell>{r.lightType}</Cell>
                    <Cell>{r.lightingControls}</Cell>
                    <Cell muted>{r.noFixtures || "manual"}</Cell>
                    <Cell muted>{r.noLampsPerFixture || "manual"}</Cell>
                    <Cell>{r.noLamps}</Cell>
                    <Cell>{r.wattsPerLamp}</Cell>
                    <Cell formula>{r.electricalLoadFormula}</Cell>
                    <Cell muted>{r.annualOperatingHours}</Cell>
                    <Cell>{r.ballastFactor}</Cell>
                    <Cell muted>{r.lightingControlFactor || "manual"}</Cell>
                    <Cell muted>{r.loadFactor || "manual"}</Cell>
                    <Cell formula>{r.annualConsumptionFormula}</Cell>
                    <Cell formula>{r.annualCostFormula}</Cell>
                    <Cell muted>{r.proposedUpgrade || "manual"}</Cell>
                    <Cell muted>{r.wattsPerFitting || "manual"}</Cell>
                    <Cell muted>{r.upgradedNoFixtures || "manual"}</Cell>
                    <Cell formula>{r.upgradedConsumptionFormula}</Cell>
                    <Cell formula>{r.upgradedCostFormula}</Cell>
                    <Cell formula>{r.annualSavingsKwhFormula}</Cell>
                    <Cell formula>{r.annualSavingsEuroFormula}</Cell>
                    <Cell muted>{r.unitCost || "manual"}</Cell>
                    <Cell muted>{r.stripOutUnit || "manual"}</Cell>
                    <Cell muted>{r.installUnit || "manual"}</Cell>
                    <Cell muted>{r.testingUnit || "manual"}</Cell>
                    <Cell formula>{r.supplyCostFormula}</Cell>
                    <Cell formula>{r.stripInstallTestFormula}</Cell>
                    <Cell formula>{r.overheadProfitFormula}</Cell>
                    <Cell formula>{r.totalCostFormula}</Cell>
                    <Cell formula>{r.currentWattageFormula}</Cell>
                    <Cell formula>{r.upgradedWattageFormula}</Cell>
                    <Cell formula>{r.percentReductionFormula}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

<div className="mt-6 rounded-2xl bg-white p-5 shadow">
  <h2 className="mb-4 text-xl font-semibold">
    4. Future mapped audit sheets
  </h2>

  <p className="mb-4 text-sm text-slate-600">
    These are not implemented yet. They show how the same SEU data could later
    populate other audit workbook tabs.
  </p>

  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
    {MAPPED_SHEETS.map((item) => (
      <div
        key={item.sheet}
        className={`rounded-xl border p-4 ${
          item.status === "Working demo"
            ? "border-green-300 bg-green-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="font-semibold">{item.sheet}</div>
        <div className="mt-1 text-sm text-slate-600">{item.source}</div>
        <div className="mt-2 text-xs font-semibold uppercase text-slate-500">
          {item.status}
        </div>
      </div>
    ))}
  </div>
</div>


        </div>

      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-100 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function Cell({ children, muted = false, formula = false }) {
  return (
    <td
      className={`border border-slate-200 p-2 align-top ${
        muted ? "bg-yellow-50 text-slate-500 italic" : ""
      } ${formula ? "bg-blue-50 font-mono text-blue-900" : ""}`}
    >
      {children}
    </td>
  );
}