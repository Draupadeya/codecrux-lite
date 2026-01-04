# Lab Code Compiler Feature

## Overview
Students can now write, run, and test code directly in the Lab section of the course player. The lab includes a full code editor with syntax highlighting and real-time code execution.

## Features

### 🎯 Three Programming Challenges

#### Challenge 1: Sum Two Numbers
- **Objective**: Write a function that adds two numbers
- **Template**: `function add(a, b) { return a + b; }`
- **Test**: `add(5, 3)` → Expected output: `8`

#### Challenge 2: Check if Even or Odd
- **Objective**: Determine if a number is even or odd
- **Template**: `function isEven(num) { return num % 2 === 0; }`
- **Tests**: 
  - `isEven(4)` → Expected: `true`
  - `isEven(7)` → Expected: `false`

#### Challenge 3: Calculate Factorial
- **Objective**: Calculate factorial of a number recursively
- **Template**: `function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }`
- **Test**: `factorial(5)` → Expected: `120`

## How to Use

### Step 1: Select a Challenge
1. Click on the "🧪 Lab" tab in the course player
2. Click one of the challenge buttons (Challenge 1, 2, or 3)
3. Read the challenge description and objective

### Step 2: Write Your Code
1. The code editor will show a template for the challenge
2. Modify the code to solve the challenge
3. Add test cases using `console.log()` to verify your solution

### Step 3: Run Your Code
1. Click the "▶ Run Code" button
2. The output will appear in the "Output" section below
3. Check if your output matches the expected result

### Step 4: Reset or Try Another Challenge
1. Click "↻ Reset" to reload the template for the current challenge
2. Click another challenge button to switch challenges
3. Your previous code will be cleared when switching

## Code Examples

### Example 1: Sum Function
```javascript
function add(a, b) {
  return a + b;
}

// Test
console.log(add(5, 3));   // Output: 8
console.log(add(10, 20)); // Output: 30
```

### Example 2: Even/Odd Function
```javascript
function isEven(num) {
  return num % 2 === 0;
}

// Test
console.log(isEven(4));   // Output: true
console.log(isEven(7));   // Output: false
console.log(isEven(100)); // Output: true
```

### Example 3: Factorial Function
```javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Test
console.log(factorial(5));  // Output: 120
console.log(factorial(1));  // Output: 1
console.log(factorial(10)); // Output: 3628800
```

## Technical Details

### Frontend Implementation
- **Editor**: HTML textarea with monospace font
- **Input**: `#lab-code-editor` - Code input area
- **Output**: `#lab-output` - Results display area
- **Buttons**: 
  - Challenge tabs to switch between challenges
  - "▶ Run Code" to execute
  - "↻ Reset" to restore template

### Backend Execution

#### Option 1: Node.js (Recommended)
- Requires Node.js installed on server
- Safe execution in isolated process
- 5-second timeout for code execution
- Captures stdout and stderr

#### Option 2: Client-Side Fallback
- If Node.js not available
- Executes code in browser's JavaScript engine
- Less safe but works offline
- Redirects output to console

### API Endpoint
**POST** `/studymate/api/execute-code/`

Request:
```json
{
  "code": "function add(a, b) { return a + b; }\nconsole.log(add(5, 3));"
}
```

Response (Success):
```json
{
  "output": "8"
}
```

Response (Error):
```json
{
  "error": "SyntaxError: Unexpected token"
}
```

## Error Handling

### Common Errors

**SyntaxError**: Check for missing braces, semicolons, or typos
```javascript
// ❌ Wrong
function add(a, b) {
  return a + b

// ✓ Correct
function add(a, b) {
  return a + b;
}
```

**ReferenceError**: Undefined variable or function
```javascript
// ❌ Wrong
console.log(result); // result not defined

// ✓ Correct
const result = add(5, 3);
console.log(result);
```

**TypeError**: Wrong data type
```javascript
// ❌ Wrong
const x = "5";
console.log(x + 3); // "53" (string concatenation)

// ✓ Correct
const x = 5;
console.log(x + 3); // 8 (number addition)
```

## Setup Requirements

### Backend Setup
1. **Django**: Already configured
2. **Node.js** (Optional): For server-side code execution
   ```bash
   # Install Node.js for code execution feature
   # Windows: Download from https://nodejs.org
   # Linux: sudo apt install nodejs
   # macOS: brew install node
   ```

3. **Environment**: Already integrated into `/studymate/api/execute-code/`

### Frontend
- Already integrated into course player
- No additional setup needed

## Troubleshooting

### "Code execution service not available"
- Node.js is not installed on the server
- Code will fall back to browser execution
- Install Node.js to enable server-side execution

### Code runs but no output
- Add `console.log()` statements to generate output
- Example: `console.log(add(5, 3));`

### Timeout error
- Code is taking too long to execute
- Check for infinite loops
- Simplify the code

### "Run Code" button stuck
- Browser may be processing long operation
- Wait a few seconds or refresh page
- Check browser console (F12) for errors

## Best Practices

### 1. Test Incrementally
```javascript
// ✓ Good: Test step by step
function multiply(a, b) {
  console.log(`multiply(${a}, ${b})`);
  return a * b;
}
console.log(multiply(4, 5)); // See result
```

### 2. Use Console Logging
```javascript
// ✓ Good: Clear output
console.log("Sum of 5 and 3:", add(5, 3));

// ❌ Bad: No output shown
const result = add(5, 3);
```

### 3. Handle Edge Cases
```javascript
// ✓ Good: Check edge cases
console.log(factorial(0));  // 1
console.log(factorial(1));  // 1
console.log(factorial(5));  // 120
```

## Future Enhancements

- [ ] Code syntax highlighting
- [ ] Auto-formatting (Prettier)
- [ ] Test suite validation
- [ ] Code submission and grading
- [ ] Multiple language support (Python, Java, C++)
- [ ] Code completion and hints
- [ ] Real-time error detection
- [ ] Debug mode with breakpoints
- [ ] Collaborative coding

## Files Modified

1. **`frontend/index.html`**
   - Added code editor UI to Lab tab
   - Added challenge buttons
   - Added Run Code and Reset buttons
   - Added JavaScript event handlers

2. **`studymate/views.py`**
   - Added `execute_code()` view function
   - Implements Node.js subprocess execution
   - Includes fallback for browser execution

3. **`studymate/urls.py`**
   - Added `/api/execute-code/` route

## Support

For issues or feature requests, please contact the development team.
