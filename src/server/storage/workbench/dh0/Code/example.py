# Sample Python file for WebOS Code Editor

def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    fib_sequence = []
    a, b = 0, 1

    for _ in range(n):
        fib_sequence.append(a)
        a, b = b, a + b

    return fib_sequence

def main():
    print("WebOS Code Editor - Python Example")
    print("=" * 40)

    # Generate first 10 Fibonacci numbers
    result = fibonacci(10)
    print(f"First 10 Fibonacci numbers: {result}")

    # List comprehension example
    squares = [x**2 for x in range(1, 11)]
    print(f"Squares: {squares}")

    # Dictionary example
    colors = {
        'amiga_gray': '#a0a0a0',
        'amiga_blue': '#0055aa',
        'amiga_orange': '#ffaa00'
    }

    for name, hex_code in colors.items():
        print(f"{name}: {hex_code}")

if __name__ == "__main__":
    main()
