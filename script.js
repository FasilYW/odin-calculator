// Calculator logic with styled UI, keyboard support, decimal, backspace, percent, chaining, rounding, and extras.
// Basic math functions
function add(a,b){return a+b;}
function subtract(a,b){return a-b;}
function multiply(a,b){return a*b;}
function divide(a,b){
  if (b === 0) return null; // represent divide by zero
  return a/b;
}

function operate(op, a, b){
  a = Number(a); b = Number(b);
  switch(op){
    case '+': return add(a,b);
    case '-': return subtract(a,b);
    case '*': return multiply(a,b);
    case '/': return divide(a,b);
    case '%': return (a * b) / 100; // percent used as operator between numbers -> interpret as a% of b
    default: return null;
  }
}

// DOM elements
const display = document.getElementById('display');
const buttons = document.querySelectorAll('.btn');
const clearBtn = document.getElementById('clear');
const backBtn = document.getElementById('back');
const decimalBtn = document.getElementById('decimal');
const equalsBtn = document.getElementById('equals');
const precisionSelect = document.getElementById('precision');

let firstValue = null;
let operator = null;
let waitingForSecond = false;
let displayValue = '0';
let lastInputWasEqual = false;

// Helpers
function updateDisplay(){
  display.textContent = displayValue;
}

function roundResult(num){
  const prec = Number(precisionSelect.value);
  // avoid floating imprecision by using toFixed then trim
  if (!isFinite(num)) return num;
  const fixed = Number(num.toFixed(prec));
  return fixed;
}

function resetAll(){
  firstValue = null;
  operator = null;
  waitingForSecond = false;
  displayValue = '0';
  lastInputWasEqual = false;
  enableDecimal(true);
  updateDisplay();
}

// Decimal enable/disable
function enableDecimal(enabled){
  decimalBtn.disabled = !enabled;
  decimalBtn.style.opacity = enabled ? '1' : '0.5';
}

// Input handling
buttons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const num = btn.dataset.num;
    const op = btn.dataset.op;
    if (num !== undefined) handleDigit(num);
    else if (op !== undefined) handleOperator(op);
    else if (btn.id === 'equals') handleEquals();
  });
});

clearBtn.addEventListener('click', () => {
  resetAll();
});

backBtn.addEventListener('click', () => {
  handleBackspace();
});

decimalBtn.addEventListener('click', () => {
  if (displayValue.includes('.')) return;
  displayValue += '.';
  enableDecimal(false);
  lastInputWasEqual = false;
  updateDisplay();
});

function handleDigit(d){
  if (lastInputWasEqual){
    // if result is showing and user enters digit, start fresh
    displayValue = d;
    lastInputWasEqual = false;
    firstValue = null;
    operator = null;
    waitingForSecond = false;
    enableDecimal(!displayValue.includes('.'));
    updateDisplay();
    return;
  }
  if (waitingForSecond){
    // starting second number
    displayValue = d;
    waitingForSecond = false;
    enableDecimal(true);
    updateDisplay();
    return;
  }
  // normal append
  if (displayValue === '0') displayValue = d;
  else displayValue += d;
  updateDisplay();
}

function handleOperator(op){
  // if operator pressed twice, change operator without evaluating
  if (operator && waitingForSecond && !lastInputWasEqual){
    operator = op;
    return;
  }

  if (firstValue === null){
    firstValue = displayValue;
    operator = op;
    waitingForSecond = true;
  } else if (!waitingForSecond){
    // we have firstValue, operator, and a second number entered -> evaluate then set new operator
    const result = operate(operator, Number(firstValue), Number(displayValue));
    if (result === null && operator === '/') {
      // divide by zero
      displayValue = "Nice try. Can't divide by 0.";
      updateDisplay();
      // reset state so user can start over
      firstValue = null; operator = null; waitingForSecond = false; lastInputWasEqual = true;
      return;
    }
    const rounded = roundResult(result);
    displayValue = String(rounded);
    updateDisplay();
    firstValue = displayValue;
    operator = op;
    waitingForSecond = true;
    lastInputWasEqual = false;
  } else {
    // operator present but second number hasn't been entered; replace operator
    operator = op;
  }
  enableDecimal(!displayValue.includes('.'));
}

// equals
function handleEquals(){
  if (operator === null || firstValue === null) return; // need two numbers and operator
  const result = operate(operator, Number(firstValue), Number(displayValue));
  if (result === null && operator === '/') {
    displayValue = "Division by zero is a no-go.";
    updateDisplay();
    firstValue = null; operator = null; waitingForSecond = false; lastInputWasEqual = true;
    return;
  }
  const rounded = roundResult(result);
  displayValue = String(rounded);
  updateDisplay();
  // prepare for new input: treat result as firstValue
  firstValue = displayValue;
  operator = null;
  waitingForSecond = false;
  lastInputWasEqual = true;
  enableDecimal(!displayValue.includes('.'));
}

// backspace behaviour
function handleBackspace(){
  if (lastInputWasEqual){
    // if result displayed, backspace clears and reset
    resetAll();
    return;
  }
  if (displayValue.length <= 1){
    displayValue = '0';
  } else {
    displayValue = displayValue.slice(0, -1);
  }
  if (!displayValue.includes('.')) enableDecimal(true);
  updateDisplay();
}

// Keyboard support
window.addEventListener('keydown', (e) => {
  const key = e.key;
  if ((/^[0-9]$/).test(key)){
    e.preventDefault();
    handleDigit(key);
  } else if (key === '.' || key === ','){
    e.preventDefault();
    if (!displayValue.includes('.')){
      displayValue += '.';
      enableDecimal(false);
      updateDisplay();
    }
  } else if (key === 'Backspace'){
    e.preventDefault();
    handleBackspace();
  } else if (key === 'Escape'){
    e.preventDefault();
    resetAll();
  } else if (key === '=' || key === 'Enter'){
    e.preventDefault();
    handleEquals();
  } else if (['+','-','*','/','%'].includes(key)){
    e.preventDefault();
    handleOperator(key);
  }
});

// precision change: when changed, re-round current display if numeric
precisionSelect.addEventListener('change', () => {
  if (!isNaN(Number(displayValue)) && isFinite(Number(displayValue))){
    displayValue = String(roundResult(Number(displayValue)));
    updateDisplay();
  }
});

// init
resetAll();
