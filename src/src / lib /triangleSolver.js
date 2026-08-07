// Offline triangle solver. Angles are in degrees. Handles SSS, SAS, SSA
// (ambiguous), and ASA/AAS — returns all sides, angles and the area with steps.
import { formatResult as fmt } from './mathEngine';

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const num = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

const SIDE_KEYS = ['a', 'b', 'c'];
const ANG_KEYS = ['A', 'B', 'C'];
const OPP = { A: 'a', B: 'b', C: 'c' };
const OPP_ANG = { a: 'A', b: 'B', c: 'C' };

function angleFromSides(o, p, q) {
  return toDeg(Math.acos((p * p + q * q - o * o) / (2 * p * q)));
}

export function solveTriangle(input) {
  const a = num(input.a), b = num(input.b), c = num(input.c);
  const A = num(input.A), B = num(input.B), C = num(input.C);
  const sides = { a, b, c };
  const angles = { A, B, C };
  const knownSides = SIDE_KEYS.filter((k) => sides[k] !== undefined && !Number.isNaN(sides[k]));
  const knownAngles = ANG_KEYS.filter((k) => angles[k] !== undefined && !Number.isNaN(angles[k]));
  const total = knownSides.length + knownAngles.length;

  if (total < 3) throw new Error('Provide at least 3 known values (sides and/or angles).');

  const steps = [];

  // SSS — three sides
  if (knownSides.length === 3) {
    if (a + b <= c || a + c <= b || b + c <= a)
      throw new Error('These sides violate the triangle inequality — not a valid triangle.');
    steps.push('Case: SSS (three sides). Use the Law of Cosines for each angle:');
    const A2 = angleFromSides(a, b, c);
    const B2 = angleFromSides(b, a, c);
    const C2 = 180 - A2 - B2;
    steps.push(`A = arccos((b² + c² − a²)/(2bc)) = ${fmt(A2)}°`);
    steps.push(`B = arccos((a² + c² − b²)/(2ac)) = ${fmt(B2)}°`);
    steps.push(`C = 180° − A − B = ${fmt(C2)}°`);
    const s = (a + b + c) / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    steps.push(`Area (Heron's formula) = ${fmt(area)}`);
    return { solutions: [{ a, b, c, A: A2, B: B2, C: C2, area }], steps };
  }

  // Two sides + one angle: SAS or SSA
  if (knownSides.length === 2 && knownAngles.length === 1) {
    const angKey = knownAngles[0];
    const angVal = angles[angKey];
    const oppSideKey = OPP[angKey];
    const included = !knownSides.includes(oppSideKey);

    if (included) {
      // SAS
      const s1k = knownSides[0], s2k = knownSides[1];
      const s1 = sides[s1k], s2 = sides[s2k];
      steps.push(`Case: SAS (sides ${s1k}, ${s2k} with included angle ${angKey}). Law of Cosines for the third side:`);
      const third = Math.sqrt(s1 * s1 + s2 * s2 - 2 * s1 * s2 * Math.cos(toRad(angVal)));
      steps.push(`${oppSideKey} = √(${s1k}² + ${s2k}² − 2·${s1k}·${s2k}·cos(${angKey})) = ${fmt(third)}`);
      const all = { ...sides, [oppSideKey]: third };
      const A2 = angleFromSides(all.a, all.b, all.c);
      const B2 = angleFromSides(all.b, all.a, all.c);
      const C2 = 180 - A2 - B2;
      steps.push(`Remaining angles via Law of Cosines: A = ${fmt(A2)}°, B = ${fmt(B2)}°, C = ${fmt(C2)}°`);
      const area = 0.5 * s1 * s2 * Math.sin(toRad(angVal));
      steps.push(`Area = ½·${s1k}·${s2k}·sin(${angKey}) = ${fmt(area)}`);
      return { solutions: [{ a: all.a, b: all.b, c: all.c, A: A2, B: B2, C: C2, area }], steps };
    }

    // SSA — ambiguous case
    const aVal = sides[oppSideKey];
    const AVal = angVal;
    const adjKey = knownSides.find((k) => k !== oppSideKey);
    const bVal = sides[adjKey];
    const adjAngKey = OPP_ANG[adjKey];
    const thirdSideKey = SIDE_KEYS.find((k) => k !== oppSideKey && k !== adjKey);
    const thirdAngKey = OPP_ANG[thirdSideKey];
    steps.push(`Case: SSA (sides ${oppSideKey}=${fmt(aVal)}, ${adjKey}=${fmt(bVal)} and angle ${angKey}=${fmt(AVal)}°). Law of Sines — ambiguous case:`);
    const sinB = (bVal * Math.sin(toRad(AVal))) / aVal;
    if (sinB > 1) {
      steps.push(`sin(${adjAngKey}) = ${adjKey}·sin(${angKey})/${oppSideKey} = ${fmt(sinB)} > 1 → no valid triangle.`);
      return { solutions: [], steps };
    }
    const solutions = [];
    const buildSol = (Bv) => {
      const Cv = 180 - AVal - Bv;
      if (Cv <= 0) return null;
      const cv = (aVal * Math.sin(toRad(Cv))) / Math.sin(toRad(AVal));
      const area = 0.5 * aVal * bVal * Math.sin(toRad(Cv));
      const res = {};
      res[oppSideKey] = aVal;
      res[adjKey] = bVal;
      res[thirdSideKey] = cv;
      res[angKey] = AVal;
      res[adjAngKey] = Bv;
      res[thirdAngKey] = Cv;
      return { ...res, area };
    };
    const B1 = toDeg(Math.asin(sinB));
    const s1 = buildSol(B1);
    if (s1) {
      steps.push(`Solution 1: ${adjAngKey} = arcsin(${fmt(sinB)}) = ${fmt(B1)}°, ${thirdAngKey} = ${fmt(s1[thirdAngKey])}°, ${thirdSideKey} = ${fmt(s1[thirdSideKey])}`);
      solutions.push(s1);
    }
    const B2 = 180 - B1;
    if (Math.abs(B2 - B1) > 1e-9) {
      const s2 = buildSol(B2);
      if (s2) {
        steps.push(`Solution 2: ${adjAngKey} = 180° − ${fmt(B1)}° = ${fmt(B2)}°, ${thirdAngKey} = ${fmt(s2[thirdAngKey])}°, ${thirdSideKey} = ${fmt(s2[thirdSideKey])}`);
        solutions.push(s2);
      }
    }
    if (solutions.length === 0) steps.push('No valid triangle satisfies these values.');
    return { solutions, steps };
  }

  // One side + two angles: ASA / AAS
  if (knownSides.length === 1 && knownAngles.length === 2) {
    const sideKey = knownSides[0];
    const sideVal = sides[sideKey];
    const itsAngKey = OPP_ANG[sideKey];
    const itsAng = angles[itsAngKey];
    const otherAngKey = knownAngles.find((k) => k !== itsAngKey);
    const otherAng = angles[otherAngKey];
    const thirdAngKey = ANG_KEYS.find((k) => k !== itsAngKey && k !== otherAngKey);
    const thirdAng = 180 - itsAng - otherAng;
    if (thirdAng <= 0) throw new Error('The two given angles sum to 180° or more — not a valid triangle.');
    steps.push(`Case: ASA/AAS (side ${sideKey} with angles ${itsAngKey}, ${otherAngKey}). Third angle:`);
    steps.push(`${thirdAngKey} = 180° − ${itsAngKey} − ${otherAngKey} = ${fmt(thirdAng)}°`);
    const otherSideKey = OPP[otherAngKey];
    const thirdSideKey = OPP[thirdAngKey];
    const sOther = (sideVal * Math.sin(toRad(otherAng))) / Math.sin(toRad(itsAng));
    const sThird = (sideVal * Math.sin(toRad(thirdAng))) / Math.sin(toRad(itsAng));
    steps.push(`${otherSideKey} = ${sideKey}·sin(${otherAngKey})/sin(${itsAngKey}) = ${fmt(sOther)}`);
    steps.push(`${thirdSideKey} = ${sideKey}·sin(${thirdAngKey})/sin(${itsAngKey}) = ${fmt(sThird)}`);
    const res = {};
    res[sideKey] = sideVal;
    res[otherSideKey] = sOther;
    res[thirdSideKey] = sThird;
    res[itsAngKey] = itsAng;
    res[otherAngKey] = otherAng;
    res[thirdAngKey] = thirdAng;
    const area = 0.5 * res.a * res.b * Math.sin(toRad(res.C));
    steps.push(`Area = ½·a·b·sin(C) = ${fmt(area)}`);
    return { solutions: [{ ...res, area }], steps };
  }

  throw new Error('Unsupported combination. Use SSS, SAS, SSA, or ASA/AAS (3 values).');
}
