/**
 * Calculator AWML Application
 * WebAssembly-compatible calculator with persistent state
 */

// Global state
let memory = 0;
let history = [];
let display = "0";
let operation = null;
let waitingForOperand = false;
let config = {
  precision: 8,
  mode: "standard",
  sound: "true",
  history_limit: 100
};

// WebAssembly-style memory management
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Mock WebAssembly exports for AWML runtime
const wasmModule = {
  memory: new WebAssembly.Memory({ initial: 1 }),
  
  // AWML entry point
  awml_calculator_main: (configPtr, configLen) => {
    try {
      // Parse configuration
      if (configPtr && configLen) {
        const configBytes = new Uint8Array(wasmModule.memory.buffer, configPtr, configLen);
        const configStr = textDecoder.decode(configBytes);
        const parsedConfig = JSON.parse(configStr);
        config = { ...config, ...parsedConfig };
      }
      
      // Initialize calculator
      log("Calculator AWML App initialized");
      log(`Mode: ${config.mode}, Precision: ${config.precision}`);
      
      // Create calculator UI
      createCalculatorUI();
      
      // Load saved state
      loadCalculatorState();
      
    } catch (error) {
      log(`Calculator initialization error: ${error.message}`);
    }
  },
  
  // Memory allocator (mock)
  awml_alloc: (size) => {
    // Simple mock allocator
    return 1000; // Return a fixed address
  }
};

// Logging function for AWML runtime
function log(message) {
  if (typeof awml_log === 'function') {
    const bytes = textEncoder.encode(message);
    awml_log(bytes.byteOffset, bytes.length);
  } else {
    console.log(`[Calculator] ${message}`);
  }
}

// Calculator logic
function createCalculatorUI() {
  const ui = `
    <div class="calculator-awml">
      <div class="display" id="calc-display">${display}</div>
      <div class="buttons">
        <div class="row">
          <button onclick="clearAll()" class="operator">C</button>
          <button onclick="clearEntry()" class="operator">CE</button>
          <button onclick="backspace()" class="operator">⌫</button>
          <button onclick="setOperation('÷')" class="operator">÷</button>
        </div>
        <div class="row">
          <button onclick="inputNumber('7')">7</button>
          <button onclick="inputNumber('8')">8</button>
          <button onclick="inputNumber('9')">9</button>
          <button onclick="setOperation('×')" class="operator">×</button>
        </div>
        <div class="row">
          <button onclick="inputNumber('4')">4</button>
          <button onclick="inputNumber('5')">5</button>
          <button onclick="inputNumber('6')">6</button>
          <button onclick="setOperation('-')" class="operator">-</button>
        </div>
        <div class="row">
          <button onclick="inputNumber('1')">1</button>
          <button onclick="inputNumber('2')">2</button>
          <button onclick="inputNumber('3')">3</button>
          <button onclick="setOperation('+')" class="operator">+</button>
        </div>
        <div class="row">
          <button onclick="memoryRecall()" class="memory">MR</button>
          <button onclick="inputNumber('0')">0</button>
          <button onclick="inputDecimal()">.</button>
          <button onclick="calculate()" class="equals">=</button>
        </div>
        <div class="row">
          <button onclick="memoryClear()" class="memory">MC</button>
          <button onclick="memoryAdd()" class="memory">M+</button>
          <button onclick="memorySubtract()" class="memory">M-</button>
          <button onclick="memoryStore()" class="memory">MS</button>
        </div>
      </div>
    </div>
  `;
  
  log("Calculator UI created with " + ui.length + " characters");
}

function inputNumber(num) {
  if (waitingForOperand) {
    display = num;
    waitingForOperand = false;
  } else {
    display = display === "0" ? num : display + num;
  }
  updateDisplay();
  playSound();
}

function inputDecimal() {
  if (waitingForOperand) {
    display = "0.";
    waitingForOperand = false;
  } else if (display.indexOf(".") === -1) {
    display += ".";
  }
  updateDisplay();
  playSound();
}

function clearAll() {
  display = "0";
  operation = null;
  waitingForOperand = false;
  updateDisplay();
  log("Calculator cleared");
  playSound();
}

function clearEntry() {
  display = "0";
  updateDisplay();
  playSound();
}

function backspace() {
  if (display.length > 1) {
    display = display.slice(0, -1);
  } else {
    display = "0";
  }
  updateDisplay();
  playSound();
}

function setOperation(nextOperation) {
  const inputValue = parseFloat(display);
  
  if (operation && !waitingForOperand) {
    const currentValue = parseFloat(operation.value);
    const newValue = performCalculation(currentValue, inputValue, operation.operator);
    
    display = formatNumber(newValue);
    operation = { operator: nextOperation, value: display };
  } else {
    operation = { operator: nextOperation, value: display };
  }
  
  waitingForOperand = true;
  updateDisplay();
  log(`Operation set: ${nextOperation}`);
  playSound();
}

function calculate() {
  if (operation && !waitingForOperand) {
    const inputValue = parseFloat(display);
    const currentValue = parseFloat(operation.value);
    const result = performCalculation(currentValue, inputValue, operation.operator);
    
    // Add to history
    const expression = `${currentValue} ${operation.operator} ${inputValue} = ${result}`;
    addToHistory(expression);
    
    display = formatNumber(result);
    operation = null;
    waitingForOperand = true;
    updateDisplay();
    
    log(`Calculation: ${expression}`);
    saveCalculatorState();
    playSound();
  }
}

function performCalculation(first, second, operator) {
  switch (operator) {
    case '+':
      return first + second;
    case '-':
      return first - second;
    case '×':
      return first * second;
    case '÷':
      return second !== 0 ? first / second : 0;
    default:
      return second;
  }
}

function formatNumber(num) {
  const precision = parseInt(config.precision) || 8;
  if (num.toString().length > precision) {
    return parseFloat(num.toPrecision(precision)).toString();
  }
  return num.toString();
}

function addToHistory(expression) {
  history.unshift({
    id: Date.now(),
    expression: expression,
    timestamp: new Date().toISOString()
  });
  
  const limit = parseInt(config.history_limit) || 100;
  if (history.length > limit) {
    history = history.slice(0, limit);
  }
}

// Memory functions
function memoryStore() {
  memory = parseFloat(display);
  log(`Memory stored: ${memory}`);
  playSound();
}

function memoryRecall() {
  display = formatNumber(memory);
  updateDisplay();
  log(`Memory recalled: ${memory}`);
  playSound();
}

function memoryClear() {
  memory = 0;
  log("Memory cleared");
  playSound();
}

function memoryAdd() {
  memory += parseFloat(display);
  log(`Memory add: ${memory}`);
  playSound();
}

function memorySubtract() {
  memory -= parseFloat(display);
  log(`Memory subtract: ${memory}`);
  playSound();
}

function updateDisplay() {
  log(`Display updated: ${display}`);
  // In a real implementation, this would update the DOM
}

function playSound() {
  if (config.sound === "true") {
    log("*click*");
  }
}

function saveCalculatorState() {
  const state = {
    memory,
    history: history.slice(0, 10), // Save only recent history
    display
  };
  
  // In real implementation, this would call AWML state persistence
  log(`State saved: ${JSON.stringify(state).slice(0, 100)}...`);
}

function loadCalculatorState() {
  // In real implementation, this would load from AWML state persistence
  log("Calculator state loaded");
}

// Export for AWML runtime
if (typeof module !== 'undefined' && module.exports) {
  module.exports = wasmModule;
} else if (typeof self !== 'undefined') {
  self.wasmModule = wasmModule;
}
