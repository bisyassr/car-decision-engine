import { useState, useCallback, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const ELECTRICITY_PRICE = 0.13;
const PROVINCES = ["BC","AB","ON","QC","MB","SK","NS","OTHER"];
const fmt  = n => `$${Math.round(n).toLocaleString()}`;
const fmtK = n => `$${Math.round(n/1000)}k`;

const REGIONAL_DATA = {
  BC:    { fuelPrice:1.85, insuranceMultiplier:1.25, evIncentive:4000  },
  AB:    { fuelPrice:1.45, insuranceMultiplier:1.10, evIncentive:0     },
  ON:    { fuelPrice:1.60, insuranceMultiplier:1.35, evIncentive:5000  },
  QC:    { fuelPrice:1.65, insuranceMultiplier:1.05, evIncentive:7000  },
  MB:    { fuelPrice:1.50, insuranceMultiplier:1.00, evIncentive:2500  },
  SK:    { fuelPrice:1.48, insuranceMultiplier:1.00, evIncentive:0     },
  NS:    { fuelPrice:1.72, insuranceMultiplier:1.10, evIncentive:3000  },
  OTHER: { fuelPrice:1.60, insuranceMultiplier:1.10, evIncentive:2000  },
};

// ─────────────────────────────────────────────────────────────
// VEHICLE DATASET — 51 vehicles (incl. 6 Lexus)
// ─────────────────────────────────────────────────────────────
const D = [
  // ── SEDANS ──
  {id:1,  make:"Toyota",  model:"Camry",           year:2024,trim:"LE",             msrp:32000, fuelType:"gas",   fuelEcon:8.1,  reliabilityIndex:88,maintenanceCostYear:800, insuranceBaseYear:1800,depreciationRate:0.38,awd:false,safetyRating:5,featureScore:72,recallScore:88,techMaturity:85,bodyType:"sedan",marketDemand:82},
  {id:4,  make:"Honda",   model:"Civic",           year:2024,trim:"Sport",          msrp:29500, fuelType:"gas",   fuelEcon:7.4,  reliabilityIndex:85,maintenanceCostYear:750, insuranceBaseYear:1650,depreciationRate:0.40,awd:false,safetyRating:5,featureScore:70,recallScore:84,techMaturity:82,bodyType:"sedan",marketDemand:80},
  {id:7,  make:"Tesla",   model:"Model 3",         year:2024,trim:"RWD",            msrp:52000, fuelType:"ev",    fuelEcon:14.5, reliabilityIndex:72,maintenanceCostYear:550, insuranceBaseYear:2600,depreciationRate:0.42,awd:false,safetyRating:5,featureScore:92,recallScore:68,techMaturity:90,bodyType:"sedan",marketDemand:78},
  {id:10, make:"Hyundai", model:"Ioniq 6",         year:2024,trim:"Standard",       msrp:48500, fuelType:"ev",    fuelEcon:14.0, reliabilityIndex:75,maintenanceCostYear:500, insuranceBaseYear:2400,depreciationRate:0.45,awd:false,safetyRating:5,featureScore:88,recallScore:76,techMaturity:85,bodyType:"sedan",marketDemand:72},
  {id:12, make:"Mazda",   model:"3",               year:2024,trim:"GT",             msrp:30000, fuelType:"gas",   fuelEcon:7.8,  reliabilityIndex:87,maintenanceCostYear:780, insuranceBaseYear:1700,depreciationRate:0.39,awd:false,safetyRating:5,featureScore:78,recallScore:88,techMaturity:78,bodyType:"sedan",marketDemand:76},
  {id:18, make:"Toyota",  model:"Corolla",         year:2022,trim:"LE",             msrp:22000, fuelType:"gas",   fuelEcon:7.9,  reliabilityIndex:89,maintenanceCostYear:720, insuranceBaseYear:1550,depreciationRate:0.30,awd:false,safetyRating:5,featureScore:65,recallScore:90,techMaturity:82,bodyType:"sedan",marketDemand:84},
  {id:19, make:"Honda",   model:"Civic",           year:2022,trim:"LX",             msrp:21000, fuelType:"gas",   fuelEcon:7.6,  reliabilityIndex:86,maintenanceCostYear:730, insuranceBaseYear:1580,depreciationRate:0.32,awd:false,safetyRating:5,featureScore:62,recallScore:85,techMaturity:80,bodyType:"sedan",marketDemand:81},
  {id:21, make:"Hyundai", model:"Elantra",         year:2024,trim:"Preferred",      msrp:26500, fuelType:"gas",   fuelEcon:7.2,  reliabilityIndex:80,maintenanceCostYear:780, insuranceBaseYear:1620,depreciationRate:0.43,awd:false,safetyRating:5,featureScore:74,recallScore:79,techMaturity:80,bodyType:"sedan",marketDemand:72},
  {id:22, make:"VW",      model:"Golf",            year:2024,trim:"Comfortline",    msrp:31500, fuelType:"gas",   fuelEcon:7.8,  reliabilityIndex:74,maintenanceCostYear:1100,insuranceBaseYear:1750,depreciationRate:0.44,awd:false,safetyRating:5,featureScore:79,recallScore:72,techMaturity:77,bodyType:"sedan",marketDemand:68},
  {id:26, make:"Nissan",  model:"Sentra",          year:2024,trim:"SV",             msrp:24500, fuelType:"gas",   fuelEcon:7.1,  reliabilityIndex:80,maintenanceCostYear:760, insuranceBaseYear:1580,depreciationRate:0.44,awd:false,safetyRating:5,featureScore:68,recallScore:78,techMaturity:76,bodyType:"sedan",marketDemand:70},
  // Lexus Sedans
  {id:46, make:"Lexus",   model:"ES 350",          year:2024,trim:"Premium",        msrp:57000, fuelType:"gas",   fuelEcon:9.4,  reliabilityIndex:91,maintenanceCostYear:1100,insuranceBaseYear:2400,depreciationRate:0.29,awd:false,safetyRating:5,featureScore:88,recallScore:92,techMaturity:87,bodyType:"sedan",marketDemand:82},
  {id:47, make:"Lexus",   model:"ES 300h",         year:2024,trim:"Premium Hybrid", msrp:62000, fuelType:"hybrid",fuelEcon:5.4,  reliabilityIndex:92,maintenanceCostYear:1050,insuranceBaseYear:2500,depreciationRate:0.27,awd:false,safetyRating:5,featureScore:90,recallScore:93,techMaturity:89,bodyType:"sedan",marketDemand:84},
  // ── SUVs ──
  {id:2,  make:"Toyota",  model:"RAV4",            year:2024,trim:"XLE",            msrp:38500, fuelType:"gas",   fuelEcon:8.7,  reliabilityIndex:86,maintenanceCostYear:900, insuranceBaseYear:1950,depreciationRate:0.36,awd:true, safetyRating:5,featureScore:78,recallScore:85,techMaturity:84,bodyType:"suv",marketDemand:90},
  {id:3,  make:"Toyota",  model:"RAV4 Hybrid",     year:2024,trim:"XLE",            msrp:43500, fuelType:"hybrid",fuelEcon:6.0,  reliabilityIndex:87,maintenanceCostYear:850, insuranceBaseYear:2000,depreciationRate:0.30,awd:true, safetyRating:5,featureScore:82,recallScore:87,techMaturity:88,bodyType:"suv",marketDemand:91},
  {id:5,  make:"Honda",   model:"CR-V",            year:2024,trim:"EX",             msrp:37200, fuelType:"gas",   fuelEcon:8.5,  reliabilityIndex:83,maintenanceCostYear:880, insuranceBaseYear:1900,depreciationRate:0.38,awd:true, safetyRating:5,featureScore:75,recallScore:83,techMaturity:81,bodyType:"suv",marketDemand:85},
  {id:6,  make:"Honda",   model:"CR-V Hybrid",     year:2024,trim:"Sport",          msrp:41800, fuelType:"hybrid",fuelEcon:6.2,  reliabilityIndex:84,maintenanceCostYear:830, insuranceBaseYear:1950,depreciationRate:0.32,awd:true, safetyRating:5,featureScore:79,recallScore:85,techMaturity:85,bodyType:"suv",marketDemand:86},
  {id:8,  make:"Tesla",   model:"Model Y",         year:2024,trim:"AWD",            msrp:62000, fuelType:"ev",    fuelEcon:16.8, reliabilityIndex:70,maintenanceCostYear:600, insuranceBaseYear:2800,depreciationRate:0.44,awd:true, safetyRating:5,featureScore:94,recallScore:65,techMaturity:90,bodyType:"suv",marketDemand:82},
  {id:9,  make:"Hyundai", model:"Tucson",          year:2024,trim:"Preferred",      msrp:34500, fuelType:"gas",   fuelEcon:8.9,  reliabilityIndex:78,maintenanceCostYear:920, insuranceBaseYear:1850,depreciationRate:0.42,awd:true, safetyRating:5,featureScore:76,recallScore:78,techMaturity:79,bodyType:"suv",marketDemand:74},
  {id:11, make:"Mazda",   model:"CX-5",            year:2024,trim:"GS",             msrp:36000, fuelType:"gas",   fuelEcon:9.2,  reliabilityIndex:86,maintenanceCostYear:860, insuranceBaseYear:1820,depreciationRate:0.37,awd:true, safetyRating:5,featureScore:80,recallScore:86,techMaturity:78,bodyType:"suv",marketDemand:82},
  {id:13, make:"Subaru",  model:"Forester",        year:2024,trim:"Convenience",    msrp:35000, fuelType:"gas",   fuelEcon:9.8,  reliabilityIndex:82,maintenanceCostYear:950, insuranceBaseYear:1880,depreciationRate:0.36,awd:true, safetyRating:5,featureScore:73,recallScore:80,techMaturity:75,bodyType:"suv",marketDemand:78},
  {id:14, make:"Subaru",  model:"Outback",         year:2024,trim:"Touring",        msrp:40500, fuelType:"gas",   fuelEcon:10.1, reliabilityIndex:81,maintenanceCostYear:980, insuranceBaseYear:1920,depreciationRate:0.35,awd:true, safetyRating:5,featureScore:77,recallScore:80,techMaturity:76,bodyType:"suv",marketDemand:80},
  {id:15, make:"Ford",    model:"Escape",          year:2023,trim:"SEL",            msrp:31000, fuelType:"gas",   fuelEcon:9.0,  reliabilityIndex:72,maintenanceCostYear:1050,insuranceBaseYear:1780,depreciationRate:0.46,awd:true, safetyRating:4,featureScore:70,recallScore:70,techMaturity:75,bodyType:"suv",marketDemand:70},
  {id:16, make:"Kia",     model:"Sportage",        year:2024,trim:"EX",             msrp:35500, fuelType:"gas",   fuelEcon:9.1,  reliabilityIndex:79,maintenanceCostYear:900, insuranceBaseYear:1860,depreciationRate:0.41,awd:true, safetyRating:5,featureScore:78,recallScore:79,techMaturity:80,bodyType:"suv",marketDemand:75},
  {id:17, make:"Kia",     model:"EV6",             year:2024,trim:"Standard",       msrp:49500, fuelType:"ev",    fuelEcon:15.0, reliabilityIndex:76,maintenanceCostYear:520, insuranceBaseYear:2500,depreciationRate:0.43,awd:false,safetyRating:5,featureScore:89,recallScore:76,techMaturity:86,bodyType:"suv",marketDemand:74},
  {id:20, make:"Toyota",  model:"RAV4",            year:2022,trim:"XLE",            msrp:31000, fuelType:"gas",   fuelEcon:8.9,  reliabilityIndex:85,maintenanceCostYear:880, insuranceBaseYear:1880,depreciationRate:0.28,awd:true, safetyRating:5,featureScore:72,recallScore:86,techMaturity:82,bodyType:"suv",marketDemand:89},
  {id:23, make:"Chevrolet",model:"Equinox EV",     year:2024,trim:"RS",             msrp:46000, fuelType:"ev",    fuelEcon:17.0, reliabilityIndex:68,maintenanceCostYear:580, insuranceBaseYear:2300,depreciationRate:0.48,awd:false,safetyRating:5,featureScore:82,recallScore:64,techMaturity:72,bodyType:"suv",marketDemand:70},
  {id:24, make:"Mazda",   model:"CX-50",           year:2024,trim:"GS-L",           msrp:42000, fuelType:"gas",   fuelEcon:9.8,  reliabilityIndex:84,maintenanceCostYear:900, insuranceBaseYear:1900,depreciationRate:0.38,awd:true, safetyRating:5,featureScore:82,recallScore:85,techMaturity:79,bodyType:"suv",marketDemand:80},
  {id:25, make:"Nissan",  model:"Rogue",           year:2024,trim:"SV",             msrp:36500, fuelType:"gas",   fuelEcon:9.0,  reliabilityIndex:78,maintenanceCostYear:950, insuranceBaseYear:1870,depreciationRate:0.42,awd:true, safetyRating:5,featureScore:76,recallScore:76,techMaturity:78,bodyType:"suv",marketDemand:78},
  {id:27, make:"Nissan",  model:"Qashqai",         year:2024,trim:"SV",             msrp:31500, fuelType:"gas",   fuelEcon:8.6,  reliabilityIndex:76,maintenanceCostYear:920, insuranceBaseYear:1800,depreciationRate:0.43,awd:true, safetyRating:5,featureScore:73,recallScore:75,techMaturity:76,bodyType:"suv",marketDemand:74},
  {id:28, make:"Nissan",  model:"Ariya",           year:2024,trim:"Engage",         msrp:52000, fuelType:"ev",    fuelEcon:18.0, reliabilityIndex:70,maintenanceCostYear:540, insuranceBaseYear:2450,depreciationRate:0.46,awd:false,safetyRating:5,featureScore:84,recallScore:70,techMaturity:78,bodyType:"suv",marketDemand:68},
  {id:29, make:"Nissan",  model:"Rogue",           year:2022,trim:"SV",             msrp:27500, fuelType:"gas",   fuelEcon:9.2,  reliabilityIndex:77,maintenanceCostYear:930, insuranceBaseYear:1820,depreciationRate:0.34,awd:true, safetyRating:5,featureScore:68,recallScore:75,techMaturity:75,bodyType:"suv",marketDemand:76},
  // Lexus SUVs
  {id:48, make:"Lexus",   model:"RX 350",          year:2024,trim:"Premium",        msrp:68000, fuelType:"gas",   fuelEcon:10.8, reliabilityIndex:90,maintenanceCostYear:1200,insuranceBaseYear:2800,depreciationRate:0.28,awd:true, safetyRating:5,featureScore:90,recallScore:91,techMaturity:88,bodyType:"suv",marketDemand:86},
  {id:49, make:"Lexus",   model:"RX 500h",         year:2024,trim:"F SPORT",        msrp:82000, fuelType:"hybrid",fuelEcon:8.1,  reliabilityIndex:89,maintenanceCostYear:1250,insuranceBaseYear:3000,depreciationRate:0.26,awd:true, safetyRating:5,featureScore:93,recallScore:90,techMaturity:89,bodyType:"suv",marketDemand:84},
  {id:50, make:"Lexus",   model:"NX 350h",         year:2024,trim:"Premium",        msrp:55000, fuelType:"hybrid",fuelEcon:6.8,  reliabilityIndex:91,maintenanceCostYear:1100,insuranceBaseYear:2500,depreciationRate:0.27,awd:true, safetyRating:5,featureScore:88,recallScore:92,techMaturity:88,bodyType:"suv",marketDemand:85},
  {id:51, make:"Lexus",   model:"UX 300h",         year:2022,trim:"Luxury",         msrp:41000, fuelType:"hybrid",fuelEcon:5.8,  reliabilityIndex:92,maintenanceCostYear:1000,insuranceBaseYear:2200,depreciationRate:0.26,awd:false,safetyRating:5,featureScore:85,recallScore:93,techMaturity:87,bodyType:"suv",marketDemand:80},
  // ── TRUCKS ──
  {id:30, make:"Ford",    model:"F-150 XLT",       year:2024,trim:"XLT 4x4",        msrp:58000, fuelType:"gas",   fuelEcon:13.5, reliabilityIndex:74,maintenanceCostYear:1300,insuranceBaseYear:2200,depreciationRate:0.38,awd:true, safetyRating:5,featureScore:80,recallScore:70,techMaturity:80,bodyType:"truck",marketDemand:92},
  {id:31, make:"Ford",    model:"F-150 Lariat",    year:2024,trim:"Lariat 4x4",     msrp:72000, fuelType:"gas",   fuelEcon:14.0, reliabilityIndex:74,maintenanceCostYear:1400,insuranceBaseYear:2400,depreciationRate:0.36,awd:true, safetyRating:5,featureScore:88,recallScore:70,techMaturity:82,bodyType:"truck",marketDemand:90},
  {id:32, make:"Ford",    model:"F-150 Lightning", year:2024,trim:"XLT AWD",        msrp:79000, fuelType:"ev",    fuelEcon:28.0, reliabilityIndex:65,maintenanceCostYear:700, insuranceBaseYear:2800,depreciationRate:0.45,awd:true, safetyRating:5,featureScore:90,recallScore:62,techMaturity:80,bodyType:"truck",marketDemand:78},
  {id:33, make:"Ford",    model:"F-150",           year:2022,trim:"XLT 4x4",        msrp:45000, fuelType:"gas",   fuelEcon:13.8, reliabilityIndex:73,maintenanceCostYear:1250,insuranceBaseYear:2100,depreciationRate:0.30,awd:true, safetyRating:5,featureScore:74,recallScore:70,techMaturity:78,bodyType:"truck",marketDemand:90},
  {id:34, make:"Chevy",   model:"Silverado LT",    year:2024,trim:"LT 4x4",         msrp:57000, fuelType:"gas",   fuelEcon:13.8, reliabilityIndex:72,maintenanceCostYear:1350,insuranceBaseYear:2150,depreciationRate:0.40,awd:true, safetyRating:4,featureScore:78,recallScore:68,techMaturity:78,bodyType:"truck",marketDemand:86},
  {id:35, make:"Chevy",   model:"Silverado LTZ",   year:2024,trim:"LTZ 4x4",        msrp:73000, fuelType:"gas",   fuelEcon:14.2, reliabilityIndex:72,maintenanceCostYear:1450,insuranceBaseYear:2350,depreciationRate:0.38,awd:true, safetyRating:4,featureScore:86,recallScore:68,techMaturity:79,bodyType:"truck",marketDemand:84},
  {id:36, make:"Chevy",   model:"Silverado EV",    year:2024,trim:"WT AWD",          msrp:85000, fuelType:"ev",    fuelEcon:26.0, reliabilityIndex:62,maintenanceCostYear:720, insuranceBaseYear:3000,depreciationRate:0.48,awd:true, safetyRating:5,featureScore:88,recallScore:58,techMaturity:74,bodyType:"truck",marketDemand:72},
  {id:37, make:"GMC",     model:"Sierra SLE",      year:2024,trim:"SLE 4x4",         msrp:60000, fuelType:"gas",   fuelEcon:13.6, reliabilityIndex:73,maintenanceCostYear:1380,insuranceBaseYear:2200,depreciationRate:0.39,awd:true, safetyRating:4,featureScore:80,recallScore:69,techMaturity:78,bodyType:"truck",marketDemand:84},
  {id:38, make:"GMC",     model:"Sierra Denali",   year:2024,trim:"Denali 4x4",      msrp:88000, fuelType:"gas",   fuelEcon:14.5, reliabilityIndex:73,maintenanceCostYear:1600,insuranceBaseYear:2600,depreciationRate:0.37,awd:true, safetyRating:4,featureScore:93,recallScore:69,techMaturity:80,bodyType:"truck",marketDemand:82},
  {id:39, make:"RAM",     model:"1500 Big Horn",   year:2024,trim:"Big Horn 4x4",    msrp:59000, fuelType:"gas",   fuelEcon:13.2, reliabilityIndex:74,maintenanceCostYear:1320,insuranceBaseYear:2180,depreciationRate:0.41,awd:true, safetyRating:5,featureScore:82,recallScore:71,techMaturity:79,bodyType:"truck",marketDemand:85},
  {id:40, make:"RAM",     model:"1500 Laramie",    year:2024,trim:"Laramie 4x4",     msrp:76000, fuelType:"gas",   fuelEcon:13.5, reliabilityIndex:74,maintenanceCostYear:1500,insuranceBaseYear:2450,depreciationRate:0.39,awd:true, safetyRating:5,featureScore:91,recallScore:71,techMaturity:80,bodyType:"truck",marketDemand:83},
  {id:41, make:"RAM",     model:"1500 TRX",        year:2024,trim:"TRX 4x4",         msrp:108000,fuelType:"gas",   fuelEcon:18.5, reliabilityIndex:70,maintenanceCostYear:2000,insuranceBaseYear:3200,depreciationRate:0.35,awd:true, safetyRating:4,featureScore:95,recallScore:68,techMaturity:78,bodyType:"truck",marketDemand:75},
  {id:42, make:"Toyota",  model:"Tacoma TRD",      year:2024,trim:"TRD Off-Road",    msrp:52000, fuelType:"gas",   fuelEcon:11.8, reliabilityIndex:88,maintenanceCostYear:1000,insuranceBaseYear:2000,depreciationRate:0.26,awd:true, safetyRating:5,featureScore:78,recallScore:87,techMaturity:82,bodyType:"truck",marketDemand:93},
  {id:43, make:"Toyota",  model:"Tundra Platinum", year:2024,trim:"Platinum 4x4",    msrp:82000, fuelType:"hybrid",fuelEcon:11.2, reliabilityIndex:85,maintenanceCostYear:1100,insuranceBaseYear:2500,depreciationRate:0.30,awd:true, safetyRating:5,featureScore:88,recallScore:85,techMaturity:86,bodyType:"truck",marketDemand:88},
  {id:44, make:"Toyota",  model:"Tundra SR5",      year:2024,trim:"SR5 4x4",         msrp:62000, fuelType:"gas",   fuelEcon:13.0, reliabilityIndex:85,maintenanceCostYear:1050,insuranceBaseYear:2200,depreciationRate:0.31,awd:true, safetyRating:5,featureScore:80,recallScore:85,techMaturity:83,bodyType:"truck",marketDemand:87},
  {id:45, make:"Toyota",  model:"Land Cruiser",    year:2024,trim:"1958 4x4",        msrp:96000, fuelType:"hybrid",fuelEcon:10.5, reliabilityIndex:90,maintenanceCostYear:1400,insuranceBaseYear:3000,depreciationRate:0.22,awd:true, safetyRating:5,featureScore:90,recallScore:90,techMaturity:88,bodyType:"truck",marketDemand:85},
];

// ─────────────────────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────────────────────
function computeTCO(v, p, reg) {
  const yrs=p.ownershipYears, km=p.annualKm;
  const fuelCost = v.fuelType==="ev"
    ? (km*v.fuelEcon/100)*ELECTRICITY_PRICE*yrs
    : (km*v.fuelEcon/100)*reg.fuelPrice*yrs;
  const ins  = v.insuranceBaseYear*reg.insuranceMultiplier*yrs;
  const mnt  = v.maintenanceCostYear*yrs;
  const inc  = v.fuelType==="ev" ? reg.evIncentive : 0;
  const buy  = v.msrp - inc;
  const res  = v.msrp*(1-v.depreciationRate);
  return { tco:buy+fuelCost+ins+mnt-res, fuelCost, ins, mnt, res, buy };
}
function cScore(v,all,p,reg){ const t=all.map(x=>computeTCO(x,p,reg).tco); const mx=Math.max(...t),mn=Math.min(...t); return mx===mn?50:100*(mx-computeTCO(v,p,reg).tco)/(mx-mn); }
function rScore(v){ return 0.6*v.reliabilityIndex+0.3*v.reliabilityIndex+0.1*v.recallScore; }
function fScore(v,p){
  let u=70;
  if(p.drivingType==="highway"&&v.fuelEcon<8)u+=15;
  if(p.drivingType==="city"&&v.fuelType!=="gas")u+=20;
  if(p.annualKm>25000&&v.reliabilityIndex>82)u+=10;
  u=Math.min(100,u);
  let c=60; if(p.coldClimate&&v.awd)c+=35; else if(p.coldClimate&&!v.awd)c-=20; else if(!p.coldClimate&&!v.awd)c+=15; c=Math.min(100,Math.max(0,c));
  const b=p.bodyPreference==="any"?70:v.bodyType===p.bodyPreference?100:20;
  const f=Math.min(100,v.featureScore*(p.comfortPriority/100)+v.safetyRating*8);
  return 0.4*u+0.2*c+0.2*b+0.2*f;
}
function rkScore(v){ return Math.max(0,100-(0.5*(100-v.reliabilityIndex)*0.5+0.3*(100-v.recallScore)*0.8+0.2*(100-v.techMaturity))); }
function resScore(v){ return 0.7*(1-v.depreciationRate)*100+0.3*v.marketDemand; }
function getWeights(p){
  let w={cost:0.30,reliability:0.25,fit:0.20,risk:0.15,resale:0.10};
  if(p.annualKm>25000){w.cost+=0.08;w.fit-=0.04;w.resale-=0.04;}
  if(p.priority==="reliability"){w.reliability+=0.10;w.cost-=0.05;w.fit-=0.05;}
  if(p.priority==="comfort"){w.fit+=0.10;w.cost-=0.05;w.resale-=0.05;}
  if(p.priority==="cost"){w.cost+=0.10;w.fit-=0.05;w.resale-=0.05;}
  const t=Object.values(w).reduce((a,b)=>a+b,0); Object.keys(w).forEach(k=>w[k]/=t); return w;
}
function scoreVehicle(v,p,all,reg){
  if(v.msrp>p.budget*1.15)return null;
  if(p.bodyPreference!=="any"&&v.bodyType!==p.bodyPreference)return null;
  const w=getWeights(p),cs=cScore(v,all,p,reg),rs=rScore(v),fs=fScore(v,p),rks=rkScore(v),ress=resScore(v);
  const final=w.cost*cs+w.reliability*rs+w.fit*fs+w.risk*rks+w.resale*ress;
  return {vehicle:v,finalScore:Math.round(final*10)/10,costScore:Math.round(cs),reliabilityScore:Math.round(rs),fitScore:Math.round(fs),riskScore:Math.round(rks),resaleScore:Math.round(ress),weights:w,tco:computeTCO(v,p,reg)};
}
function runEngine(p){ const r=REGIONAL_DATA[p.province]||REGIONAL_DATA.OTHER; return D.map(v=>scoreVehicle(v,p,D,r)).filter(Boolean).sort((a,b)=>b.finalScore-a.finalScore); }

// EV vs Hybrid
function evHybridCandidates(budget,bodyPref){
  const ok=v=>v.msrp<=budget*1.15&&(bodyPref==="any"||v.bodyType===bodyPref);
  const rank=v=>v.reliabilityIndex*(1-v.depreciationRate);
  return { evs:D.filter(v=>v.fuelType==="ev"&&ok(v)).sort((a,b)=>rank(b)-rank(a)).slice(0,4), hybrids:D.filter(v=>v.fuelType==="hybrid"&&ok(v)).sort((a,b)=>rank(b)-rank(a)).slice(0,4) };
}
function buildBreakeven(ev,hy,reg,km){
  const evFY=(km*ev.fuelEcon/100)*ELECTRICITY_PRICE, hyFY=(km*hy.fuelEcon/100)*reg.fuelPrice;
  const inc=reg.evIncentive, diff=(ev.msrp-inc)-hy.msrp;
  const save=(hyFY+hy.maintenanceCostYear)-(evFY+ev.maintenanceCostYear);
  const bkYr=save>0?Math.ceil(diff/save):null;
  const yrs=Array.from({length:11},(_,i)=>i);
  const evC=yrs.map(y=>Math.round((ev.msrp-inc)+(evFY+ev.maintenanceCostYear)*y-Math.max(0,(ev.msrp-inc)*(1-ev.depreciationRate*(y/5)))));
  const hyC=yrs.map(y=>Math.round(hy.msrp+(hyFY+hy.maintenanceCostYear)*y-Math.max(0,hy.msrp*(1-hy.depreciationRate*(y/5)))));
  return {diff,save,bkYr,evFY,hyFY,yrs,evC,hyC};
}
function buildScorecard(ev,hy,reg,p){
  const km=p.annualKm,fp=reg.fuelPrice,inc=reg.evIncentive;
  const ef5=(km*ev.fuelEcon/100)*ELECTRICITY_PRICE*5, hf5=(km*hy.fuelEcon/100)*fp*5;
  const evT=(ev.msrp-inc)+ef5+ev.insuranceBaseYear*reg.insuranceMultiplier*5-ev.msrp*(1-ev.depreciationRate);
  const hyT=hy.msrp+hf5+hy.insuranceBaseYear*reg.insuranceMultiplier*5-hy.msrp*(1-hy.depreciationRate);
  const hCO2=(km*hy.fuelEcon/100)*2.31*5/1000, eCO2=(km*ev.fuelEcon/100)*0.13*5/1000;
  const dims=[
    {label:"Upfront Cost",  ev:Math.max(0,100-(ev.msrp-inc)/1000), hybrid:Math.max(0,100-hy.msrp/1000)},
    {label:"5yr Fuel",      ev:Math.max(0,100-ef5/500),            hybrid:Math.max(0,100-hf5/500)},
    {label:"Maintenance",   ev:Math.max(0,100-ev.maintenanceCostYear*5/100), hybrid:Math.max(0,100-hy.maintenanceCostYear*5/100)},
    {label:"Reliability",   ev:ev.reliabilityIndex,  hybrid:hy.reliabilityIndex},
    {label:"Tech Maturity", ev:ev.techMaturity,      hybrid:hy.techMaturity},
    {label:"Resale Value",  ev:Math.round((1-ev.depreciationRate)*100), hybrid:Math.round((1-hy.depreciationRate)*100)},
    {label:"Range/Refuel",  ev:45, hybrid:95},
    {label:"Feature Score", ev:ev.featureScore, hybrid:hy.featureScore},
  ].map(d=>({...d,ev:Math.min(100,Math.max(0,Math.round(d.ev))),hybrid:Math.min(100,Math.max(0,Math.round(d.hybrid)))}));
  return {evT,hyT,ef5,hf5,hCO2,eCO2,co2:hCO2-eCO2,dims};
}

// ─────────────────────────────────────────────────────────────
// CLAUDE API
// ─────────────────────────────────────────────────────────────
async function callClaude(prompt,max_tokens=800){
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens,messages:[{role:"user",content:prompt}]})});
    const d=await r.json(); return d.content?.find(b=>b.type==="text")?.text||"";
  }catch{return "";}
}
async function genExplanations(top3,profile){
  const sums=top3.map((r,i)=>`#${i+1}: ${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} | Score:${r.finalScore} | ${fmt(r.vehicle.msrp)} | TCO:${fmt(r.tco.tco)} | ${r.vehicle.fuelType} | Reliability:${r.vehicle.reliabilityIndex}`).join("\n");
  const txt=await callClaude(`Expert Canadian car advisor. Write a 2-sentence explanation for each vehicle. Mention real dollar savings and key strengths. Return ONLY valid JSON array:\n[{"rank":1,"headline":"short win statement","explanation":"2 sentences with real numbers"},{"rank":2,...},{"rank":3,...}]\n\nUser: ${fmt(profile.budget)} budget | ${profile.province} | ${profile.annualKm.toLocaleString()}km/yr | ${profile.drivingType} | ${profile.ownershipYears}yr | priority:${profile.priority}\n\n${sums}`);
  try{return JSON.parse(txt.replace(/```json|```/g,"").trim());}
  catch{return top3.map((r,i)=>({rank:i+1,headline:"Strong match for your needs",explanation:`Scores ${r.finalScore}/100 overall with a 5-year total cost of ${fmt(r.tco.tco)}.`}));}
}
async function genEvVerdict(ev,hy,sc,bk,profile,reg){
  return callClaude(`Canadian automotive analyst. 3 short paragraphs: cost verdict, lifestyle fit, final recommendation. Use real numbers. Plain text only.\n\nEV: ${ev.year} ${ev.make} ${ev.model} MSRP ${fmt(ev.msrp)} (after ${fmt(reg.evIncentive)} incentive: ${fmt(ev.msrp-reg.evIncentive)})\nHybrid: ${hy.year} ${hy.make} ${hy.model} MSRP ${fmt(hy.msrp)}\n${profile.province} | Fuel $${reg.fuelPrice}/L | ${profile.annualKm.toLocaleString()}km/yr | cold:${profile.coldClimate} | ${profile.ownershipYears}yr\nEV 5yr TCO:${fmt(sc.evT)} | Hybrid 5yr TCO:${fmt(sc.hyT)}\nBreakeven: ${bk.bkYr?bk.bkYr+" years":"EV doesn't break even in 10yr"}\nCO2 saved by EV: ${sc.co2.toFixed(1)} tonnes`);
}

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:"#05080f", surface:"#0d1117", surface2:"#111827", border:"#1e293b",
  accent:"#3b82f6", accentHover:"#2563eb", gold:"#f59e0b",
  green:"#10b981", red:"#ef4444", purple:"#8b5cf6",
  text:"#f1f5f9", muted:"#64748b", dim:"#334155",
  evBlue:"#3b82f6", hybGreen:"#10b981",
};
const is = { width:"100%",boxSizing:"border-box",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",color:C.text,fontSize:14,fontFamily:"monospace",outline:"none",appearance:"none" };

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
function Pill({label,color="#3b82f6"}){
  return <span style={{fontSize:10,fontWeight:700,color:"#fff",background:color,padding:"2px 8px",borderRadius:20,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>;
}
function StatBox({label,value,sub,accent=C.gold}){
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:900,color:accent,fontFamily:"monospace"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.dim,fontFamily:"monospace",marginTop:2}}>{sub}</div>}
    </div>
  );
}
function MiniBar({label,value,color}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:11,color:C.muted,fontFamily:"monospace"}}>
        <span style={{textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>
        <span style={{color:C.text,fontWeight:700}}>{value}</span>
      </div>
      <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,Math.max(0,value))}%`,background:color,borderRadius:3,transition:"width 0.7s ease"}}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ONBOARDING WIZARD
// ─────────────────────────────────────────────────────────────
const STEPS=[
  {
    id:"budget",field:"budget",
    title:"What's your total car budget?",
    sub:"Include taxes and fees. We'll find the best value within your range.",
    type:"slider",min:15000,max:150000,step:5000,
    format:v=>`$${v.toLocaleString()} CAD`,
    presets:[{l:"Under $30k",v:28000},{l:"$30–50k",v:42000},{l:"$50–80k",v:65000},{l:"$80k+",v:95000}],
  },
  {
    id:"annualKm",field:"annualKm",
    title:"How many kilometres do you drive per year?",
    sub:"This is the single biggest factor in your fuel cost calculation.",
    type:"slider",min:5000,max:60000,step:1000,
    format:v=>`${v.toLocaleString()} km`,
    presets:[{l:"Under 10k",v:8000},{l:"10–20k",v:15000},{l:"20–30k",v:25000},{l:"30k+",v:40000}],
  },
  {
    id:"drivingType",field:"drivingType",
    title:"How do you mostly drive?",
    sub:"City driving uses more fuel. Highway favours gas engines. Mixed is the sweet spot for hybrids.",
    type:"choice",
    choices:[{v:"city",l:"🏙 City",d:"Mostly stop-and-go"},{v:"mixed",l:"🔀 Mixed",d:"Both city & highway"},{v:"highway",l:"🛣 Highway",d:"Long open road drives"}],
  },
  {
    id:"province",field:"province",
    title:"Which province are you in?",
    sub:"Fuel prices, insurance rates, and EV incentives vary significantly by province.",
    type:"choice",
    choices:PROVINCES.map(p=>({v:p,l:p,d:{BC:"Highest fuel prices",AB:"No EV incentive",ON:"$5k EV rebate",QC:"$7k EV rebate",MB:"Low insurance",SK:"Low fuel prices",NS:"Moderate rates",OTHER:"National average"}[p]})),
  },
  {
    id:"climate",field:"coldClimate",
    title:"Do you deal with harsh winters?",
    sub:"Cold climates affect EV range and make AWD more valuable.",
    type:"choice",
    choices:[{v:true,l:"❄️ Yes, real winters",d:"Snow, ice, cold starts"},{v:false,l:"🌤 Mild winters",d:"Rarely below -10°C"}],
  },
  {
    id:"bodyType",field:"bodyPreference",
    title:"What kind of vehicle are you open to?",
    sub:"No preference means we cast the widest net for your budget.",
    type:"choice",
    choices:[{v:"any",l:"🔍 No preference",d:"Show me all options"},{v:"sedan",l:"🚗 Sedan",d:"Efficient & affordable"},{v:"suv",l:"🚙 SUV / Crossover",d:"Space & versatility"},{v:"truck",l:"🛻 Truck",d:"Towing & off-road"}],
  },
  {
    id:"priority",field:"priority",
    title:"What matters most to you?",
    sub:"This shifts our scoring weights to match your values.",
    type:"choice",
    choices:[{v:"balanced",l:"⚖️ Balanced",d:"Equal weight on all factors"},{v:"cost",l:"💰 Lowest cost",d:"Maximize 5-year savings"},{v:"reliability",l:"🛡 Peace of mind",d:"Minimize breakdowns & repairs"},{v:"comfort",l:"✨ Premium feel",d:"Features & driving experience"}],
  },
  {
    id:"ownership",field:"ownershipYears",
    title:"How long do you plan to keep it?",
    sub:"Longer ownership favours reliability. Shorter ownership favours low depreciation.",
    type:"choice",
    choices:[{v:3,l:"3 years",d:"Lease cycle"},{v:5,l:"5 years",d:"Most common"},{v:7,l:"7 years",d:"Long-term owner"},{v:10,l:"10 years",d:"Keep it forever"}],
  },
];

function OnboardingWizard({profile,setProfile,onComplete}){
  const [step,setStep]=useState(0);
  const [animDir,setAnimDir]=useState(1);
  const s=STEPS[step];
  const val=profile[s.field];
  const pct=Math.round((step/STEPS.length)*100);

  const go=dir=>{
    setAnimDir(dir);
    if(dir>0&&step<STEPS.length-1)setStep(step+1);
    else if(dir<0&&step>0)setStep(step-1);
    else if(dir>0)onComplete();
  };
  const pick=(v)=>{
    setProfile(p=>({...p,[s.field]:v}));
    setTimeout(()=>go(1),320);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{flex:1,height:3,background:C.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.accent},${C.gold})`,borderRadius:2,transition:"width 0.4s ease"}}/>
        </div>
        <span style={{fontSize:11,color:C.muted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{step+1} / {STEPS.length}</span>
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 24px 40px",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{marginBottom:32}}>
          <h2 style={{margin:"0 0 10px",fontSize:26,fontWeight:900,color:C.text,letterSpacing:"-0.03em",lineHeight:1.2}}>{s.title}</h2>
          <p style={{margin:0,fontSize:14,color:C.muted,lineHeight:1.6}}>{s.sub}</p>
        </div>

        {s.type==="slider"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:24}}>
              <span style={{fontSize:36,fontWeight:900,color:C.accent,fontFamily:"monospace"}}>{s.format(val)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={val}
              onChange={e=>setProfile(p=>({...p,[s.field]:+e.target.value}))}
              style={{width:"100%",accentColor:C.accent,marginBottom:20}}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:28}}>
              {s.presets.map(pr=>(
                <button key={pr.l} onClick={()=>setProfile(p=>({...p,[s.field]:pr.v}))}
                  style={{background:val===pr.v?C.accent:C.surface,border:`1px solid ${val===pr.v?C.accent:C.border}`,borderRadius:8,padding:"8px 4px",fontSize:11,color:val===pr.v?"#fff":C.muted,fontFamily:"monospace",cursor:"pointer",transition:"all 0.2s"}}>
                  {pr.l}
                </button>
              ))}
            </div>
            <button onClick={()=>go(1)} style={{width:"100%",padding:"16px",background:`linear-gradient(135deg,${C.accent},${C.accentHover})`,border:"none",borderRadius:12,fontSize:15,fontWeight:800,color:"#fff",fontFamily:"monospace",cursor:"pointer",boxShadow:`0 4px 20px ${C.accent}40`}}>
              Continue →
            </button>
          </div>
        )}

        {s.type==="choice"&&(
          <div style={{display:"grid",gridTemplateColumns:s.choices.length>4?"1fr 1fr":"1fr",gap:10}}>
            {s.choices.map(ch=>{
              const active=val===ch.v||val===(ch.v===true?"yes":ch.v===false?"no":ch.v);
              const isActive=profile[s.field]===ch.v;
              return(
                <button key={String(ch.v)} onClick={()=>pick(ch.v)}
                  style={{background:isActive?`${C.accent}18`:C.surface,border:`1.5px solid ${isActive?C.accent:C.border}`,borderRadius:12,padding:"16px 18px",textAlign:"left",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:isActive?C.text:C.muted,marginBottom:2}}>{ch.l}</div>
                    {ch.d&&<div style={{fontSize:12,color:C.dim}}>{ch.d}</div>}
                  </div>
                  <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isActive?C.accent:C.border}`,background:isActive?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isActive&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Back */}
      {step>0&&(
        <div style={{padding:"0 24px 24px",textAlign:"center"}}>
          <button onClick={()=>go(-1)} style={{background:"none",border:"none",color:C.dim,fontFamily:"monospace",fontSize:13,cursor:"pointer"}}>← Back</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYSIS SCREEN
// ─────────────────────────────────────────────────────────────
function AnalysisScreen(){
  const [step,setStep]=useState(0);
  const steps=["Scanning 51 vehicles for your budget…","Calculating 5-year total cost of ownership…","Scoring reliability & recall history…","Evaluating climate & lifestyle fit…","Ranking by your priorities…","Generating AI insights…"];
  useEffect(()=>{
    if(step<steps.length-1){const t=setTimeout(()=>setStep(s=>s+1),600);return()=>clearTimeout(t);}
  },[step]);
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{marginBottom:32,position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 1s linear infinite"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:28}}>🔍</div>
      </div>
      <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:900,color:C.text,textAlign:"center",letterSpacing:"-0.02em"}}>Analysing your profile</h2>
      <p style={{margin:"0 0 40px",fontSize:13,color:C.muted,textAlign:"center",fontFamily:"monospace"}}>Our scoring engine is working…</p>
      <div style={{width:"100%",maxWidth:400}}>
        {steps.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`,opacity:i<=step?1:0.2,transition:"opacity 0.4s"}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:i<step?C.green:i===step?C.accent:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,transition:"background 0.4s"}}>
              {i<step?"✓":i===step?"…":""}
            </div>
            <span style={{fontSize:13,color:i<=step?C.text:C.muted,fontFamily:"monospace"}}>{s}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS — HERO CARD
// ─────────────────────────────────────────────────────────────
function HeroCard({result:r,explanation:ex,tcoSavings,betterThanPct}){
  const [open,setOpen]=useState(false);
  const ft={gas:"#64748b",hybrid:C.hybGreen,ev:C.evBlue};
  const conf=r.finalScore>=80?"HIGH":r.finalScore>=65?"MEDIUM":"FAIR";
  const confC={HIGH:C.green,MEDIUM:C.gold,FAIR:C.muted}[conf];
  return(
    <div style={{background:`linear-gradient(135deg,#0f172a,#1a2035)`,border:`1px solid ${C.accent}40`,borderRadius:20,overflow:"hidden",marginBottom:24,position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${C.accent},${C.gold},transparent)`}}/>
      <div style={{padding:"24px 24px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <Pill label="🏆 Top Pick" color={C.gold}/>
          <Pill label={r.vehicle.fuelType} color={ft[r.vehicle.fuelType]}/>
          <span style={{fontSize:11,fontFamily:"monospace",color:confC,fontWeight:700,marginLeft:"auto"}}>● {conf} CONFIDENCE</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
          <div>
            <h2 style={{margin:"0 0 4px",fontSize:28,fontWeight:900,color:C.text,letterSpacing:"-0.03em"}}>{r.vehicle.year} {r.vehicle.make}</h2>
            <h3 style={{margin:"0 0 4px",fontSize:22,fontWeight:700,color:C.accent,letterSpacing:"-0.02em"}}>{r.vehicle.model}</h3>
            <p style={{margin:0,fontSize:12,color:C.muted,fontFamily:"monospace"}}>{r.vehicle.trim}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:52,fontWeight:900,color:C.green,fontFamily:"monospace",lineHeight:1}}>{r.finalScore}</div>
            <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>Match Score</div>
          </div>
        </div>

        {/* Insight pills */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:18}}>
          {tcoSavings>0&&<div style={{background:`${C.green}18`,border:`1px solid ${C.green}30`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.green,fontWeight:700}}>💰 Save {fmt(tcoSavings)} over 5 years</div>}
          {betterThanPct>0&&<div style={{background:`${C.blue}18`,border:`1px solid ${C.accent}30`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.accent,fontWeight:700}}>🛡 Better reliability than {betterThanPct}% of similar vehicles</div>}
          <div style={{background:`${C.gold}18`,border:`1px solid ${C.gold}30`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.gold,fontWeight:700}}>📍 Best value in {r.vehicle.awd?"AWD ":""}category</div>
        </div>

        {ex&&(
          <div style={{marginTop:16,padding:"14px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,borderLeft:`3px solid ${C.accent}`}}>
            <p style={{margin:"0 0 4px",fontSize:11,fontWeight:800,color:C.accent,fontFamily:"monospace",textTransform:"uppercase"}}>{ex.headline}</p>
            <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.7}}>{ex.explanation}</p>
          </div>
        )}
      </div>

      {/* TCO breakdown */}
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"16px 24px"}}>
        <p style={{margin:"0 0 12px",fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.1em"}}>5-Year Cost Breakdown · {fmt(r.vehicle.msrp)} MSRP</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[["⛽ Fuel",r.tco.fuelCost,C.gold],["🔧 Maintenance",r.tco.mnt,C.purple],["🏦 Insurance",r.tco.ins,C.accent],["📉 Depreciation",r.vehicle.msrp*r.vehicle.depreciationRate,C.red]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{l}</div>
              <div style={{fontSize:15,fontWeight:800,color:c,fontFamily:"monospace"}}>{fmtK(v)}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:C.muted,fontFamily:"monospace"}}>Total 5-Year Cost</span>
          <span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{fmt(r.tco.tco)}</span>
        </div>
      </div>

      {/* Score detail toggle */}
      <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 24px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em"}}>Score Breakdown</span>
          <span style={{color:C.muted,fontSize:12}}>{open?"▲":"▼"}</span>
        </div>
        {open&&(
          <div style={{marginTop:14}}>
            <MiniBar label="Cost Efficiency"  value={r.costScore}        color={C.green}/>
            <MiniBar label="Reliability"      value={r.reliabilityScore} color={C.accent}/>
            <MiniBar label="Fit for You"      value={r.fitScore}         color={C.purple}/>
            <MiniBar label="Risk Score"       value={r.riskScore}        color={C.gold}/>
            <MiniBar label="Resale Value"     value={r.resaleScore}      color={C.red}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPARISON TABLE (top 3)
// ─────────────────────────────────────────────────────────────
function ComparisonTable({results,explanations}){
  const cols=results.slice(0,3);
  const rc=["#f59e0b","#94a3b8","#cd7c3f"];
  const rl=["Best Pick","Runner-Up","3rd Option"];
  return(
    <div style={{marginBottom:24}}>
      <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800,color:C.text}}>Side-by-Side Comparison</h3>
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:`160px repeat(${cols.length},1fr)`,minWidth:520,gap:0}}>
          {/* Header */}
          <div style={{background:C.surface,borderRadius:"10px 0 0 0",padding:"10px 12px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`}}/>
          {cols.map((r,i)=>(
            <div key={i} style={{background:i===0?`${C.accent}18`:C.surface,padding:"12px 14px",borderBottom:`1px solid ${C.border}`,borderRight:i<cols.length-1?`1px solid ${C.border}`:"none",borderRadius:i===cols.length-1?"0 10px 0 0":"none",borderTop:i===0?`2px solid ${C.accent}`:"none"}}>
              <div style={{fontSize:10,fontFamily:"monospace",color:rc[i],fontWeight:700,marginBottom:4}}>#{i+1} {rl[i]}</div>
              <div style={{fontSize:13,fontWeight:800,color:C.text}}>{r.vehicle.make}</div>
              <div style={{fontSize:12,color:C.accent}}>{r.vehicle.model}</div>
            </div>
          ))}
          {/* Rows */}
          {[
            {l:"Score",vals:cols.map(r=><span style={{fontWeight:900,color:C.green,fontFamily:"monospace"}}>{r.finalScore}</span>)},
            {l:"Price",vals:cols.map(r=><span style={{fontFamily:"monospace"}}>{fmt(r.vehicle.msrp)}</span>)},
            {l:"5yr TCO",vals:cols.map(r=><span style={{fontFamily:"monospace",color:C.gold}}>{fmt(r.tco.tco)}</span>)},
            {l:"Fuel/yr",vals:cols.map(r=><span style={{fontFamily:"monospace"}}>{fmt(r.tco.fuelCost/5)}</span>)},
            {l:"Fuel Type",vals:cols.map(r=><Pill label={r.vehicle.fuelType} color={{gas:C.muted,hybrid:C.hybGreen,ev:C.evBlue}[r.vehicle.fuelType]}/>)},
            {l:"Reliability",vals:cols.map(r=><span style={{fontFamily:"monospace",color:r.vehicle.reliabilityIndex>=85?C.green:C.gold}}>{r.vehicle.reliabilityIndex}/100</span>)},
            {l:"AWD",vals:cols.map(r=><span style={{color:r.vehicle.awd?C.green:C.muted}}>{r.vehicle.awd?"✓ Yes":"✗ No"}</span>)},
          ].map((row,ri)=>(
            <div key={ri} style={{display:"contents"}}>
              <div style={{background:C.surface,padding:"10px 12px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,fontSize:11,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.06em"}}>{row.l}</div>
              {row.vals.map((v,ci)=>(
                <div key={ci} style={{background:ci===0?`${C.accent}08`:C.surface,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,borderRight:ci<cols.length-1?`1px solid ${C.border}`:"none",fontSize:13,color:C.text}}>{v}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {explanations&&cols.length>1&&(
        <div style={{marginTop:14,padding:"12px 16px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
          <p style={{margin:"0 0 6px",fontSize:11,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>Why #{1} wins</p>
          <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
            Compared to Option 2, <strong style={{color:C.text}}>{cols[0].vehicle.make} {cols[0].vehicle.model}</strong> saves {fmt(Math.abs(cols[0].tco.tco-cols[1].tco.tco))} over 5 years{cols[0].vehicle.reliabilityIndex>cols[1].vehicle.reliabilityIndex?" and carries a higher reliability index":""}.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WHAT-IF CONTROLS
// ─────────────────────────────────────────────────────────────
function WhatIfPanel({profile,setProfile,onRerun}){
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:16}}>🔧</span>
        <div>
          <h4 style={{margin:0,fontSize:14,fontWeight:800,color:C.text}}>What-If Controls</h4>
          <p style={{margin:0,fontSize:12,color:C.muted}}>Adjust and re-run instantly</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <label style={{display:"block",fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",marginBottom:6}}>Budget: {fmt(profile.budget)}</label>
          <input type="range" min={15000} max={150000} step={5000} value={profile.budget} onChange={e=>setProfile(p=>({...p,budget:+e.target.value}))} style={{width:"100%",accentColor:C.accent}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",marginBottom:6}}>Annual KM: {profile.annualKm.toLocaleString()}</label>
          <input type="range" min={5000} max={60000} step={1000} value={profile.annualKm} onChange={e=>setProfile(p=>({...p,annualKm:+e.target.value}))} style={{width:"100%",accentColor:C.accent}}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <select value={profile.bodyPreference} onChange={e=>setProfile(p=>({...p,bodyPreference:e.target.value}))} style={{...is,fontSize:12,padding:"10px 12px"}}>
          {[["any","Any body type"],["sedan","Sedan"],["suv","SUV"],["truck","Truck"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select value={profile.priority} onChange={e=>setProfile(p=>({...p,priority:e.target.value}))} style={{...is,fontSize:12,padding:"10px 12px"}}>
          {[["balanced","Balanced"],["cost","Cost first"],["reliability","Reliability"],["comfort","Comfort"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <button onClick={onRerun} style={{width:"100%",marginTop:14,padding:"13px",background:`linear-gradient(135deg,${C.accent},${C.accentHover})`,border:"none",borderRadius:10,fontSize:13,fontWeight:800,color:"#fff",fontFamily:"monospace",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.08em"}}>
        ↻ Update Results
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NEXT ACTIONS PANEL
// ─────────────────────────────────────────────────────────────
function NextActions({onRedo,onEvTab}){
  return(
    <div style={{marginBottom:24}}>
      <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:800,color:C.text}}>Next Steps</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {icon:"⚡",label:"Compare EV vs Hybrid",sub:"Deep cost analysis",action:onEvTab,accent:C.evBlue},
          {icon:"🔁",label:"Restart with new profile",sub:"Change your inputs",action:onRedo,accent:C.muted},
        ].map(a=>(
          <button key={a.label} onClick={a.action} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",textAlign:"left",cursor:"pointer",transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=a.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:22,marginBottom:8}}>{a.icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>{a.label}</div>
            <div style={{fontSize:11,color:C.muted}}>{a.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OTHER RESULTS (ranks 2-10)
// ─────────────────────────────────────────────────────────────
function OtherResults({results,explanations}){
  const [open,setOpen]=useState(false);
  const items=results.slice(1,open?10:3);
  return(
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:800,color:C.text}}>More Matches</h3>
        <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:11,color:C.muted,fontFamily:"monospace",cursor:"pointer"}}>
          {open?"Show less ▲":"Show all ▼"}
        </button>
      </div>
      {items.map((r,i)=>{
        const ex=explanations?.[i+1];
        const fc={gas:C.muted,hybrid:C.hybGreen,ev:C.evBlue};
        return(
          <div key={r.vehicle.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:700,color:C.muted,fontFamily:"monospace"}}>#{i+2}</span>
                <Pill label={r.vehicle.fuelType} color={fc[r.vehicle.fuelType]}/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{r.vehicle.trim} · {fmt(r.vehicle.msrp)}</div>
              {ex&&<div style={{fontSize:12,color:"#64748b",marginTop:6,lineHeight:1.5}}>{ex.explanation}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:32,fontWeight:900,color:r.finalScore>=70?C.gold:C.muted,fontFamily:"monospace"}}>{r.finalScore}</div>
              <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>TCO {fmt(r.tco.tco)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EV VS HYBRID TAB
// ─────────────────────────────────────────────────────────────
function CostChart({yrs,evC,hyC,bkYr}){
  const all=[...evC,...hyC],mx=Math.max(...all),mn=Math.min(...all),rng=mx-mn||1;
  const W=640,H=160,pL=58,pR=14,pT=14,pB=26,iW=W-pL-pR,iH=H-pT-pB;
  const xS=i=>pL+(i/(yrs.length-1))*iW, yS=v=>pT+iH-((v-mn)/rng)*iH;
  const path=data=>data.map((v,i)=>`${i===0?"M":"L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");
  const bkX=bkYr&&bkYr<=10?xS(bkYr):null;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      {[0,0.33,0.66,1].map(f=>{const y=pT+iH*(1-f),val=mn+rng*f;return<g key={f}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={C.border} strokeWidth="1"/><text x={pL-4} y={y+4} textAnchor="end" fontSize="8" fill={C.muted} fontFamily="monospace">${Math.round(val/1000)}k</text></g>;})}
      {yrs.map(y=><text key={y} x={xS(y)} y={H-3} textAnchor="middle" fontSize="8" fill={C.muted} fontFamily="monospace">Y{y}</text>)}
      {bkX&&<><line x1={bkX} y1={pT} x2={bkX} y2={pT+iH} stroke={C.gold} strokeWidth="1.5" strokeDasharray="4,3"/><text x={bkX+3} y={pT+11} fontSize="8" fill={C.gold} fontFamily="monospace">Breakeven</text></>}
      <path d={path(hyC)} fill="none" stroke={C.hybGreen} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d={path(evC)} fill="none" stroke={C.evBlue}   strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx={xS(yrs.length-1)} cy={yS(evC[yrs.length-1])} r="4" fill={C.evBlue}/>
      <circle cx={xS(yrs.length-1)} cy={yS(hyC[yrs.length-1])} r="4" fill={C.hybGreen}/>
      <rect x={pL} y={pT} width="8" height="8" fill={C.evBlue} rx="1"/>
      <text x={pL+11} y={pT+8} fontSize="8" fill="#94a3b8" fontFamily="monospace">EV</text>
      <rect x={pL+34} y={pT} width="8" height="8" fill={C.hybGreen} rx="1"/>
      <text x={pL+45} y={pT+8} fontSize="8" fill="#94a3b8" fontFamily="monospace">Hybrid</text>
    </svg>
  );
}

function EVHybridTab({profile}){
  const reg=REGIONAL_DATA[profile.province]||REGIONAL_DATA.OTHER;
  const {evs,hybrids}=evHybridCandidates(profile.budget,profile.bodyPreference);
  const [selEV,setSelEV]=useState(0);
  const [selHY,setSelHY]=useState(0);
  const [verdict,setVerdict]=useState(null);
  const [loading,setLoading]=useState(false);
  if(!evs.length||!hybrids.length) return(
    <div style={{textAlign:"center",padding:"60px 0",color:C.muted,fontFamily:"monospace"}}>
      <div style={{fontSize:32,marginBottom:12}}>⚡</div>
      <p>{!evs.length?"No EVs within budget.":"No Hybrids within budget."}</p>
      <p style={{fontSize:12}}>Try a higher budget or remove body type filter.</p>
    </div>
  );
  const ev=evs[Math.min(selEV,evs.length-1)];
  const hy=hybrids[Math.min(selHY,hybrids.length-1)];
  const sc=buildScorecard(ev,hy,reg,profile);
  const bk=buildBreakeven(ev,hy,reg,profile.annualKm);
  const evW=sc.evT<sc.hyT;
  const handleVerdict=async()=>{setLoading(true);setVerdict(null);const t=await genEvVerdict(ev,hy,sc,bk,profile,reg);setVerdict(t);setLoading(false);};
  return(
    <div>
      <div style={{marginBottom:22}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <Pill label="⚡ EV" color={C.evBlue}/><span style={{fontSize:10,color:C.dim}}>vs</span><Pill label="🌿 Hybrid" color={C.hybGreen}/>
          <span style={{fontSize:10,color:C.dim,fontFamily:"monospace"}}>{profile.province} · {profile.annualKm.toLocaleString()} km/yr</span>
        </div>
        <h2 style={{margin:0,fontSize:22,fontWeight:900,color:C.text,letterSpacing:"-0.02em"}}>EV vs Hybrid Deep Dive</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
        <div style={{background:C.surface,border:`1px solid ${C.evBlue}30`,borderRadius:10,padding:14}}>
          <p style={{margin:"0 0 8px",fontSize:10,color:C.evBlue,fontFamily:"monospace",textTransform:"uppercase"}}>⚡ Select EV</p>
          <select value={selEV} onChange={e=>{setSelEV(+e.target.value);setVerdict(null);}} style={{...is,border:`1px solid ${C.evBlue}30`,fontSize:12}}>
            {evs.map((v,i)=><option key={v.id} value={i}>{v.year} {v.make} {v.model} — ${v.msrp.toLocaleString()}</option>)}
          </select>
          <p style={{margin:"7px 0 0",fontSize:11,color:C.muted,fontFamily:"monospace"}}>After ${reg.evIncentive.toLocaleString()} incentive: <span style={{color:C.evBlue,fontWeight:700}}>${(ev.msrp-reg.evIncentive).toLocaleString()}</span></p>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.hybGreen}30`,borderRadius:10,padding:14}}>
          <p style={{margin:"0 0 8px",fontSize:10,color:C.hybGreen,fontFamily:"monospace",textTransform:"uppercase"}}>🌿 Select Hybrid</p>
          <select value={selHY} onChange={e=>{setSelHY(+e.target.value);setVerdict(null);}} style={{...is,border:`1px solid ${C.hybGreen}30`,fontSize:12}}>
            {hybrids.map((v,i)=><option key={v.id} value={i}>{v.year} {v.make} {v.model} — ${v.msrp.toLocaleString()}</option>)}
          </select>
          <p style={{margin:"7px 0 0",fontSize:11,color:C.muted,fontFamily:"monospace"}}>Fuel: <span style={{color:C.hybGreen,fontWeight:700}}>{hy.fuelEcon} L/100km</span></p>
        </div>
      </div>
      <div style={{background:evW?"linear-gradient(135deg,#0d1a2e,#0f172a)":"linear-gradient(135deg,#0a1f16,#0f172a)",border:`1px solid ${evW?C.evBlue+"40":C.hybGreen+"40"}`,borderRadius:12,padding:"16px 20px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{margin:"0 0 4px",fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>5-Year TCO Winner</p>
          <p style={{margin:"0 0 4px",fontSize:18,fontWeight:900,color:evW?C.evBlue:C.hybGreen,fontFamily:"monospace"}}>{evW?`${ev.make} ${ev.model} (EV)`:`${hy.make} ${hy.model} (Hybrid)`}</p>
          <p style={{margin:0,fontSize:12,color:C.muted,fontFamily:"monospace"}}>Saves <span style={{color:C.gold,fontWeight:700}}>${Math.round(Math.abs(sc.evT-sc.hyT)).toLocaleString()}</span> over 5 years</p>
        </div>
        <div style={{textAlign:"right",fontFamily:"monospace"}}>
          <div style={{fontSize:10,color:C.muted}}>EV 5yr TCO</div><div style={{fontSize:16,fontWeight:800,color:C.evBlue}}>{fmt(sc.evT)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:6}}>Hybrid 5yr TCO</div><div style={{fontSize:16,fontWeight:800,color:C.hybGreen}}>{fmt(sc.hyT)}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[
          {l:"Breakeven",ev:bk.bkYr?`Yr ${bk.bkYr}`:">10yr",hy:"Day 1",ec:bk.bkYr&&bk.bkYr<=profile.ownershipYears?C.evBlue:C.red,note:bk.bkYr&&bk.bkYr<=profile.ownershipYears?"Within ownership":"Doesn't break even"},
          {l:"Energy/yr",ev:fmt(sc.ef5/5),hy:fmt(sc.hf5/5),ec:sc.ef5<sc.hf5?C.evBlue:"#94a3b8",note:`EV saves ${fmt((sc.hf5-sc.ef5)/5)}/yr`},
          {l:"CO₂ 5yr",ev:sc.co2>0?`-${sc.co2.toFixed(1)}t`:`+${Math.abs(sc.co2).toFixed(1)}t`,hy:"baseline",ec:sc.co2>0?C.evBlue:"#94a3b8",note:`Hybrid emits ${sc.hCO2.toFixed(1)}t`},
        ].map(m=>(
          <div key={m.l} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
            <p style={{margin:"0 0 8px",fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>{m.l}</p>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,fontWeight:800,color:m.ec,fontFamily:"monospace"}}>⚡ {m.ev}</span>
              <span style={{fontSize:12,fontWeight:800,color:C.hybGreen,fontFamily:"monospace"}}>🌿 {m.hy}</span>
            </div>
            <p style={{margin:0,fontSize:10,color:C.dim,fontFamily:"monospace",lineHeight:1.4}}>{m.note}</p>
          </div>
        ))}
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 14px 8px",marginBottom:18}}>
        <p style={{margin:"0 0 2px",fontSize:11,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>Cumulative Cost — 10 Year View</p>
        <p style={{margin:"0 0 10px",fontSize:10,color:C.dim,fontFamily:"monospace"}}>{bk.bkYr?`EV breakeven at year ${bk.bkYr}`:"Hybrid cheaper throughout"}</p>
        <CostChart yrs={bk.yrs} evC={bk.evC} hyC={bk.hyC} bkYr={bk.bkYr}/>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:18}}>
        <p style={{margin:"0 0 16px",fontSize:11,color:C.muted,fontFamily:"monospace",textTransform:"uppercase"}}>Head-to-Head Scorecard</p>
        {sc.dims.map(d=>{const ew=d.ev>=d.hybrid;return(
          <div key={d.label} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11,fontFamily:"monospace"}}>
              <span style={{color:C.evBlue,fontWeight:700}}>⚡ {d.ev}</span>
              <span style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>{d.label}</span>
              <span style={{color:C.hybGreen,fontWeight:700}}>🌿 {d.hybrid}</span>
            </div>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              <div style={{flex:1,display:"flex",justifyContent:"flex-end"}}><div style={{width:`${d.ev}%`,height:6,background:ew?C.evBlue:"#1e3a5f",borderRadius:"3px 0 0 3px",transition:"width 0.6s"}}/></div>
              <div style={{width:2,height:12,background:C.bg,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{width:`${d.hybrid}%`,height:6,background:!ew?C.hybGreen:"#0d3320",borderRadius:"0 3px 3px 0",transition:"width 0.6s"}}/></div>
            </div>
          </div>
        );})}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          <span style={{fontSize:12,color:C.evBlue,fontFamily:"monospace",fontWeight:700}}>EV wins: {sc.dims.filter(d=>d.ev>=d.hybrid).length}/{sc.dims.length}</span>
          <span style={{fontSize:12,color:C.hybGreen,fontFamily:"monospace",fontWeight:700}}>Hybrid wins: {sc.dims.filter(d=>d.hybrid>d.ev).length}/{sc.dims.length}</span>
        </div>
      </div>
      {profile.coldClimate&&(
        <div style={{background:"#1a1200",border:`1px solid ${C.gold}30`,borderRadius:10,padding:"12px 16px",marginBottom:18}}>
          <p style={{margin:"0 0 4px",fontSize:11,color:C.gold,fontFamily:"monospace",fontWeight:700}}>⚠ Cold Climate Note</p>
          <p style={{margin:0,fontSize:12,color:"#94a3b8",lineHeight:1.6}}>EV range drops 20–40% in cold Canadian winters. Home charging installation costs $800–$2,000. Hybrids have no range penalty and instant cabin heat.</p>
        </div>
      )}
      <button onClick={handleVerdict} disabled={loading} style={{width:"100%",padding:"14px",background:loading?C.surface:`linear-gradient(135deg,#1d4ed8,${C.accent})`,border:"none",borderRadius:10,fontSize:13,fontWeight:800,color:loading?C.muted:"#fff",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.1em",cursor:loading?"not-allowed":"pointer",marginBottom:verdict?16:0,boxShadow:loading?"none":`0 4px 20px ${C.accent}40`}}>
        {loading?"⟳ Generating AI Verdict...":"⚡ Generate AI Verdict for My Profile"}
      </button>
      {verdict&&(
        <div style={{background:`linear-gradient(135deg,#0f172a,#1a1f35)`,border:`1px solid ${C.accent}30`,borderRadius:12,padding:20}}>
          <p style={{margin:"0 0 12px",fontSize:10,color:C.evBlue,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700}}>⚡ AI Verdict · {ev.make} {ev.model} vs {hy.make} {hy.model}</p>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{verdict}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function CarDecisionEngine(){
  const [screen,setScreen]=useState("landing"); // landing | onboarding | analyzing | results
  const [tab,setTab]=useState("results");
  const [profile,setProfile]=useState({
    budget:45000,province:"ON",annualKm:18000,
    drivingType:"mixed",coldClimate:true,familySize:2,
    bodyPreference:"any",priority:"balanced",
    ownershipYears:5,comfortPriority:60,
  });
  const [results,setResults]=useState(null);
  const [explanations,setExplanations]=useState(null);

  const startAnalysis=useCallback(async(p=profile)=>{
    setScreen("analyzing");
    await new Promise(r=>setTimeout(r,3800));
    const scored=runEngine(p);
    const top3=scored.slice(0,3);
    setResults({top3,all:scored});
    setScreen("results");
    setTab("results");
    const exps=await genExplanations(top3,p);
    setExplanations(exps);
  },[profile]);

  const onOnboardingComplete=()=>startAnalysis(profile);

  // TCO insights
  const allTCOs=results?.all?.map(r=>r.tco.tco)||[];
  const maxTCO=Math.max(...allTCOs);
  const top=results?.top3?.[0];
  const tcoSavings=top?Math.round(maxTCO-top.tco.tco):0;
  const betterThanPct=top?Math.round((results.all.filter(r=>r.vehicle.reliabilityIndex<top.vehicle.reliabilityIndex).length/results.all.length)*100):0;

  // ── LANDING ──
  if(screen==="landing") return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${C.accent}18`,border:`1px solid ${C.accent}30`,borderRadius:20,padding:"6px 16px",marginBottom:24}}>
          <div style={{width:6,height:6,background:C.green,borderRadius:"50%",boxShadow:`0 0 8px ${C.green}`}}/>
          <span style={{fontSize:11,color:C.accent,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.12em"}}>AI-Powered · 51 Vehicles · Canadian Market</span>
        </div>
      </div>
      <h1 style={{margin:"0 0 16px",fontSize:"clamp(28px,5vw,52px)",fontWeight:900,color:C.text,letterSpacing:"-0.04em",lineHeight:1.1,maxWidth:640}}>
        Stop guessing.<br/><span style={{color:C.accent}}>Buy the right car</span><br/>with confidence.
      </h1>
      <p style={{margin:"0 0 12px",fontSize:16,color:C.muted,maxWidth:520,lineHeight:1.7}}>
        Most Canadians overpay by <strong style={{color:C.gold}}>$8,000–$15,000</strong> over 5 years by choosing the wrong vehicle. Our engine runs the full math so you don't have to.
      </p>
      <p style={{margin:"0 0 40px",fontSize:13,color:C.dim,fontFamily:"monospace"}}>Takes 2 minutes · No signup · Fully unbiased</p>
      <button onClick={()=>setScreen("onboarding")} style={{padding:"18px 48px",background:`linear-gradient(135deg,${C.accent},${C.accentHover})`,border:"none",borderRadius:14,fontSize:17,fontWeight:900,color:"#fff",cursor:"pointer",boxShadow:`0 8px 32px ${C.accent}50`,letterSpacing:"-0.01em",marginBottom:32}}>
        Find My Best Car →
      </button>
      <div style={{display:"flex",gap:32,justifyContent:"center",flexWrap:"wrap"}}>
        {[["51","Vehicles analyzed"],["5","Scoring dimensions"],["100%","Data-driven, no ads"]].map(([v,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:"monospace"}}>{v}</div>
            <div style={{fontSize:11,color:C.muted}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ONBOARDING ──
  if(screen==="onboarding") return <OnboardingWizard profile={profile} setProfile={setProfile} onComplete={onOnboardingComplete}/>;

  // ── ANALYZING ──
  if(screen==="analyzing") return <AnalysisScreen/>;

  // ── RESULTS ──
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Georgia,serif"}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"16px 24px 0",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(10px)"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,background:C.green,borderRadius:"50%",boxShadow:`0 0 8px ${C.green}`}}/>
              <span style={{fontSize:12,fontWeight:700,color:C.text}}>Car Decision Engine</span>
              <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>v2.1 · 51 vehicles</span>
            </div>
            <button onClick={()=>setScreen("onboarding")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:11,color:C.muted,fontFamily:"monospace",cursor:"pointer"}}>
              ← New Search
            </button>
          </div>
          <div style={{display:"flex",gap:0}}>
            {[["results","My Results"],["ev-hybrid","⚡ EV vs Hybrid"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px 16px",fontSize:12,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.06em",color:tab===k?C.gold:C.muted,borderBottom:tab===k?`2px solid ${C.gold}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s",whiteSpace:"nowrap"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:720,margin:"0 auto",padding:"28px 24px"}}>
        {tab==="results"&&results&&(
          <>
            {/* Profile summary strip */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:24,display:"flex",gap:16,flexWrap:"wrap"}}>
              {[
                [fmt(profile.budget),"Budget"],
                [profile.province,"Province"],
                [`${profile.annualKm.toLocaleString()} km`,"Annual KM"],
                [profile.drivingType,"Driving"],
                [`${profile.ownershipYears} yr`,"Ownership"],
              ].map(([v,l])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"monospace"}}>{v}</div>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Hero */}
            <HeroCard result={results.top3[0]} explanation={explanations?.[0]} tcoSavings={tcoSavings} betterThanPct={betterThanPct}/>

            {/* Comparison */}
            {results.top3.length>1&&<ComparisonTable results={results.top3} explanations={explanations}/>}

            {/* What-If */}
            <WhatIfPanel profile={profile} setProfile={setProfile} onRerun={()=>startAnalysis(profile)}/>

            {/* Other results */}
            <OtherResults results={results.all} explanations={explanations}/>

            {/* Methodology note */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span>🔍</span>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>How this score works</span>
              </div>
              <p style={{margin:"0 0 8px",fontSize:12,color:"#64748b",lineHeight:1.6}}>
                Each vehicle is scored across 5 weighted dimensions: Cost Efficiency (5-yr TCO), Reliability, Personalized Fit, Risk Score, and Resale Value. Weights shift based on your stated priorities.
              </p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(results.top3[0]?.weights||{}).map(([k,v])=>(
                  <span key={k} style={{fontSize:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontFamily:"monospace",color:C.muted}}>
                    {k}: {Math.round(v*100)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Next Actions */}
            <NextActions onRedo={()=>setScreen("onboarding")} onEvTab={()=>setTab("ev-hybrid")}/>
          </>
        )}

        {tab==="results"&&!results&&(
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <p style={{color:C.muted,fontFamily:"monospace"}}>No results yet.</p>
            <button onClick={()=>setScreen("onboarding")} style={{marginTop:12,padding:"12px 24px",background:C.accent,border:"none",borderRadius:10,color:"#fff",fontFamily:"monospace",cursor:"pointer",fontSize:13,fontWeight:700}}>← Start Over</button>
          </div>
        )}

        {tab==="ev-hybrid"&&<EVHybridTab profile={profile}/>}
      </div>
    </div>
  );
}
