import { useCallback, useState } from "react";

// ─────────────────────────────────────────────
// CONSTANTS & SHARED STYLES
// ─────────────────────────────────────────────
const ELECTRICITY_PRICE = 0.13;
const PROVINCES = ["BC", "AB", "ON", "QC", "MB", "SK", "NS", "OTHER"];
const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#0d1117",
  border: "1px solid #1e293b",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
  appearance: "none",
};

// ─────────────────────────────────────────────
// REGIONAL DATA
// ─────────────────────────────────────────────
const REGIONAL_DATA = {
  BC: { fuelPrice: 1.85, insuranceMultiplier: 1.25, evIncentive: 4000 },
  AB: { fuelPrice: 1.45, insuranceMultiplier: 1.1, evIncentive: 0 },
  ON: { fuelPrice: 1.6, insuranceMultiplier: 1.35, evIncentive: 5000 },
  QC: { fuelPrice: 1.65, insuranceMultiplier: 1.05, evIncentive: 7000 },
  MB: { fuelPrice: 1.5, insuranceMultiplier: 1.0, evIncentive: 2500 },
  SK: { fuelPrice: 1.48, insuranceMultiplier: 1.0, evIncentive: 0 },
  NS: { fuelPrice: 1.72, insuranceMultiplier: 1.1, evIncentive: 3000 },
  OTHER: { fuelPrice: 1.6, insuranceMultiplier: 1.1, evIncentive: 2000 },
};

// ─────────────────────────────────────────────
// VEHICLE DATASET — 45 vehicles
// ─────────────────────────────────────────────
const D = [
  { id: 1, make: "Toyota", model: "Camry", year: 2024, trim: "LE", msrp: 32000, fuelType: "gas", fuelEcon: 8.1, reliabilityIndex: 88, maintenanceCostYear: 800, insuranceBaseYear: 1800, depreciationRate: 0.38, awd: false, safetyRating: 5, featureScore: 72, recallScore: 88, techMaturity: 85, bodyType: "sedan", marketDemand: 82 },
  { id: 2, make: "Toyota", model: "RAV4", year: 2024, trim: "XLE", msrp: 38500, fuelType: "gas", fuelEcon: 8.7, reliabilityIndex: 86, maintenanceCostYear: 900, insuranceBaseYear: 1950, depreciationRate: 0.36, awd: true, safetyRating: 5, featureScore: 78, recallScore: 85, techMaturity: 84, bodyType: "suv", marketDemand: 90 },
  { id: 3, make: "Toyota", model: "RAV4 Hybrid", year: 2024, trim: "XLE", msrp: 43500, fuelType: "hybrid", fuelEcon: 6.0, reliabilityIndex: 87, maintenanceCostYear: 850, insuranceBaseYear: 2000, depreciationRate: 0.30, awd: true, safetyRating: 5, featureScore: 82, recallScore: 87, techMaturity: 88, bodyType: "suv", marketDemand: 91 },
  { id: 4, make: "Honda", model: "Civic", year: 2024, trim: "Sport", msrp: 29500, fuelType: "gas", fuelEcon: 7.4, reliabilityIndex: 85, maintenanceCostYear: 750, insuranceBaseYear: 1650, depreciationRate: 0.40, awd: false, safetyRating: 5, featureScore: 70, recallScore: 84, techMaturity: 82, bodyType: "sedan", marketDemand: 80 },
  { id: 5, make: "Honda", model: "CR-V", year: 2024, trim: "EX", msrp: 37200, fuelType: "gas", fuelEcon: 8.5, reliabilityIndex: 83, maintenanceCostYear: 880, insuranceBaseYear: 1900, depreciationRate: 0.38, awd: true, safetyRating: 5, featureScore: 75, recallScore: 83, techMaturity: 81, bodyType: "suv", marketDemand: 85 },
  { id: 6, make: "Honda", model: "CR-V Hybrid", year: 2024, trim: "Sport", msrp: 41800, fuelType: "hybrid", fuelEcon: 6.2, reliabilityIndex: 84, maintenanceCostYear: 830, insuranceBaseYear: 1950, depreciationRate: 0.32, awd: true, safetyRating: 5, featureScore: 79, recallScore: 85, techMaturity: 85, bodyType: "suv", marketDemand: 86 },
  { id: 7, make: "Tesla", model: "Model 3", year: 2024, trim: "RWD", msrp: 52000, fuelType: "ev", fuelEcon: 14.5, reliabilityIndex: 72, maintenanceCostYear: 550, insuranceBaseYear: 2600, depreciationRate: 0.42, awd: false, safetyRating: 5, featureScore: 92, recallScore: 68, techMaturity: 90, bodyType: "sedan", marketDemand: 78 },
  { id: 8, make: "Tesla", model: "Model Y", year: 2024, trim: "AWD", msrp: 62000, fuelType: "ev", fuelEcon: 16.8, reliabilityIndex: 70, maintenanceCostYear: 600, insuranceBaseYear: 2800, depreciationRate: 0.44, awd: true, safetyRating: 5, featureScore: 94, recallScore: 65, techMaturity: 90, bodyType: "suv", marketDemand: 82 },
  { id: 9, make: "Hyundai", model: "Tucson", year: 2024, trim: "Preferred", msrp: 34500, fuelType: "gas", fuelEcon: 8.9, reliabilityIndex: 78, maintenanceCostYear: 920, insuranceBaseYear: 1850, depreciationRate: 0.42, awd: true, safetyRating: 5, featureScore: 76, recallScore: 78, techMaturity: 79, bodyType: "suv", marketDemand: 74 },
  { id: 10, make: "Hyundai", model: "Ioniq 6", year: 2024, trim: "Standard", msrp: 48500, fuelType: "ev", fuelEcon: 14.0, reliabilityIndex: 75, maintenanceCostYear: 500, insuranceBaseYear: 2400, depreciationRate: 0.45, awd: false, safetyRating: 5, featureScore: 88, recallScore: 76, techMaturity: 85, bodyType: "sedan", marketDemand: 72 },
  { id: 11, make: "Mazda", model: "CX-5", year: 2024, trim: "GS", msrp: 36000, fuelType: "gas", fuelEcon: 9.2, reliabilityIndex: 86, maintenanceCostYear: 860, insuranceBaseYear: 1820, depreciationRate: 0.37, awd: true, safetyRating: 5, featureScore: 80, recallScore: 86, techMaturity: 78, bodyType: "suv", marketDemand: 82 },
  { id: 12, make: "Mazda", model: "3", year: 2024, trim: "GT", msrp: 30000, fuelType: "gas", fuelEcon: 7.8, reliabilityIndex: 87, maintenanceCostYear: 780, insuranceBaseYear: 1700, depreciationRate: 0.39, awd: false, safetyRating: 5, featureScore: 78, recallScore: 88, techMaturity: 78, bodyType: "sedan", marketDemand: 76 },
  { id: 13, make: "Subaru", model: "Forester", year: 2024, trim: "Convenience", msrp: 35000, fuelType: "gas", fuelEcon: 9.8, reliabilityIndex: 82, maintenanceCostYear: 950, insuranceBaseYear: 1880, depreciationRate: 0.36, awd: true, safetyRating: 5, featureScore: 73, recallScore: 80, techMaturity: 75, bodyType: "suv", marketDemand: 78 },
  { id: 14, make: "Subaru", model: "Outback", year: 2024, trim: "Touring", msrp: 40500, fuelType: "gas", fuelEcon: 10.1, reliabilityIndex: 81, maintenanceCostYear: 980, insuranceBaseYear: 1920, depreciationRate: 0.35, awd: true, safetyRating: 5, featureScore: 77, recallScore: 80, techMaturity: 76, bodyType: "suv", marketDemand: 80 },
  { id: 15, make: "Ford", model: "Escape", year: 2023, trim: "SEL", msrp: 31000, fuelType: "gas", fuelEcon: 9.0, reliabilityIndex: 72, maintenanceCostYear: 1050, insuranceBaseYear: 1780, depreciationRate: 0.46, awd: true, safetyRating: 4, featureScore: 70, recallScore: 70, techMaturity: 75, bodyType: "suv", marketDemand: 70 },
  { id: 16, make: "Kia", model: "Sportage", year: 2024, trim: "EX", msrp: 35500, fuelType: "gas", fuelEcon: 9.1, reliabilityIndex: 79, maintenanceCostYear: 900, insuranceBaseYear: 1860, depreciationRate: 0.41, awd: true, safetyRating: 5, featureScore: 78, recallScore: 79, techMaturity: 80, bodyType: "suv", marketDemand: 75 },
  { id: 17, make: "Kia", model: "EV6", year: 2024, trim: "Standard", msrp: 49500, fuelType: "ev", fuelEcon: 15.0, reliabilityIndex: 76, maintenanceCostYear: 520, insuranceBaseYear: 2500, depreciationRate: 0.43, awd: false, safetyRating: 5, featureScore: 89, recallScore: 76, techMaturity: 86, bodyType: "suv", marketDemand: 74 },
  { id: 18, make: "Toyota", model: "Corolla", year: 2022, trim: "LE", msrp: 22000, fuelType: "gas", fuelEcon: 7.9, reliabilityIndex: 89, maintenanceCostYear: 720, insuranceBaseYear: 1550, depreciationRate: 0.30, awd: false, safetyRating: 5, featureScore: 65, recallScore: 90, techMaturity: 82, bodyType: "sedan", marketDemand: 84 },
  { id: 19, make: "Honda", model: "Civic", year: 2022, trim: "LX", msrp: 21000, fuelType: "gas", fuelEcon: 7.6, reliabilityIndex: 86, maintenanceCostYear: 730, insuranceBaseYear: 1580, depreciationRate: 0.32, awd: false, safetyRating: 5, featureScore: 62, recallScore: 85, techMaturity: 80, bodyType: "sedan", marketDemand: 81 },
  { id: 20, make: "Toyota", model: "RAV4", year: 2022, trim: "XLE", msrp: 31000, fuelType: "gas", fuelEcon: 8.9, reliabilityIndex: 85, maintenanceCostYear: 880, insuranceBaseYear: 1880, depreciationRate: 0.28, awd: true, safetyRating: 5, featureScore: 72, recallScore: 86, techMaturity: 82, bodyType: "suv", marketDemand: 89 },
  { id: 21, make: "Hyundai", model: "Elantra", year: 2024, trim: "Preferred", msrp: 26500, fuelType: "gas", fuelEcon: 7.2, reliabilityIndex: 80, maintenanceCostYear: 780, insuranceBaseYear: 1620, depreciationRate: 0.43, awd: false, safetyRating: 5, featureScore: 74, recallScore: 79, techMaturity: 80, bodyType: "sedan", marketDemand: 72 },
  { id: 22, make: "Volkswagen", model: "Golf", year: 2024, trim: "Comfortline", msrp: 31500, fuelType: "gas", fuelEcon: 7.8, reliabilityIndex: 74, maintenanceCostYear: 1100, insuranceBaseYear: 1750, depreciationRate: 0.44, awd: false, safetyRating: 5, featureScore: 79, recallScore: 72, techMaturity: 77, bodyType: "sedan", marketDemand: 68 },
  { id: 23, make: "Chevrolet", model: "Equinox EV", year: 2024, trim: "RS", msrp: 46000, fuelType: "ev", fuelEcon: 17.0, reliabilityIndex: 68, maintenanceCostYear: 580, insuranceBaseYear: 2300, depreciationRate: 0.48, awd: false, safetyRating: 5, featureScore: 82, recallScore: 64, techMaturity: 72, bodyType: "suv", marketDemand: 70 },
  { id: 24, make: "Mazda", model: "CX-50", year: 2024, trim: "GS-L", msrp: 42000, fuelType: "gas", fuelEcon: 9.8, reliabilityIndex: 84, maintenanceCostYear: 900, insuranceBaseYear: 1900, depreciationRate: 0.38, awd: true, safetyRating: 5, featureScore: 82, recallScore: 85, techMaturity: 79, bodyType: "suv", marketDemand: 80 },
  { id: 25, make: "Nissan", model: "Rogue", year: 2024, trim: "SV", msrp: 36500, fuelType: "gas", fuelEcon: 9.0, reliabilityIndex: 78, maintenanceCostYear: 950, insuranceBaseYear: 1870, depreciationRate: 0.42, awd: true, safetyRating: 5, featureScore: 76, recallScore: 76, techMaturity: 78, bodyType: "suv", marketDemand: 78 },
  { id: 26, make: "Nissan", model: "Sentra", year: 2024, trim: "SV", msrp: 24500, fuelType: "gas", fuelEcon: 7.1, reliabilityIndex: 80, maintenanceCostYear: 760, insuranceBaseYear: 1580, depreciationRate: 0.44, awd: false, safetyRating: 5, featureScore: 68, recallScore: 78, techMaturity: 76, bodyType: "sedan", marketDemand: 70 },
  { id: 27, make: "Nissan", model: "Qashqai", year: 2024, trim: "SV", msrp: 31500, fuelType: "gas", fuelEcon: 8.6, reliabilityIndex: 76, maintenanceCostYear: 920, insuranceBaseYear: 1800, depreciationRate: 0.43, awd: true, safetyRating: 5, featureScore: 73, recallScore: 75, techMaturity: 76, bodyType: "suv", marketDemand: 74 },
  { id: 28, make: "Nissan", model: "Ariya", year: 2024, trim: "Engage", msrp: 52000, fuelType: "ev", fuelEcon: 18.0, reliabilityIndex: 70, maintenanceCostYear: 540, insuranceBaseYear: 2450, depreciationRate: 0.46, awd: false, safetyRating: 5, featureScore: 84, recallScore: 70, techMaturity: 78, bodyType: "suv", marketDemand: 68 },
  { id: 29, make: "Nissan", model: "Rogue", year: 2022, trim: "SV", msrp: 27500, fuelType: "gas", fuelEcon: 9.2, reliabilityIndex: 77, maintenanceCostYear: 930, insuranceBaseYear: 1820, depreciationRate: 0.34, awd: true, safetyRating: 5, featureScore: 68, recallScore: 75, techMaturity: 75, bodyType: "suv", marketDemand: 76 },
  { id: 30, make: "Ford", model: "F-150 XLT", year: 2024, trim: "XLT 4x4", msrp: 58000, fuelType: "gas", fuelEcon: 13.5, reliabilityIndex: 74, maintenanceCostYear: 1300, insuranceBaseYear: 2200, depreciationRate: 0.38, awd: true, safetyRating: 5, featureScore: 80, recallScore: 70, techMaturity: 80, bodyType: "truck", marketDemand: 92 },
  { id: 31, make: "Ford", model: "F-150 Lariat", year: 2024, trim: "Lariat 4x4", msrp: 72000, fuelType: "gas", fuelEcon: 14.0, reliabilityIndex: 74, maintenanceCostYear: 1400, insuranceBaseYear: 2400, depreciationRate: 0.36, awd: true, safetyRating: 5, featureScore: 88, recallScore: 70, techMaturity: 82, bodyType: "truck", marketDemand: 90 },
  { id: 32, make: "Ford", model: "F-150 Lightning", year: 2024, trim: "XLT AWD", msrp: 79000, fuelType: "ev", fuelEcon: 28.0, reliabilityIndex: 65, maintenanceCostYear: 700, insuranceBaseYear: 2800, depreciationRate: 0.45, awd: true, safetyRating: 5, featureScore: 90, recallScore: 62, techMaturity: 80, bodyType: "truck", marketDemand: 78 },
  { id: 33, make: "Ford", model: "F-150", year: 2022, trim: "XLT 4x4", msrp: 45000, fuelType: "gas", fuelEcon: 13.8, reliabilityIndex: 73, maintenanceCostYear: 1250, insuranceBaseYear: 2100, depreciationRate: 0.30, awd: true, safetyRating: 5, featureScore: 74, recallScore: 70, techMaturity: 78, bodyType: "truck", marketDemand: 90 },
  { id: 34, make: "Chevrolet", model: "Silverado 1500 LT", year: 2024, trim: "LT 4x4", msrp: 57000, fuelType: "gas", fuelEcon: 13.8, reliabilityIndex: 72, maintenanceCostYear: 1350, insuranceBaseYear: 2150, depreciationRate: 0.40, awd: true, safetyRating: 4, featureScore: 78, recallScore: 68, techMaturity: 78, bodyType: "truck", marketDemand: 86 },
  { id: 35, make: "Chevrolet", model: "Silverado 1500 LTZ", year: 2024, trim: "LTZ 4x4", msrp: 73000, fuelType: "gas", fuelEcon: 14.2, reliabilityIndex: 72, maintenanceCostYear: 1450, insuranceBaseYear: 2350, depreciationRate: 0.38, awd: true, safetyRating: 4, featureScore: 86, recallScore: 68, techMaturity: 79, bodyType: "truck", marketDemand: 84 },
  { id: 36, make: "Chevrolet", model: "Silverado EV", year: 2024, trim: "WT AWD", msrp: 85000, fuelType: "ev", fuelEcon: 26.0, reliabilityIndex: 62, maintenanceCostYear: 720, insuranceBaseYear: 3000, depreciationRate: 0.48, awd: true, safetyRating: 5, featureScore: 88, recallScore: 58, techMaturity: 74, bodyType: "truck", marketDemand: 72 },
  { id: 37, make: "GMC", model: "Sierra 1500 SLE", year: 2024, trim: "SLE 4x4", msrp: 60000, fuelType: "gas", fuelEcon: 13.6, reliabilityIndex: 73, maintenanceCostYear: 1380, insuranceBaseYear: 2200, depreciationRate: 0.39, awd: true, safetyRating: 4, featureScore: 80, recallScore: 69, techMaturity: 78, bodyType: "truck", marketDemand: 84 },
  { id: 38, make: "GMC", model: "Sierra 1500 Denali", year: 2024, trim: "Denali 4x4", msrp: 88000, fuelType: "gas", fuelEcon: 14.5, reliabilityIndex: 73, maintenanceCostYear: 1600, insuranceBaseYear: 2600, depreciationRate: 0.37, awd: true, safetyRating: 4, featureScore: 93, recallScore: 69, techMaturity: 80, bodyType: "truck", marketDemand: 82 },
  { id: 39, make: "RAM", model: "1500 Big Horn", year: 2024, trim: "Big Horn 4x4", msrp: 59000, fuelType: "gas", fuelEcon: 13.2, reliabilityIndex: 74, maintenanceCostYear: 1320, insuranceBaseYear: 2180, depreciationRate: 0.41, awd: true, safetyRating: 5, featureScore: 82, recallScore: 71, techMaturity: 79, bodyType: "truck", marketDemand: 85 },
  { id: 40, make: "RAM", model: "1500 Laramie", year: 2024, trim: "Laramie 4x4", msrp: 76000, fuelType: "gas", fuelEcon: 13.5, reliabilityIndex: 74, maintenanceCostYear: 1500, insuranceBaseYear: 2450, depreciationRate: 0.39, awd: true, safetyRating: 5, featureScore: 91, recallScore: 71, techMaturity: 80, bodyType: "truck", marketDemand: 83 },
  { id: 41, make: "RAM", model: "1500 TRX", year: 2024, trim: "TRX 4x4", msrp: 108000, fuelType: "gas", fuelEcon: 18.5, reliabilityIndex: 70, maintenanceCostYear: 2000, insuranceBaseYear: 3200, depreciationRate: 0.35, awd: true, safetyRating: 4, featureScore: 95, recallScore: 68, techMaturity: 78, bodyType: "truck", marketDemand: 75 },
  { id: 42, make: "Toyota", model: "Tacoma TRD", year: 2024, trim: "TRD Off-Road 4x4", msrp: 52000, fuelType: "gas", fuelEcon: 11.8, reliabilityIndex: 88, maintenanceCostYear: 1000, insuranceBaseYear: 2000, depreciationRate: 0.26, awd: true, safetyRating: 5, featureScore: 78, recallScore: 87, techMaturity: 82, bodyType: "truck", marketDemand: 93 },
  { id: 43, make: "Toyota", model: "Tundra Platinum", year: 2024, trim: "Platinum 4x4", msrp: 82000, fuelType: "hybrid", fuelEcon: 11.2, reliabilityIndex: 85, maintenanceCostYear: 1100, insuranceBaseYear: 2500, depreciationRate: 0.30, awd: true, safetyRating: 5, featureScore: 88, recallScore: 85, techMaturity: 86, bodyType: "truck", marketDemand: 88 },
  { id: 44, make: "Toyota", model: "Tundra SR5", year: 2024, trim: "SR5 4x4", msrp: 62000, fuelType: "gas", fuelEcon: 13.0, reliabilityIndex: 85, maintenanceCostYear: 1050, insuranceBaseYear: 2200, depreciationRate: 0.31, awd: true, safetyRating: 5, featureScore: 80, recallScore: 85, techMaturity: 83, bodyType: "truck", marketDemand: 87 },
  { id: 45, make: "Toyota", model: "Land Cruiser", year: 2024, trim: "1958 4x4", msrp: 96000, fuelType: "hybrid", fuelEcon: 10.5, reliabilityIndex: 90, maintenanceCostYear: 1400, insuranceBaseYear: 3000, depreciationRate: 0.22, awd: true, safetyRating: 5, featureScore: 90, recallScore: 90, techMaturity: 88, bodyType: "truck", marketDemand: 85 },
];

// ─────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────
function computeTCO(v, profile, regional) {
  const yrs = profile.ownershipYears,
    km = profile.annualKm;
  const fuelCost =
    v.fuelType === "ev"
      ? (km * v.fuelEcon) / 100 * ELECTRICITY_PRICE * yrs
      : (km * v.fuelEcon) / 100 * regional.fuelPrice * yrs;
  const insuranceCost = v.insuranceBaseYear * regional.insuranceMultiplier * yrs;
  const maintenanceCost = v.maintenanceCostYear * yrs;
  const evIncentive = v.fuelType === "ev" ? regional.evIncentive : 0;
  const purchasePrice = v.msrp - evIncentive;
  const resaleValue = v.msrp * (1 - v.depreciationRate);
  const tco = purchasePrice + fuelCost + insuranceCost + maintenanceCost - resaleValue;
  return { tco, fuelCost, insuranceCost, maintenanceCost, resaleValue, purchasePrice };
}

function costScore(v, all, profile, regional) {
  const tcos = all.map((x) => computeTCO(x, profile, regional).tco);
  const mx = Math.max(...tcos),
    mn = Math.min(...tcos);
  return mx === mn ? 50 : (100 * (mx - computeTCO(v, profile, regional).tco)) / (mx - mn);
}

function reliabilityScore(v) {
  return 0.6 * v.reliabilityIndex + 0.3 * v.reliabilityIndex + 0.1 * v.recallScore;
}

function fitScore(v, p) {
  let u = 70;
  if (p.drivingType === "highway" && v.fuelEcon < 8) u += 15;
  if (p.drivingType === "city" && v.fuelType !== "gas") u += 20;
  if (p.annualKm > 25000 && v.reliabilityIndex > 82) u += 10;
  if (p.annualKm < 12000) u += 5;
  u = Math.min(100, u);
  let c = 60;
  if (p.coldClimate && v.awd) c += 35;
  else if (p.coldClimate && !v.awd) c -= 20;
  else if (!p.coldClimate && !v.awd) c += 15;
  c = Math.min(100, Math.max(0, c));
  const b = p.bodyPreference === "any" ? 70 : v.bodyType === p.bodyPreference ? 100 : 20;
  const f = Math.min(100, v.featureScore * (p.comfortPriority / 100) + v.safetyRating * 8);
  return 0.4 * u + 0.2 * c + 0.2 * b + 0.2 * f;
}

function riskScore(v) {
  const raw =
    0.5 * (100 - v.reliabilityIndex) * 0.5 +
    0.3 * (100 - v.recallScore) * 0.8 +
    0.2 * (100 - v.techMaturity);
  return Math.max(0, 100 - raw);
}

function resaleScore(v) {
  return 0.7 * (1 - v.depreciationRate) * 100 + 0.3 * v.marketDemand;
}

function weights(p) {
  let w = { cost: 0.3, reliability: 0.25, fit: 0.2, risk: 0.15, resale: 0.1 };
  if (p.annualKm > 25000) {
    w.cost += 0.08;
    w.fit -= 0.04;
    w.resale -= 0.04;
  }
  if (p.priority === "reliability") {
    w.reliability += 0.1;
    w.cost -= 0.05;
    w.fit -= 0.05;
  }
  if (p.priority === "comfort") {
    w.fit += 0.1;
    w.cost -= 0.05;
    w.resale -= 0.05;
  }
  if (p.priority === "cost") {
    w.cost += 0.1;
    w.fit -= 0.05;
    w.resale -= 0.05;
  }
  const t = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => (w[k] /= t));
  return w;
}

function scoreVehicle(v, p, all, regional) {
  if (v.msrp > p.budget * 1.15) return null;
  if (p.bodyPreference !== "any" && v.bodyType !== p.bodyPreference) return null;
  const w = weights(p);
  const cs = costScore(v, all, p, regional);
  const rs = reliabilityScore(v);
  const fs = fitScore(v, p);
  const rks = riskScore(v);
  const res = resaleScore(v);
  const final = w.cost * cs + w.reliability * rs + w.fit * fs + w.risk * rks + w.resale * res;
  return {
    vehicle: v,
    finalScore: Math.round(final * 10) / 10,
    costScore: Math.round(cs),
    reliabilityScore: Math.round(rs),
    fitScore: Math.round(fs),
    riskScore: Math.round(rks),
    resaleScore: Math.round(res),
    weights: w,
    tco: computeTCO(v, p, regional),
  };
}

function runEngine(p) {
  const r = REGIONAL_DATA[p.province] || REGIONAL_DATA.OTHER;
  return D.map((v) => scoreVehicle(v, p, D, r))
    .filter(Boolean)
    .sort((a, b) => b.finalScore - a.finalScore);
}

// ─────────────────────────────────────────────
// EV vs HYBRID ENGINE
// ─────────────────────────────────────────────
function evHybridCandidates(budget, bodyPref) {
  const ok = (v) => v.msrp <= budget * 1.15 && (bodyPref === "any" || v.bodyType === bodyPref);
  const rank = (v) => v.reliabilityIndex * (1 - v.depreciationRate);
  return {
    evs: D.filter((v) => v.fuelType === "ev" && ok(v))
      .sort((a, b) => rank(b) - rank(a))
      .slice(0, 4),
    hybrids: D.filter((v) => v.fuelType === "hybrid" && ok(v))
      .sort((a, b) => rank(b) - rank(a))
      .slice(0, 4),
  };
}

function buildBreakeven(ev, hy, reg, km) {
  const fp = reg.fuelPrice,
    inc = reg.evIncentive;
  const evFY = (km * ev.fuelEcon) / 100 * ELECTRICITY_PRICE;
  const hyFY = (km * hy.fuelEcon) / 100 * fp;
  const diff = ev.msrp - inc - hy.msrp;
  const save = hyFY + hy.maintenanceCostYear - (evFY + ev.maintenanceCostYear);
  const bkYr = save > 0 ? Math.ceil(diff / save) : null;
  const yrs = Array.from({ length: 11 }, (_, i) => i);
  const evC = yrs.map((y) =>
    Math.round(ev.msrp - inc + (evFY + ev.maintenanceCostYear) * y - Math.max(0, (ev.msrp - inc) * (1 - ev.depreciationRate * (y / 5))))
  );
  const hyC = yrs.map((y) =>
    Math.round(hy.msrp + (hyFY + hy.maintenanceCostYear) * y - Math.max(0, hy.msrp * (1 - hy.depreciationRate * (y / 5))))
  );
  return { diff, save, bkYr, evFY, hyFY, yrs, evC, hyC };
}

function buildScorecard(ev, hy, reg, p) {
  const km = p.annualKm,
    fp = reg.fuelPrice,
    inc = reg.evIncentive;
  const ef5 = (km * ev.fuelEcon) / 100 * ELECTRICITY_PRICE * 5;
  const hf5 = (km * hy.fuelEcon) / 100 * fp * 5;
  const evT = ev.msrp - inc + ef5 + ev.insuranceBaseYear * reg.insuranceMultiplier * 5 - ev.msrp * (1 - ev.depreciationRate);
  const hyT = hy.msrp + hf5 + hy.insuranceBaseYear * reg.insuranceMultiplier * 5 - hy.msrp * (1 - hy.depreciationRate);
  const hCO2 = (km * hy.fuelEcon) / 100 * 2.31 * 5 / 1000;
  const eCO2 = (km * ev.fuelEcon) / 100 * 0.13 * 5 / 1000;
  const dims = [
    { label: "Upfront Cost", ev: Math.max(0, 100 - (ev.msrp - inc) / 1000), hybrid: Math.max(0, 100 - hy.msrp / 1000) },
    { label: "5yr Fuel", ev: Math.max(0, 100 - ef5 / 500), hybrid: Math.max(0, 100 - hf5 / 500) },
    { label: "Maintenance", ev: Math.max(0, 100 - (ev.maintenanceCostYear * 5) / 100), hybrid: Math.max(0, 100 - (hy.maintenanceCostYear * 5) / 100) },
    { label: "Reliability", ev: ev.reliabilityIndex, hybrid: hy.reliabilityIndex },
    { label: "Tech Maturity", ev: ev.techMaturity, hybrid: hy.techMaturity },
    { label: "Resale Value", ev: Math.round((1 - ev.depreciationRate) * 100), hybrid: Math.round((1 - hy.depreciationRate) * 100) },
    { label: "Range/Refuel", ev: 45, hybrid: 95 },
    { label: "Feature Score", ev: ev.featureScore, hybrid: hy.featureScore },
  ].map((d) => ({
    ...d,
    ev: Math.min(100, Math.max(0, Math.round(d.ev))),
    hybrid: Math.min(100, Math.max(0, Math.round(d.hybrid))),
  }));
  return { evT, hyT, ef5, hf5, hCO2, eCO2, co2: hCO2 - eCO2, dims };
}

// ─────────────────────────────────────────────
// CLAUDE API (optional; will fail gracefully without auth)
// ─────────────────────────────────────────────
async function callClaude(prompt) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    return d.content?.find((b) => b.type === "text")?.text || "";
  } catch {
    return "";
  }
}

async function genExplanations(top3, profile) {
  const sums = top3
    .map(
      (r, i) =>
        `#${i + 1}: ${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} | Score:${r.finalScore} | $${r.vehicle.msrp.toLocaleString()} | TCO:${fmt(r.tco.tco)} | ${r.vehicle.fuelType}`
    )
    .join("\n");
  const txt = await callClaude(
    `Expert Canadian car advisor. Write 2-sentence explanation for each of these 3 scored vehicles. Mention real numbers. Return ONLY JSON array: [{"rank":1,"headline":"...","explanation":"..."},{"rank":2,...},{"rank":3,...}]\n\nUser: $${profile.budget.toLocaleString()} budget | ${profile.province} | ${profile.annualKm.toLocaleString()}km/yr | ${profile.drivingType} | ${profile.ownershipYears}yr\n\nVehicles:\n${sums}`
  );
  try {
    return JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch {
    return top3.map((r, i) => ({
      rank: i + 1,
      headline: "Strong match",
      explanation: `Scores ${r.finalScore}/100 with ${fmt(r.tco.tco)} 5-year TCO.`,
    }));
  }
}

async function genEvHybridVerdict(ev, hy, sc, bk, profile, reg) {
  return callClaude(`Canadian automotive analyst. 3 short paragraphs: cost verdict, lifestyle fit, final recommendation. Real numbers only. Plain text.

EV: ${ev.year} ${ev.make} ${ev.model} MSRP $${ev.msrp.toLocaleString()} (after $${reg.evIncentive.toLocaleString()} incentive: $${(ev.msrp - reg.evIncentive).toLocaleString()})
Hybrid: ${hy.year} ${hy.make} ${hy.model} MSRP $${hy.msrp.toLocaleString()}
${profile.province} | Fuel $${reg.fuelPrice}/L | Elec $${ELECTRICITY_PRICE}/kWh | ${profile.annualKm.toLocaleString()}km/yr | ${profile.drivingType} | Cold:${profile.coldClimate} | ${profile.ownershipYears}yr
EV 5yr TCO: ${fmt(sc.evT)} | Hybrid 5yr TCO: ${fmt(sc.hyT)}
EV energy/yr: ${fmt(sc.ef5 / 5)} | Hybrid fuel/yr: ${fmt(sc.hf5 / 5)}
Breakeven: ${bk.bkYr ? bk.bkYr + " years" : "EV doesn't break even in 10 years"}
CO2 saved by EV over 5yr: ${sc.co2.toFixed(1)} tonnes`);
}

// ─────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#334155", fontFamily: "monospace" }}>{hint}</p>}
    </div>
  );
}

function Bar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 3, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VEHICLE CARD
// ─────────────────────────────────────────────
function VehicleCard({ result: r, rank, explanation: ex, isTop }) {
  const [open, setOpen] = useState(false);
  const rc = ["#f59e0b", "#94a3b8", "#cd7c3f"][rank - 1];
  const rl = ["BEST PICK", "RUNNER UP", "SOLID CHOICE"][rank - 1];
  const fc = { gas: "#64748b", hybrid: "#10b981", ev: "#3b82f6" };
  const sc = r.finalScore >= 75 ? "#10b981" : r.finalScore >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        background: isTop ? "linear-gradient(135deg,#0f172a,#1a1f35)" : "#0f172a",
        border: `1px solid ${isTop ? "rgba(245,158,11,0.3)" : "#1e293b"}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
      onClick={() => setOpen((o) => !o)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {isTop && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#f59e0b,transparent)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: rc, background: `${rc}20`, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", letterSpacing: "0.1em" }}>
              #{rank} {rl}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: fc[r.vehicle.fuelType], padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", textTransform: "uppercase" }}>
              {r.vehicle.fuelType}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "Georgia,serif", letterSpacing: "-0.02em" }}>
            {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{r.vehicle.trim}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: sc, fontFamily: "monospace", lineHeight: 1 }}>{r.finalScore}</div>
          <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>/ 100</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginTop: 6, fontFamily: "monospace" }}>{fmt(r.vehicle.msrp)}</div>
        </div>
      </div>
      {ex && (
        <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `3px solid ${rc}` }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: rc, fontFamily: "monospace", textTransform: "uppercase" }}>{ex.headline}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{ex.explanation}</p>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
        {[
          ["5-Year TCO", fmt(r.tco.tco)],
          ["Fuel / 5yr", fmt(r.tco.fuelCost)],
          ["Resale", fmt(r.tco.resaleValue)],
        ].map(([l, v]) => (
          <div key={l} style={{ background: "#0d1117", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>{v}</div>
          </div>
        ))}
      </div>
      {open && (
        <div style={{ marginTop: 16, padding: 16, background: "#0d1117", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>Score Breakdown</p>
          <Bar label="Cost Efficiency" value={r.costScore} color="#10b981" />
          <Bar label="Reliability" value={r.reliabilityScore} color="#3b82f6" />
          <Bar label="Fit for You" value={r.fitScore} color="#8b5cf6" />
          <Bar label="Risk Score" value={r.riskScore} color="#f59e0b" />
          <Bar label="Resale Value" value={r.resaleScore} color="#ef4444" />
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              ["Insurance 5yr", fmt(r.tco.insuranceCost)],
              ["Maintenance 5yr", fmt(r.tco.maintenanceCost)],
              ["AWD", r.vehicle.awd ? "✓ Yes" : "✗ No"],
              ["Safety", `${r.vehicle.safetyRating}/5 ★`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", fontFamily: "monospace", padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
                <span>{l}</span>
                <span style={{ color: "#94a3b8" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 10, color: "#334155", fontFamily: "monospace" }}>{open ? "▲ COLLAPSE" : "▼ EXPAND DETAILS"}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COST CHART (pure SVG, no deps)
// ─────────────────────────────────────────────
function CostChart({ yrs, evC, hyC, bkYr }) {
  const all = [...evC, ...hyC],
    mx = Math.max(...all),
    mn = Math.min(...all),
    rng = mx - mn || 1;
  const W = 640,
    H = 160,
    pL = 58,
    pR = 14,
    pT = 14,
    pB = 26,
    iW = W - pL - pR,
    iH = H - pT - pB;
  const xS = (i) => pL + (i / (yrs.length - 1)) * iW,
    yS = (v) => pT + iH - ((v - mn) / rng) * iH;
  const path = (data) => data.map((v, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");
  const bkX = bkYr && bkYr <= 10 ? xS(bkYr) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.33, 0.66, 1].map((f) => {
        const y = pT + iH * (1 - f),
          val = mn + rng * f;
        return (
          <g key={f}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#475569" fontFamily="monospace">
              ${Math.round(val / 1000)}k
            </text>
          </g>
        );
      })}
      {yrs.map((y) => (
        <text key={y} x={xS(y)} y={H - 3} textAnchor="middle" fontSize="8" fill="#475569" fontFamily="monospace">
          Y{y}
        </text>
      ))}
      {bkX && (
        <>
          <line x1={bkX} y1={pT} x2={bkX} y2={pT + iH} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x={bkX + 3} y={pT + 11} fontSize="8" fill="#f59e0b" fontFamily="monospace">
            Breakeven
          </text>
        </>
      )}
      <path d={path(hyC)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={path(evC)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={xS(yrs.length - 1)} cy={yS(evC[yrs.length - 1])} r="4" fill="#3b82f6" />
      <circle cx={xS(yrs.length - 1)} cy={yS(hyC[yrs.length - 1])} r="4" fill="#10b981" />
      <rect x={pL} y={pT} width="8" height="8" fill="#3b82f6" rx="1" />
      <text x={pL + 11} y={pT + 8} fontSize="8" fill="#94a3b8" fontFamily="monospace">
        EV
      </text>
      <rect x={pL + 34} y={pT} width="8" height="8" fill="#10b981" rx="1" />
      <text x={pL + 45} y={pT + 8} fontSize="8" fill="#94a3b8" fontFamily="monospace">
        Hybrid
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// EV VS HYBRID TAB
// ─────────────────────────────────────────────
function EVHybridTab({ profile }) {
  const reg = REGIONAL_DATA[profile.province] || REGIONAL_DATA.OTHER;
  const { evs, hybrids } = evHybridCandidates(profile.budget, profile.bodyPreference);
  const [selEV, setSelEV] = useState(0);
  const [selHY, setSelHY] = useState(0);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!evs.length || !hybrids.length)
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontFamily: "monospace" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <p>{!evs.length ? "No EVs within budget." : "No Hybrids within budget."}</p>
        <p style={{ fontSize: 12 }}>Try a higher budget or remove body type filter.</p>
      </div>
    );

  const ev = evs[Math.min(selEV, evs.length - 1)];
  const hy = hybrids[Math.min(selHY, hybrids.length - 1)];
  const sc = buildScorecard(ev, hy, reg, profile);
  const bk = buildBreakeven(ev, hy, reg, profile.annualKm);
  const evW = sc.evT < sc.hyT;

  const handleVerdict = async () => {
    setLoading(true);
    setVerdict(null);
    const t = await genEvHybridVerdict(ev, hy, sc, bk, profile, reg);
    setVerdict(t);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#3b82f6", background: "#3b82f620", padding: "3px 8px", borderRadius: 4 }}>⚡ EV</span>
          <span style={{ fontSize: 10, color: "#334155" }}>vs</span>
          <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#10b981", background: "#10b98120", padding: "3px 8px", borderRadius: 4 }}>🌿 HYBRID</span>
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
            {profile.province} · {profile.annualKm.toLocaleString()} km/yr
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>EV vs Hybrid Comparison</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#0d1117", border: "1px solid #3b82f630", borderRadius: 10, padding: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#3b82f6", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚡ EV</p>
          <select value={selEV} onChange={(e) => { setSelEV(+e.target.value); setVerdict(null); }} style={{ ...inputStyle, border: "1px solid #3b82f630", fontSize: 12 }}>
            {evs.map((v, i) => (
              <option key={v.id} value={i}>
                {v.year} {v.make} {v.model} — ${v.msrp.toLocaleString()}
              </option>
            ))}
          </select>
          <p style={{ margin: "7px 0 0", fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
            After ${reg.evIncentive.toLocaleString()} incentive:{" "}
            <span style={{ color: "#3b82f6", fontWeight: 700 }}>${(ev.msrp - reg.evIncentive).toLocaleString()}</span>
          </p>
        </div>
        <div style={{ background: "#0d1117", border: "1px solid #10b98130", borderRadius: 10, padding: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#10b981", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>🌿 HYBRID</p>
          <select value={selHY} onChange={(e) => { setSelHY(+e.target.value); setVerdict(null); }} style={{ ...inputStyle, border: "1px solid #10b98130", fontSize: 12 }}>
            {hybrids.map((v, i) => (
              <option key={v.id} value={i}>
                {v.year} {v.make} {v.model} — ${v.msrp.toLocaleString()}
              </option>
            ))}
          </select>
          <p style={{ margin: "7px 0 0", fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
            Fuel economy: <span style={{ color: "#10b981", fontWeight: 700 }}>{hy.fuelEcon} L/100km</span>
          </p>
        </div>
      </div>

      <div
        style={{
          background: evW ? "linear-gradient(135deg,#0d1a2e,#0f172a)" : "linear-gradient(135deg,#0a1f16,#0f172a)",
          border: `1px solid ${evW ? "#3b82f640" : "#10b98140"}`,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>5-Year TCO Winner</p>
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: evW ? "#3b82f6" : "#10b981", fontFamily: "monospace" }}>
            {evW ? `${ev.make} ${ev.model} (EV)` : `${hy.make} ${hy.model} (Hybrid)`}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
            Saves <span style={{ color: "#f59e0b", fontWeight: 700 }}>${Math.round(Math.abs(sc.evT - sc.hyT)).toLocaleString()}</span> over 5 years
          </p>
        </div>
        <div style={{ textAlign: "right", fontFamily: "monospace" }}>
          <div style={{ fontSize: 10, color: "#475569" }}>EV 5yr TCO</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6" }}>{fmt(sc.evT)}</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>Hybrid 5yr TCO</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{fmt(sc.hyT)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          {
            label: "Breakeven",
            ev: bk.bkYr ? `Yr ${bk.bkYr}` : ">10 yrs",
            hy: "Day 1",
            ec: bk.bkYr && bk.bkYr <= profile.ownershipYears ? "#3b82f6" : "#ef4444",
            note: bk.bkYr && bk.bkYr <= profile.ownershipYears ? "Within ownership" : "Doesn't break even",
          },
          { label: "Energy/yr", ev: fmt(sc.ef5 / 5), hy: fmt(sc.hf5 / 5), ec: sc.ef5 < sc.hf5 ? "#3b82f6" : "#94a3b8", note: `EV saves ${fmt((sc.hf5 - sc.ef5) / 5)}/yr` },
          { label: "CO₂ 5yr", ev: sc.co2 > 0 ? `-${sc.co2.toFixed(1)}t` : `+${Math.abs(sc.co2).toFixed(1)}t`, hy: "baseline", ec: sc.co2 > 0 ? "#3b82f6" : "#94a3b8", note: `Hybrid emits ${sc.hCO2.toFixed(1)}t` },
        ].map((m) => (
          <div key={m.label} style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>{m.label}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: m.ec, fontFamily: "monospace" }}>⚡ {m.ev}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#10b981", fontFamily: "monospace" }}>🌿 {m.hy}</span>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "#334155", fontFamily: "monospace", lineHeight: 1.4 }}>{m.note}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 14px 8px", marginBottom: 18 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>Cumulative Cost — 10 Year View</p>
        <p style={{ margin: "0 0 10px", fontSize: 10, color: "#334155", fontFamily: "monospace" }}>{bk.bkYr ? `EV breakeven at year ${bk.bkYr}` : "Hybrid cheaper throughout"}</p>
        <CostChart yrs={bk.yrs} evC={bk.evC} hyC={bk.hyC} bkYr={bk.bkYr} />
      </div>

      <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>Head-to-Head Scorecard</p>
        {sc.dims.map((d) => {
          const ew = d.ev >= d.hybrid;
          return (
            <div key={d.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontFamily: "monospace" }}>
                <span style={{ color: "#3b82f6", fontWeight: 700 }}>⚡ {d.ev}</span>
                <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.label}</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>🌿 {d.hybrid}</span>
              </div>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: `${d.ev}%`, height: 6, background: ew ? "#3b82f6" : "#1e3a5f", borderRadius: "3px 0 0 3px", transition: "width 0.6s" }} />
                </div>
                <div style={{ width: 2, height: 12, background: "#0d1117", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: `${d.hybrid}%`, height: 6, background: !ew ? "#10b981" : "#0d3320", borderRadius: "0 3px 3px 0", transition: "width 0.6s" }} />
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e293b" }}>
          <span style={{ fontSize: 12, color: "#3b82f6", fontFamily: "monospace", fontWeight: 700 }}>
            EV wins: {sc.dims.filter((d) => d.ev >= d.hybrid).length}/{sc.dims.length}
          </span>
          <span style={{ fontSize: 12, color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>
            Hybrid wins: {sc.dims.filter((d) => d.hybrid > d.ev).length}/{sc.dims.length}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          {
            label: "EV Annual Costs",
            color: "#3b82f6",
            icon: "⚡",
            rows: [
              ["Energy (elec)", Math.round(sc.ef5 / 5)],
              ["Insurance/yr", Math.round(ev.insuranceBaseYear * reg.insuranceMultiplier)],
              ["Maintenance/yr", ev.maintenanceCostYear],
              ["Total/yr", Math.round(sc.ef5 / 5) + Math.round(ev.insuranceBaseYear * reg.insuranceMultiplier) + ev.maintenanceCostYear],
            ],
          },
          {
            label: "Hybrid Annual Costs",
            color: "#10b981",
            icon: "🌿",
            rows: [
              ["Fuel (gas)", Math.round(sc.hf5 / 5)],
              ["Insurance/yr", Math.round(hy.insuranceBaseYear * reg.insuranceMultiplier)],
              ["Maintenance/yr", hy.maintenanceCostYear],
              ["Total/yr", Math.round(sc.hf5 / 5) + Math.round(hy.insuranceBaseYear * reg.insuranceMultiplier) + hy.maintenanceCostYear],
            ],
          },
        ].map((col, ci) => (
          <div key={ci} style={{ background: "#0d1117", border: `1px solid ${col.color}25`, borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 10px", fontSize: 10, color: col.color, fontFamily: "monospace", textTransform: "uppercase" }}>
              {col.icon} {col.label}
            </p>
            {col.rows.map(([l, v], ri) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: ri < col.rows.length - 1 ? "1px solid #0f172a" : "none" }}>
                <span style={{ fontSize: 11, color: ri === col.rows.length - 1 ? "#f1f5f9" : "#64748b", fontFamily: "monospace", fontWeight: ri === col.rows.length - 1 ? 700 : 400 }}>{l}</span>
                <span style={{ fontSize: 11, color: ri === col.rows.length - 1 ? col.color : "#94a3b8", fontFamily: "monospace", fontWeight: ri === col.rows.length - 1 ? 800 : 400 }}>${v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {profile.coldClimate && (
        <div style={{ background: "#1a1200", border: "1px solid #f59e0b30", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#f59e0b", fontFamily: "monospace", fontWeight: 700 }}>⚠ Cold Climate Note</p>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            EV range drops 20–40% in cold Canadian winters. Home charging costs $800–$2,000. Hybrids have no range penalty and provide instant cabin heat.
          </p>
        </div>
      )}

      <button
        onClick={handleVerdict}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "#1e293b" : "linear-gradient(135deg,#1d4ed8,#2563eb)",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 800,
          color: loading ? "#475569" : "#fff",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: verdict ? 16 : 0,
          boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,0.3)",
        }}
      >
        {loading ? "⟳ Generating AI Verdict..." : "⚡ Generate AI Verdict for My Profile"}
      </button>

      {verdict && (
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1a1f35)", border: "1px solid #1d4ed840", borderRadius: 12, padding: 20 }}>
          <p style={{ margin: "0 0 12px", fontSize: 10, color: "#3b82f6", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
            ⚡ AI Verdict · {ev.make} {ev.model} vs {hy.make} {hy.model}
          </p>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{verdict}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState({
    budget: 45000,
    province: "ON",
    annualKm: 18000,
    drivingType: "mixed",
    coldClimate: true,
    familySize: 2,
    bodyPreference: "any",
    priority: "balanced",
    ownershipYears: 5,
    comfortPriority: 60,
  });
  const [results, setResults] = useState(null);
  const [explanations, setExplanations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("form");
  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setTab("results");
    setExplanations(null);
    try {
      const scored = runEngine(profile);
      const top3 = scored.slice(0, 3);
      setResults({ top3, all: scored });
      const exps = await genExplanations(top3, profile);
      setExplanations(exps);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const reg = REGIONAL_DATA[profile.province] || REGIONAL_DATA.OTHER;

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", color: "#f1f5f9", fontFamily: "Georgia,serif" }}>
      <div style={{ background: "linear-gradient(180deg,#0d1117,#070b14)", borderBottom: "1px solid #1e293b", padding: "24px 24px 0" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: "50%", boxShadow: "0 0 12px #f59e0b" }} />
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              v2.0 · 45 Vehicles · Deterministic Engine
            </span>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>Car Buying Decision Engine</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569", fontFamily: "monospace" }}>AI-powered · Data-driven · Fully explainable · Canadian market</p>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e293b" }}>
            {[
              ["form", "Profile Input"],
              ["results", "Recommendations"],
              ["ev-hybrid", "⚡ EV vs Hybrid"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 18px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: tab === k ? "#f59e0b" : "#475569",
                  borderBottom: tab === k ? "2px solid #f59e0b" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "form" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              <Field label="Total Budget (CAD)" hint={`EV incentive in ${profile.province}: −$${reg.evIncentive.toLocaleString()}`}>
                <input type="number" value={profile.budget} onChange={(e) => set("budget", +e.target.value)} style={inputStyle} step={1000} min={15000} max={150000} />
              </Field>
              <Field label="Province">
                <select value={profile.province} onChange={(e) => set("province", e.target.value)} style={inputStyle}>
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Annual KM" hint="Affects cost weight & fuel calculation">
                <input type="number" value={profile.annualKm} onChange={(e) => set("annualKm", +e.target.value)} style={inputStyle} step={1000} min={5000} max={60000} />
              </Field>
              <Field label="Ownership Years">
                <select value={profile.ownershipYears} onChange={(e) => set("ownershipYears", +e.target.value)} style={inputStyle}>
                  {[3, 4, 5, 7, 10].map((y) => (
                    <option key={y} value={y}>
                      {y} years
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Driving Type">
                <select value={profile.drivingType} onChange={(e) => set("drivingType", e.target.value)} style={inputStyle}>
                  <option value="city">City (stop &amp; go)</option>
                  <option value="mixed">Mixed</option>
                  <option value="highway">Highway</option>
                </select>
              </Field>
              <Field label="Family Size">
                <input type="number" value={profile.familySize} onChange={(e) => set("familySize", +e.target.value)} style={inputStyle} min={1} max={8} />
              </Field>
              <Field label="Body Type Preference">
                <select value={profile.bodyPreference} onChange={(e) => set("bodyPreference", e.target.value)} style={inputStyle}>
                  <option value="any">No Preference</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV / Crossover</option>
                  <option value="truck">Truck / Pickup</option>
                </select>
              </Field>
              <Field label="Cold Climate / Winter Roads">
                <select value={profile.coldClimate ? "yes" : "no"} onChange={(e) => set("coldClimate", e.target.value === "yes")} style={inputStyle}>
                  <option value="yes">Yes — boost AWD fit</option>
                  <option value="no">No — mild winters</option>
                </select>
              </Field>
            </div>
            <Field
              label={`Priority: ${
                profile.priority === "balanced" ? "Balanced" : profile.priority === "cost" ? "Cost First" : profile.priority === "reliability" ? "Reliability First" : "Comfort First"
              }`}
              hint="Adjusts scoring weights dynamically"
            >
              <select value={profile.priority} onChange={(e) => set("priority", e.target.value)} style={inputStyle}>
                <option value="balanced">Balanced (default)</option>
                <option value="cost">Cost-Focused (+10%)</option>
                <option value="reliability">Peace of Mind (+10%)</option>
                <option value="comfort">Comfort &amp; Features (+10%)</option>
              </select>
            </Field>
            <Field label={`Comfort Priority: ${profile.comfortPriority}%`} hint="Scales feature score in Fit calculation">
              <input type="range" min={20} max={100} value={profile.comfortPriority} onChange={(e) => set("comfortPriority", +e.target.value)} style={{ width: "100%", accentColor: "#f59e0b" }} />
            </Field>
            <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>Regional Parameters (auto-applied)</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  ["Fuel Price", `$${reg.fuelPrice}/L`],
                  ["Insurance Adj.", `×${reg.insuranceMultiplier}`],
                  ["EV Incentive", `−$${reg.evIncentive.toLocaleString()}`],
                  ["Electricity", `$${ELECTRICITY_PRICE}/kWh`],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>{l}</div>
                    <div style={{ fontSize: 13, color: "#f59e0b", fontFamily: "monospace", fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 800,
                color: "#0d1117",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
            >
              ▶ Run Scoring Engine
            </button>
          </div>
        )}

        {tab === "results" && (
          <div>
            {loading && !results && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>⚙</div>
                <p style={{ color: "#475569", fontFamily: "monospace", fontSize: 13 }}>Computing scores across 45 vehicles...</p>
              </div>
            )}
            {!results && !loading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontFamily: "monospace" }}>
                <p>Run the engine from Profile Input first.</p>
                <button onClick={() => setTab("form")} style={{ marginTop: 12, padding: "10px 20px", background: "#1e293b", border: "none", borderRadius: 8, color: "#94a3b8", fontFamily: "monospace", cursor: "pointer" }}>
                  ← Profile Input
                </button>
              </div>
            )}
            {results && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%" }} />
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#475569", textTransform: "uppercase" }}>{results.all.length} eligible · Top 3 of 45 vehicles</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Your Recommendations</h2>
                  {loading && <p style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", marginTop: 4 }}>⟳ Generating AI explanations...</p>}
                </div>
                {results.top3.map((r, i) => (
                  <VehicleCard key={r.vehicle.id} result={r} rank={i + 1} explanation={explanations?.[i]} isTop={i === 0} />
                ))}
                <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, padding: 16, marginTop: 8 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>Active Score Weights</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(results.top3[0]?.weights || {}).map(([k, v]) => (
                      <div key={k} style={{ background: "#1e293b", borderRadius: 6, padding: "7px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b", fontFamily: "monospace" }}>{Math.round(v * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                {results.all.length > 3 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 10 }}>Other Candidates</p>
                    <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
                      {results.all.slice(3, 10).map((r, i) => (
                        <div key={r.vehicle.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderBottom: i < 6 ? "1px solid #1e293b" : "none" }}>
                          <span style={{ fontSize: 13, color: "#94a3b8" }}>
                            #{i + 4} {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                          </span>
                          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{fmt(r.vehicle.msrp)}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: r.finalScore >= 65 ? "#f59e0b" : "#64748b" }}>{r.finalScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setTab("form")} style={{ marginTop: 24, width: "100%", padding: "13px", background: "none", border: "1px solid #1e293b", borderRadius: 10, fontSize: 13, fontFamily: "monospace", color: "#475569", cursor: "pointer", textTransform: "uppercase" }}>
                  ← Adjust Profile
                </button>
              </>
            )}
          </div>
        )}

        {tab === "ev-hybrid" && <EVHybridTab profile={profile} />}
      </div>

      <style>{`
        select option{background:#0d1117}
        input[type=number]::-webkit-inner-spin-button{opacity:0.5}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
      `}</style>
    </div>
  );
}

