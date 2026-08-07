// Fully offline math engine: tokenizer, shunting-yard RPN, evaluator with steps,
// and a linear/quadratic equation solver. No external calls.

const FUNCTIONS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  log: (x) => Math.log10(x), ln: (x) => Math.log(x), log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
};

const CONSTANTS = {
  pi: Math.PI, e: Math.E, tau: Math.PI * 2,
};

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 4, 'u-': 3 };
const RIGHT_ASSOC = { '^': true, 'u-': true };

const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^', '%': '%' };

function factorial(n) {
  if (n < 0) throw new Error('Factorial of a negative number is undefined');
  if (n > 170) throw new Error('Factorial too large');
  if (!Number.isInteger(n)) return gamma(n + 1);
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Lanczos approximation of the Gamma function (for non-integer factorials)
function gamma(z) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function formatResult(n) {
  if (Number.isNaN(n)) return 'NaN';
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (Math.abs(n) < 1e-12) return '0';
  return String(parseFloat(n.toPrecision(12)));
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[\d.]/.test(c)) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) { num += expr[i]; i++; }
      const val = parseFloat(num);
      if (Number.isNaN(val)) throw new Error(`Invalid number: ${num}`);
      tokens.push({ type: 'number', value: val });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let name = '';
      while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) { name += expr[i]; i++; }
      tokens.push({ type: 'identifier', value: name.toLowerCase(), raw: name });
      continue;
    }
    if ('+-*/^%!=(),'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

// Resolve identifiers to constants/functions/variables and apply
// implicit multiplication + unary minus handling.
function preprocess(tokens, vars = {}) {
  const classified = tokens.map((t) => {
    if (t.type !== 'identifier') return t;
    const name = t.value;
    if (name in CONSTANTS) return { type: 'number', value: CONSTANTS[name] };
    if (name in FUNCTIONS) return { type: 'function', value: name };
    if (name in vars) return { type: 'number', value: vars[name] };
    throw new Error(`Unknown identifier: ${t.raw}`);
  });

  const out = [];
  for (const t of classified) {
    const prev = out[out.length - 1];
    // unary minus detection
    if (t.type === 'op' && t.value === '-') {
      const prevIsValue =
        prev &&
        (prev.type === 'number' ||
          prev.type === 'function' ||
          (prev.type === 'op' && (prev.value === ')' || prev.value === '!')));
      if (!prevIsValue) {
        out.push({ type: 'op', value: 'u-' });
        continue;
      }
    }
    // implicit multiplication: value followed by value-start
    if (prev) {
      const prevIsValue =
        prev.type === 'number' || (prev.type === 'op' && (prev.value === ')' || prev.value === '!'));
      const curIsValueStart =
        t.type === 'number' || t.type === 'function' || (t.type === 'op' && t.value === '(');
      if (prevIsValue && curIsValueStart) out.push({ type: 'op', value: '*' });
    }
    out.push(t);
  }
  return out;
}

function toRPN(tokens) {
  const output = [];
  const ops = [];
  for (const t of tokens) {
    if (t.type === 'number') {
      output.push(t);
    } else if (t.type === 'function') {
      ops.push(t);
    } else if (t.value === '!') {
      output.push(t); // postfix
    } else if (t.value === '(') {
      ops.push(t);
    } else if (t.value === ')') {
      while (ops.length && ops[ops.length - 1].value !== '(') output.push(ops.pop());
      if (!ops.length) throw new Error('Mismatched parentheses');
      ops.pop();
      if (ops.length && ops[ops.length - 1].type === 'function') output.push(ops.pop());
    } else if (t.value === 'u-') {
      ops.push(t); // prefix, no popping
    } else if (t.value === ',') {
      while (ops.length && ops[ops.length - 1].value !== '(') output.push(ops.pop());
    } else {
      // binary operator
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.value === '(') break;
        if (top.type === 'function' || top.value === '!') { output.push(ops.pop()); continue; }
        const topPrec = PRECEDENCE[top.value];
        const curPrec = PRECEDENCE[t.value];
        if (topPrec === undefined) break;
        if (topPrec > curPrec || (topPrec === curPrec && !RIGHT_ASSOC[t.value])) {
          output.push(ops.pop());
        } else break;
      }
      ops.push(t);
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op.value === '(') throw new Error('Mismatched parentheses');
    output.push(op);
  }
  return output;
}

function evaluateRPN(rpn) {
  const stack = [];
  const steps = [];
  for (const t of rpn) {
    if (t.type === 'number') { stack.push(t.value); continue; }
    if (t.value === 'u-') {
      const a = stack.pop();
      const r = -a;
      steps.push(`−(${formatResult(a)}) = ${formatResult(r)}`);
      stack.push(r);
      continue;
    }
    if (t.value === '!') {
      const a = stack.pop();
      const r = factorial(a);
      steps.push(`${formatResult(a)}! = ${formatResult(r)}`);
      stack.push(r);
      continue;
    }
    if (t.type === 'function') {
      const a = stack.pop();
      const fn = FUNCTIONS[t.value];
      const r = fn(a);
      steps.push(`${t.value}(${formatResult(a)}) = ${formatResult(r)}`);
      stack.push(r);
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) throw new Error('Invalid expression');
    let r;
    switch (t.value) {
      case '+': r = a + b; break;
      case '-': r = a - b; break;
      case '*': r = a * b; break;
      case '/': r = a / b; break;
      case '%': r = a % b; break;
      case '^': r = Math.pow(a, b); break;
      default: throw new Error(`Unknown operator: ${t.value}`);
    }
    steps.push(`${formatResult(a)} ${OP_SYMBOL[t.value] || t.value} ${formatResult(b)} = ${formatResult(r)}`);
    stack.push(r);
  }
  if (stack.length !== 1) throw new Error('Invalid expression');
  return { result: stack[0], steps };
}

export function evaluateExpression(expr, vars = {}) {
  const tokens = tokenize(expr);
  const processed = preprocess(tokens, vars);
  const rpn = toRPN(processed);
  const { result } = evaluateRPN(rpn);
  return result;
}

export function evaluateWithSteps(expr, vars = {}) {
  const tokens = tokenize(expr);
  const processed = preprocess(tokens, vars);
  const rpn = toRPN(processed);
  return evaluateRPN(rpn);
}

// ---- Equation solver (linear & quadratic, single variable x) ----
// Uses polynomial interpolation: evaluate left - right at x = 0,1,2,3
// to recover coefficients a·x² + b·x + c, then solve analytically.
export function solveEquation(equation) {
  const parts = equation.split('=');
  if (parts.length !== 2) throw new Error('Equation must contain exactly one "=" sign');
  const left = parts[0].trim();
  const right = parts[1].trim();
  if (!left || !right) throw new Error('Both sides of the equation are required');

  const f = (x) => evaluateExpression(left, { x }) - evaluateExpression(right, { x });

  let f0, f1, f2, f3;
  try {
    f0 = f(0); f1 = f(1); f2 = f(2); f3 = f(3);
  } catch (e) {
    throw new Error('Could not parse the equation. Check your syntax.');
  }
  if (![f0, f1, f2, f3].every(Number.isFinite)) {
    throw new Error('The equation is undefined at some test points and cannot be solved.');
  }

  const a = (f2 - 2 * f1 + f0) / 2;
  const b = f1 - a - f0;
  const c = f0;

  // Verify it's actually a degree ≤ 2 polynomial
  const check = 9 * a + 3 * b + c;
  if (Math.abs(check - f3) > 1e-6 * (1 + Math.abs(f3))) {
    throw new Error('Only linear and quadratic equations in x are supported.');
  }

  const eps = 1e-9;
  const isZero = (v) => Math.abs(v) < eps;
  const fmt = formatResult;
  const steps = [];

  steps.push(`Rearrange to one side: (${left}) − (${right}) = 0`);
  steps.push(`This has the standard form: a·x² + b·x + c = 0`);

  if (!isZero(a)) {
    steps.push(`Identified a quadratic equation with:`);
    steps.push(`  a = ${fmt(a)},  b = ${fmt(b)},  c = ${fmt(c)}`);
    const disc = b * b - 4 * a * c;
    steps.push(`Discriminant: Δ = b² − 4ac = (${fmt(b)})² − 4·(${fmt(a)})·(${fmt(c)}) = ${fmt(disc)}`);
    if (disc < -eps) {
      steps.push(`Since Δ < 0, there are no real solutions.`);
      return { type: 'quadratic', solutions: [], steps, coefficients: { a, b, c } };
    }
    if (Math.abs(disc) < eps) {
      steps.push(`Since Δ = 0, there is one repeated real solution:`);
      const x = -b / (2 * a);
      steps.push(`  x = −b / (2a) = ${fmt(-b)} / ${fmt(2 * a)} = ${fmt(x)}`);
      return { type: 'quadratic', solutions: [x], steps, coefficients: { a, b, c } };
    }
    steps.push(`Since Δ > 0, there are two distinct real solutions:`);
    const sq = Math.sqrt(disc);
    const x1 = (-b + sq) / (2 * a);
    const x2 = (-b - sq) / (2 * a);
    steps.push(`  x₁ = (−b + √Δ) / (2a) = (${fmt(-b)} + ${fmt(sq)}) / ${fmt(2 * a)} = ${fmt(x1)}`);
    steps.push(`  x₂ = (−b − √Δ) / (2a) = (${fmt(-b)} − ${fmt(sq)}) / ${fmt(2 * a)} = ${fmt(x2)}`);
    return { type: 'quadratic', solutions: [x1, x2], steps, coefficients: { a, b, c } };
  }

  if (!isZero(b)) {
    steps.push(`Identified a linear equation with:`);
    steps.push(`  b = ${fmt(b)},  c = ${fmt(c)}`);
    steps.push(`Equation: b·x + c = 0  →  x = −c / b`);
    const x = -c / b;
    steps.push(`  x = −(${fmt(c)}) / ${fmt(b)} = ${fmt(x)}`);
    return { type: 'linear', solutions: [x], steps, coefficients: { a: 0, b, c } };
  }

  if (!isZero(c)) {
    steps.push(`This reduces to ${fmt(c)} = 0, a contradiction — no solution exists.`);
    return { type: 'contradiction', solutions: [], steps, coefficients: { a: 0, b: 0, c } };
  }

  steps.push(`This reduces to 0 = 0, which is true for every value of x — infinitely many solutions.`);
  return { type: 'identity', solutions: [], steps, coefficients: { a: 0, b: 0, c: 0 } };
}
