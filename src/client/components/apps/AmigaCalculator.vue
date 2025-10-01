<template>
  <div class="amiga-calculator">
    <!-- Display -->
    <div class="calc-display">
      <div class="display-value">{{ display }}</div>
    </div>

    <!-- Button Grid -->
    <div class="calc-buttons">
      <!-- Row 1 -->
      <button class="calc-button function" @click="clear">C</button>
      <button class="calc-button function" @click="clearEntry">CE</button>
      <button class="calc-button function" @click="backspace">←</button>
      <button class="calc-button operator" @click="setOperator('/')">÷</button>

      <!-- Row 2 -->
      <button class="calc-button" @click="appendNumber('7')">7</button>
      <button class="calc-button" @click="appendNumber('8')">8</button>
      <button class="calc-button" @click="appendNumber('9')">9</button>
      <button class="calc-button operator" @click="setOperator('*')">×</button>

      <!-- Row 3 -->
      <button class="calc-button" @click="appendNumber('4')">4</button>
      <button class="calc-button" @click="appendNumber('5')">5</button>
      <button class="calc-button" @click="appendNumber('6')">6</button>
      <button class="calc-button operator" @click="setOperator('-')">-</button>

      <!-- Row 4 -->
      <button class="calc-button" @click="appendNumber('1')">1</button>
      <button class="calc-button" @click="appendNumber('2')">2</button>
      <button class="calc-button" @click="appendNumber('3')">3</button>
      <button class="calc-button operator" @click="setOperator('+')">+</button>

      <!-- Row 5 -->
      <button class="calc-button wide" @click="appendNumber('0')">0</button>
      <button class="calc-button" @click="appendDecimal">.</button>
      <button class="calc-button equals" @click="calculate">=</button>

      <!-- Row 6 - Extra Functions -->
      <button class="calc-button function" @click="squareRoot">√</button>
      <button class="calc-button function" @click="square">x²</button>
      <button class="calc-button function" @click="percent">%</button>
      <button class="calc-button function" @click="negate">+/-</button>
    </div>

    <!-- Status -->
    <div class="calc-status">
      <span v-if="currentOperator">{{ previousValue }} {{ currentOperator }}</span>
      <span v-else>Ready</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const display = ref('0');
const previousValue = ref(0);
const currentOperator = ref('');
const waitingForNewValue = ref(false);
const lastResult = ref(0);

const appendNumber = (num: string) => {
  if (waitingForNewValue.value) {
    display.value = num;
    waitingForNewValue.value = false;
  } else {
    if (display.value === '0') {
      display.value = num;
    } else {
      display.value += num;
    }
  }
};

const appendDecimal = () => {
  if (waitingForNewValue.value) {
    display.value = '0.';
    waitingForNewValue.value = false;
  } else if (!display.value.includes('.')) {
    display.value += '.';
  }
};

const setOperator = (op: string) => {
  if (currentOperator.value && !waitingForNewValue.value) {
    calculate();
  }
  previousValue.value = parseFloat(display.value);
  currentOperator.value = op;
  waitingForNewValue.value = true;
};

const calculate = () => {
  if (!currentOperator.value) return;

  const current = parseFloat(display.value);
  let result = 0;

  switch (currentOperator.value) {
    case '+':
      result = previousValue.value + current;
      break;
    case '-':
      result = previousValue.value - current;
      break;
    case '*':
      result = previousValue.value * current;
      break;
    case '/':
      if (current === 0) {
        display.value = 'Error';
        clear();
        return;
      }
      result = previousValue.value / current;
      break;
  }

  // Round to avoid floating point errors
  result = Math.round(result * 100000000) / 100000000;

  display.value = result.toString();
  lastResult.value = result;
  currentOperator.value = '';
  waitingForNewValue.value = true;
};

const clear = () => {
  display.value = '0';
  previousValue.value = 0;
  currentOperator.value = '';
  waitingForNewValue.value = false;
};

const clearEntry = () => {
  display.value = '0';
  waitingForNewValue.value = false;
};

const backspace = () => {
  if (display.value.length > 1) {
    display.value = display.value.slice(0, -1);
  } else {
    display.value = '0';
  }
};

const squareRoot = () => {
  const value = parseFloat(display.value);
  if (value < 0) {
    display.value = 'Error';
    setTimeout(clear, 1000);
    return;
  }
  display.value = Math.sqrt(value).toString();
  waitingForNewValue.value = true;
};

const square = () => {
  const value = parseFloat(display.value);
  display.value = (value * value).toString();
  waitingForNewValue.value = true;
};

const percent = () => {
  const value = parseFloat(display.value);
  display.value = (value / 100).toString();
  waitingForNewValue.value = true;
};

const negate = () => {
  const value = parseFloat(display.value);
  display.value = (-value).toString();
};
</script>

<style scoped>
.amiga-calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  padding: 8px;
}

/* Display */
.calc-display {
  background: #000000;
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 8px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.display-value {
  color: #00ff00;
  font-size: 18px;
  text-align: right;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 0 8px #00ff00;
}

/* Button Grid */
.calc-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  flex: 1;
}

.calc-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 45px;
}

.calc-button:hover {
  background: #b0b0b0;
}

.calc-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
  transform: translateY(1px);
}

.calc-button.operator {
  background: #0055aa;
  color: #ffffff;
}

.calc-button.operator:hover {
  background: #0066cc;
}

.calc-button.operator:active {
  background: #004499;
}

.calc-button.function {
  background: #888888;
  color: #ffffff;
}

.calc-button.function:hover {
  background: #999999;
}

.calc-button.function:active {
  background: #666666;
}

.calc-button.equals {
  background: #ff6600;
  color: #ffffff;
  font-size: 18px;
}

.calc-button.equals:hover {
  background: #ff7722;
}

.calc-button.equals:active {
  background: #dd5500;
}

.calc-button.wide {
  grid-column: span 2;
}

/* Status Bar */
.calc-status {
  margin-top: 8px;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-size: 8px;
  color: #0055aa;
  text-align: center;
  min-height: 20px;
}
</style>
