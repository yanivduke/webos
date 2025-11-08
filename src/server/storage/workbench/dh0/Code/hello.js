// Sample JavaScript file
console.log('Hello from WebOS Code Editor!');

function greet(name) {
  return `Hello, ${name}!`;
}

const message = greet('Amiga');
console.log(message);

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

export { greet };
