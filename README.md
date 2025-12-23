# ProcessPlanTools

A web-based formula formatter tool that helps you format and beautify complex formulas with proper indentation and syntax highlighting.

## 🌐 Live Demo

Visit the live site at: [https://eastoncc.github.io/ProcessPlanTools/](https://eastoncc.github.io/ProcessPlanTools/)

## ✨ Features

- **Formula Formatting**: Automatically adds proper indentation and line breaks to make formulas readable
- **Syntax Highlighting**: Color-codes functions, numbers, operators, and other elements
- **Copy to Clipboard**: Easily copy the unformatted formula to your clipboard
- **Clean UI**: Modern, responsive design that works on desktop and mobile
- **Real-time Processing**: Instant formatting with visual feedback

## 🚀 Usage

1. Enter or paste your formula into the "Input Formula" text area
2. Click the "Format Formula" button (or press Ctrl/Cmd + Enter)
3. View the beautifully formatted output with syntax highlighting
4. Click "Copy to Clipboard" to copy the original unformatted formula
5. Use "Clear All" to start over

## 📝 Example

**Input:**
```
IF(A1>10,SUM(B1:B10,C1:C10),AVERAGE(D1:D10))
```

**Output:**
```
IF(
  A1>10,
  SUM(
    B1:B10,
    C1:C10
  ),
  AVERAGE(
    D1:D10
  )
)
```

## 🛠️ Development

This is a static site built with vanilla HTML, CSS, and JavaScript. No build process or dependencies required!

To run locally:
```bash
# Clone the repository
git clone https://github.com/EastonCC/ProcessPlanTools.git

# Navigate to the directory
cd ProcessPlanTools

# Open index.html in your browser or serve with a local server
python3 -m http.server 8080
```

## 📄 License

This project is open source and available for anyone to use.