// Offline linear system solver (2x2 / 3x3) via Gaussian elimination
// with partial pivoting and step-by-step row operations.
import { formatResult as fmt } from './mathEngine';

function fmtNum(n) {
  return fmt(n);
}

function formatMatrix(A) {
  const n = A.length;
  return A.map((row) => {
    const left = row.slice(0, n).map((v) => fmtNum(v)).join('  ');
    return `[ ${left}  |  ${fmtNum(row[n])} ]`;
  });
}

export function solveSystem(coefficients, constants) {
  const n = constants.length;
  if (n < 2 || n > 3) throw new Error('Only 2×2 and 3×3 systems are supported.');
  for (const row of coefficients) {
    if (row.length !== n) throw new Error('Coefficient matrix must be square.');
  }

  // Build augmented matrix (deep copy)
  const A = coefficients.map((row, i) => [...row, constants[i]]);
  const steps = [];
  steps.push('Form the augmented matrix [A | b]:');
  steps.push(formatMatrix(A));

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-12) {
      throw new Error('The system has no unique solution (singular matrix).');
    }
    if (pivot !== col) {
      [A[col], A[pivot]] = [A[pivot], A[col]];
      steps.push(`Swap R${col + 1} ↔ R${pivot + 1} (partial pivoting):`);
      steps.push(formatMatrix(A));
    }
    const pivotVal = A[col][col];
    if (Math.abs(pivotVal - 1) > 1e-12) {
      for (let j = 0; j <= n; j++) A[col][j] /= pivotVal;
      steps.push(`R${col + 1} = R${col + 1} ÷ ${fmtNum(pivotVal)}  (make the pivot 1):`);
      steps.push(formatMatrix(A));
    }
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col];
      if (Math.abs(f) > 1e-12) {
        for (let j = 0; j <= n; j++) A[r][j] -= f * A[col][j];
        steps.push(`R${r + 1} = R${r + 1} − ${fmtNum(f)}·R${col + 1}  (eliminate below pivot):`);
        steps.push(formatMatrix(A));
      }
    }
  }

  // Back-substitution
  const x = new Array(n);
  const vars = ['x', 'y', 'z'];
  steps.push('Back-substitution (solve from the bottom up):');
  for (let i = n - 1; i >= 0; i--) {
    let val = A[i][n];
    const parts = [fmtNum(A[i][n])];
    for (let j = i + 1; j < n; j++) {
      val -= A[i][j] * x[j];
      parts.push(`− ${fmtNum(A[i][j])}·${fmtNum(x[j])}`);
    }
    x[i] = val / A[i][i];
    steps.push(`${vars[i]} = (${parts.join(' ')}) ÷ ${fmtNum(A[i][i])} = ${fmtNum(x[i])}`);
  }

  return { solution: x, steps };
}
