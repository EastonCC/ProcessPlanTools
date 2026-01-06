/**
 * ProcessPlan Formula Editor - Main Editor Logic
 * Requires: functions.js to be loaded first
 */

// DOM Elements
const textarea = document.getElementById('codeTextarea');
const highlight = document.getElementById('codeHighlight');
const lineNumbers = document.getElementById('lineNumbers');
const codeEditor = document.getElementById('codeEditor');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const parameterHint = document.getElementById('parameterHint');

// State
let isFormatting = false;
let autocompleteVisible = false;
let autocompleteItems = [];
let selectedIndex = 0;
let autocompleteStart = -1;
let autocompleteExistingParen = false;
let autocompleteReplaceEnd = -1;
let savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
let fieldValues = {};

// Settings
let settings = {
    autoFormatOnPaste: true,
    autoComplete: true,
    parameterHints: true
};

// Indentation settings - single source of truth
const INDENT_SIZE = 1;
const INDENT_CHAR = '\t';
const INDENT_UNIT = INDENT_CHAR;

// Helper function to get current line's leading whitespace
function getCurrentIndent(text) {
    const lastNewline = text.lastIndexOf('\n');
    const currentLineStart = text.substring(lastNewline + 1);
    const indentMatch = currentLineStart.match(/^([ \t]*)/);
    return indentMatch ? indentMatch[1] : '';
}

// Helper function to modify textarea while preserving undo/redo history
function insertTextAtCursor(text, selectStart = null, selectEnd = null) {
    textarea.focus();
    document.execCommand('insertText', false, text);
    if (selectStart !== null) {
        const pos = selectEnd !== null ? selectEnd : selectStart;
        textarea.setSelectionRange(selectStart, pos);
    }
}

// Helper to replace a range of text while preserving undo history
function replaceTextRange(start, end, newText, cursorPos = null) {
    textarea.focus();
    textarea.setSelectionRange(start, end);
    document.execCommand('insertText', false, newText);
    if (cursorPos !== null) {
        textarea.setSelectionRange(cursorPos, cursorPos);
    }
}

// Helper to set entire textarea content while preserving undo history
function setTextareaContent(content, cursorPos = 0) {
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
    document.execCommand('insertText', false, content);
    textarea.setSelectionRange(cursorPos, cursorPos);
}

// Settings management
function loadSettings() {
    const saved = localStorage.getItem('editorSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    const autoFormatToggle = document.getElementById('autoFormatToggle');
    const autoCompleteToggle = document.getElementById('autoCompleteToggle');
    const paramHintsToggle = document.getElementById('paramHintsToggle');
    
    if (autoFormatToggle) autoFormatToggle.checked = settings.autoFormatOnPaste;
    if (autoCompleteToggle) autoCompleteToggle.checked = settings.autoComplete;
    if (paramHintsToggle) paramHintsToggle.checked = settings.parameterHints;
}

function saveSettings() {
    localStorage.setItem('editorSettings', JSON.stringify(settings));
}

function updateSetting(key, value) {
    settings[key] = value;
    saveSettings();
    
    if (!settings.parameterHints) {
        hideAllHints();
    } else {
        updateAllHints();
    }
    
    if (!settings.autoComplete) {
        hideAutocomplete();
    }
}

function toggleSettingsModal() {
    const overlay = document.getElementById('settingsModalOverlay');
    overlay.classList.toggle('show');
}

// Get current word being typed (after =)
function getCurrentFunctionPrefix() {
    const cursorPos = textarea.selectionStart;
    const text = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    // Find the last = sign and get text after it
    const lastEquals = text.lastIndexOf('=');
    if (lastEquals === -1) return null;
    
    const afterEquals = text.substring(lastEquals + 1);
    
    // Check if we're still typing the function name (letters, and optionally starting with !)
    if (/^!?[a-zA-Z]*$/.test(afterEquals)) {
        // Check what comes after the cursor
        const afterMatch = textAfter.match(/^(!?[a-zA-Z]*)\s*(\(?)/);
        
        if (afterMatch) {
            const remainingName = afterMatch[1];
            const hasParen = afterMatch[2] === '(';
            const fullName = (afterEquals + remainingName).toUpperCase();
            
            // If there's a parenthesis after, check if the full function name is valid
            if (hasParen) {
                // If the full name is a valid function, block autocomplete (already complete)
                if (FUNCTIONS.has(fullName)) {
                    return null;
                }
                // If invalid function name before existing paren, show autocomplete to fix it
                // Include info about existing parenthesis so we don't duplicate it
                return { 
                    prefix: afterEquals.toUpperCase(), 
                    start: lastEquals,
                    existingParen: true,
                    replaceEnd: cursorPos + remainingName.length
                };
            }
        }
        
        return { prefix: afterEquals.toUpperCase(), start: lastEquals, existingParen: false, replaceEnd: cursorPos };
    }
    
    return null;
}

function updateAutocomplete() {
    const result = getCurrentFunctionPrefix();
    
    if (result === null) {
        hideAutocomplete();
        return;
    }
    
    const { prefix, start, existingParen, replaceEnd } = result;
    autocompleteStart = start;
    autocompleteExistingParen = existingParen;
    autocompleteReplaceEnd = replaceEnd;
    
    // Filter functions that start with the prefix
    autocompleteItems = FUNCTION_LIST.filter(fn => fn.startsWith(prefix));
    
    if (autocompleteItems.length === 0) {
        hideAutocomplete();
        return;
    }
    
    selectedIndex = 0;
    renderAutocomplete();
    positionAutocomplete();
    showAutocomplete();
}

function renderAutocomplete() {
    autocompleteDropdown.innerHTML = autocompleteItems.map((item, index) => 
        `<div class="autocomplete-item${index === selectedIndex ? ' selected' : ''}" data-index="${index}" data-value="${item}">=${item}()</div>`
    ).join('');
    
    // Add click handlers
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', () => {
            selectAutocompleteItem(parseInt(el.dataset.index));
        });
    });
}

function positionAutocomplete() {
    // Get cursor position in textarea
    const cursorPos = textarea.selectionStart;
    
    // Create a temporary span to measure text position
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];
    
    // Calculate position
    const lineHeight = 20.8; // Approximate line height (13px * 1.6)
    const charWidth = 7.8; // Approximate character width for monospace
    
    const top = (currentLineIndex + 1) * lineHeight + 16; // +16 for padding
    const left = currentLineText.length * charWidth + 16 + 50; // +50 for line numbers width
    
    autocompleteDropdown.style.top = `${Math.min(top, 400)}px`;
    autocompleteDropdown.style.left = `${Math.min(left, 300)}px`;
}

function showAutocomplete() {
    autocompleteDropdown.classList.add('show');
    autocompleteVisible = true;
}

function hideAutocomplete() {
    autocompleteDropdown.classList.remove('show');
    autocompleteVisible = false;
    autocompleteItems = [];
    selectedIndex = 0;
}

function selectAutocompleteItem(index) {
    if (index < 0 || index >= autocompleteItems.length) return;
    
    const selectedFunction = autocompleteItems[index];
    const params = getFunctionParams(selectedFunction);
    
    // If there's already a parenthesis, just replace the function name
    if (autocompleteExistingParen) {
        const insertion = `=${selectedFunction}`;
        const newPos = autocompleteStart + insertion.length;
        
        replaceTextRange(autocompleteStart, autocompleteReplaceEnd, insertion, newPos);
        
        hideAutocomplete();
        updateEditor();
        updateAllHints();
        textarea.focus();
        return;
    }
    
    // Build the full function structure with proper indentation
    const currentText = textarea.value.substring(0, autocompleteStart);
    const baseIndent = getCurrentIndent(currentText);
    const innerIndent = baseIndent + INDENT_UNIT;
    
    let insertion;
    let cursorOffset;
    
    if (params.length === 0) {
        // No parameters - just insert function with empty parens
        insertion = `=${selectedFunction}()`;
        cursorOffset = insertion.length - 1; // Position cursor inside ()
    } else {
        // Has parameters - create multi-line structure
        insertion = `=${selectedFunction}(\n${innerIndent}\n${baseIndent})`;
        cursorOffset = `=${selectedFunction}(\n${innerIndent}`.length; // Position cursor on the indented line
    }
    
    const newPos = autocompleteStart + cursorOffset;
    
    replaceTextRange(autocompleteStart, autocompleteReplaceEnd, insertion, newPos);
    
    hideAutocomplete();
    updateEditor();
    updateAllHints();
    textarea.focus();
}

function navigateAutocomplete(direction) {
    if (!autocompleteVisible || autocompleteItems.length === 0) return;
    
    selectedIndex += direction;
    
    if (selectedIndex < 0) selectedIndex = autocompleteItems.length - 1;
    if (selectedIndex >= autocompleteItems.length) selectedIndex = 0;
    
    renderAutocomplete();
    
    // Scroll selected item into view
    const selectedEl = autocompleteDropdown.querySelector('.autocomplete-item.selected');
    if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
    }
}

// Parameter hint functions
function getCurrentFunctionContext() {
    const cursorPos = textarea.selectionStart;
    const text = textarea.value.substring(0, cursorPos);
    
    // Track function calls and their positions
    let functionStack = [];
    let bracketDepth = 0;
    let i = 0;
    
    while (i < text.length) {
        const char = text[i];
        
        // Track brackets to ignore content inside [[ ]]
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
        
        // Look for function pattern: =FUNCTIONNAME( or just FUNCTIONNAME( for nested
        if (bracketDepth === 0) {
            // Check for function start
            let functionMatch = null;
            
            // Check if this could be start of a function name
            if (char === '=' || (functionStack.length > 0 && /[A-Z!]/.test(char))) {
                let nameStart = char === '=' ? i + 1 : i;
                let name = '';
                let j = nameStart;
                
                while (j < text.length && /[A-Z!]/.test(text[j])) {
                    name += text[j];
                    j++;
                }
                
                if (text[j] === '(' && FUNCTIONS.has(name)) {
                    functionStack.push({
                        name: name,
                        paramIndex: 0,
                        start: i
                    });
                    i = j; // Skip to the (
                }
            }
            
            // Count semicolons for current function's parameter index
            if (char === ';' && functionStack.length > 0) {
                functionStack[functionStack.length - 1].paramIndex++;
            }
            
            // Handle closing parenthesis
            if (char === ')' && functionStack.length > 0) {
                functionStack.pop();
            }
        }
        
        i++;
    }
    
    // Return the full function stack (not just innermost)
    return functionStack.length > 0 ? functionStack : null;
}

function updateParameterHint() {
    const contextStack = getCurrentFunctionContext();
    
    if (!contextStack || contextStack.length === 0) {
        hideAllHints();
        return;
    }
    
    // Build hint HTML for each function in the stack
    const hintLines = contextStack.map((context, stackIndex) => {
        const params = getFunctionParams(context.name);
        if (!params || params.length === 0) {
            return null;
        }
        
        const indent = '  '.repeat(stackIndex);
        const paramHtml = params.map((param, index) => {
            const isActive = index === context.paramIndex || 
                            (index === params.length - 1 && context.paramIndex >= params.length);
            // Highlight active param for ALL functions in the stack
            return `<span class="param${isActive ? ' active' : ''}">${param}</span>`;
        }).join('<span class="param">; </span>');
        
        return `<div class="hint-line">${indent}<span class="function-name">${context.name}</span>(${paramHtml})</div>`;
    }).filter(line => line !== null);
    
    if (hintLines.length === 0) {
        hideAllHints();
        return;
    }
    
    parameterHint.innerHTML = hintLines.join('');
    showParameterHint();
}

function showParameterHint() {
    parameterHint.classList.add('show');
}

function hideParameterHint() {
    parameterHint.classList.remove('show');
}

// Function help panel - shows description and example
function updateFunctionHelp() {
    const helpPanel = document.getElementById('functionHelpPanel');
    if (!helpPanel) return;
    
    const contextStack = getCurrentFunctionContext();
    
    if (!contextStack || contextStack.length === 0) {
        hideFunctionHelp();
        return;
    }
    
    // Get the innermost function (the one we're currently in)
    const currentFunction = contextStack[contextStack.length - 1];
    const funcName = currentFunction.name;
    const funcData = FUNCTION_DATA[funcName];
    
    if (!funcData) {
        hideFunctionHelp();
        return;
    }
    
    helpPanel.innerHTML = `
        <div class="help-panel-header">
            <span class="help-panel-function">${funcName}</span>
            <span class="help-panel-status ${funcData.status}" title="${funcData.status === 'implemented' ? 'Implemented in the compiler' : funcData.status === 'partial' ? 'Partially implemented in the compiler' : 'Not implemented in the compiler'}">${funcData.status === 'implemented' ? '✓' : funcData.status === 'partial' ? '◐' : '✗'}</span>
        </div>
        <div class="help-panel-description">${funcData.description}</div>
        <div class="help-panel-example-label">Example:</div>
        <div class="help-panel-example">${escapeHtml(funcData.example)}</div>
    `;
    
    showFunctionHelp();
}

function showFunctionHelp() {
    const helpPanel = document.getElementById('functionHelpPanel');
    if (helpPanel) helpPanel.classList.add('show');
}

function hideFunctionHelp() {
    const helpPanel = document.getElementById('functionHelpPanel');
    if (helpPanel) helpPanel.classList.remove('show');
}

// Helper to update all contextual hints
function updateAllHints() {
    updateParameterHint();
    updateFunctionHelp();
}

// Helper to hide all hints
function hideAllHints() {
    hideParameterHint();
    hideFunctionHelp();
}

// Format formula with indentation
function formatFormula(formula) {
    // First, normalize the formula by removing existing formatting
    // This ensures consistent output regardless of input formatting
    let normalized = '';
    let bracketDepth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < formula.length; i++) {
        const char = formula[i];
        
        // Track string literals
        if ((char === '"' || char === "'") && (i === 0 || formula[i-1] !== '\\')) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        // Track brackets
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
        
        // Keep everything inside brackets or strings as-is
        if (bracketDepth > 0 || inString) {
            normalized += char;
        } else if (!char.match(/\s/)) {
            // Outside brackets/strings: keep non-whitespace only
            normalized += char;
        }
    }
    
    // Now format the normalized formula
    let result = '';
    let indentLevel = 0;
    bracketDepth = 0;
    inString = false;
    stringChar = '';

    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        
        // Track string literals (single or double quotes)
        if ((char === '"' || char === "'") && (i === 0 || normalized[i-1] !== '\\')) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }

        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);

        // If inside brackets or string, preserve everything as-is
        if (bracketDepth > 0 || inString) {
            result += char;
            continue;
        }

        if (char === '(') {
            result += char;
            indentLevel++;
            // Look ahead to see if this is an empty function call
            if (i + 1 < normalized.length && normalized[i + 1] !== ')') {
                result += '\n' + INDENT_UNIT.repeat(indentLevel);
            }
        } else if (char === ')') {
            indentLevel = Math.max(0, indentLevel - 1);
            // Add newline before ) if the last line has content
            const lastNewlineIdx = result.lastIndexOf('\n');
            const lastLine = result.substring(lastNewlineIdx + 1);
            const lastLineTrimmed = lastLine.trim();
            
            if (lastLineTrimmed.length > 0 && !result.trimEnd().endsWith('(')) {
                result += '\n' + INDENT_UNIT.repeat(indentLevel);
            }
            result += char;
        } else if (char === ',' || char === ';') {
            result += char + '\n' + INDENT_UNIT.repeat(indentLevel);
        } else {
            result += char;
        }
    }

    return result;
}




// Tokenize for syntax highlighting
function tokenize(code) {
    const tokens = [];
    let i = 0;
    let functionDepthStack = [];

    while (i < code.length) {
        // Handle comments - // until end of line
        if (code[i] === '/' && code[i + 1] === '/') {
            let value = '';
            while (i < code.length && code[i] !== '\n') {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value });
            continue;
        }

        if (/\s/.test(code[i])) {
            let value = '';
            while (i < code.length && /\s/.test(code[i])) {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'whitespace', value });
            continue;
        }

        if (code[i] === '"') {
            let value = '"';
            i++;
            while (i < code.length && code[i] !== '"') {
                value += code[i];
                i++;
            }
            if (i < code.length) {
                value += '"';
                i++;
            }
            tokens.push({ type: 'string', value });
            continue;
        }

        if (code[i] === "'") {
            let value = "'";
            i++;
            while (i < code.length && code[i] !== "'") {
                value += code[i];
                i++;
            }
            if (i < code.length) {
                value += "'";
                i++;
            }
            tokens.push({ type: 'string', value });
            continue;
        }

        if (/\d/.test(code[i])) {
            let value = '';
            while (i < code.length && /[\d.]/.test(code[i])) {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'number', value });
            continue;
        }

        // Handle function names starting with !
        if (code[i] === '!' && i + 1 < code.length && /[a-zA-Z]/.test(code[i + 1])) {
            let value = '!';
            i++;
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                value += code[i];
                i++;
            }
            if (code[i] === '(' && FUNCTIONS.has(value.toUpperCase())) {
                tokens.push({ type: 'function', value: value + '(' });
                functionDepthStack.push(1);
                i++;
            } else {
                tokens.push({ type: 'identifier', value });
            }
            continue;
        }

        if (/[a-zA-Z_]/.test(code[i])) {
            let value = '';
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                value += code[i];
                i++;
            }
            if (code[i] === '(' && FUNCTIONS.has(value.toUpperCase())) {
                tokens.push({ type: 'function', value: value + '(' });
                functionDepthStack.push(1);
                i++;
            } else {
                tokens.push({ type: 'identifier', value });
            }
            continue;
        }

        if (code[i] === '(') {
            for (let j = 0; j < functionDepthStack.length; j++) {
                functionDepthStack[j]++;
            }
            tokens.push({ type: 'parenthesis', value: '(' });
            i++;
            continue;
        }

        if (code[i] === ')') {
            let isClosingFunction = false;
            for (let j = functionDepthStack.length - 1; j >= 0; j--) {
                functionDepthStack[j]--;
                if (functionDepthStack[j] === 0) {
                    isClosingFunction = true;
                    functionDepthStack.splice(j, 1);
                    break;
                }
            }
            tokens.push({ type: isClosingFunction ? 'function' : 'parenthesis', value: ')' });
            i++;
            continue;
        }

        if (/[+\-*\/=<>&|;,]/.test(code[i])) {
            tokens.push({ type: 'operator', value: code[i] });
            i++;
            continue;
        }

        if (code[i] === '[' || code[i] === ']') {
            tokens.push({ type: 'bracket', value: code[i] });
            i++;
            continue;
        }

        tokens.push({ type: 'other', value: code[i] });
        i++;
    }

    return tokens;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applySyntaxHighlighting(code) {
    const tokens = tokenize(code);
    return tokens.map(token => {
        const escaped = escapeHtml(token.value);
        switch (token.type) {
            case 'function': return `<span class="function">${escaped}</span>`;
            case 'string': return `<span class="string">${escaped}</span>`;
            case 'number': return `<span class="number">${escaped}</span>`;
            case 'operator': return `<span class="operator">${escaped}</span>`;
            case 'parenthesis': return `<span class="parenthesis">${escaped}</span>`;
            case 'bracket': return `<span class="bracket">${escaped}</span>`;
            case 'comment': return `<span class="comment">${escaped}</span>`;
            default: return escaped;
        }
    }).join('');
}

function updateLineNumbers(code) {
    const lines = code.split('\n');
    lineNumbers.innerHTML = lines.map((_, i) => 
        `<div class="line-number">${i + 1}</div>`
    ).join('');
}

function updateEditor() {
    const code = textarea.value;
    highlight.innerHTML = applySyntaxHighlighting(code) + '\n';
    updateLineNumbers(code);
}

function formatLive() { 
    const raw = textarea.value;
    const formatted = addIndentationAndSpacing(raw);
    const highlighted = applySyntaxHighlighting(formatted);
    formattedCode.innerHTML = highlighted;
}

// Handle paste - format the pasted content
textarea.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatFormula(pastedText);
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newPos = start + formatted.length;
    
    replaceTextRange(start, end, formatted, newPos);
    
    updateEditor();
    hideAutocomplete();
    updateAllHints();
    extractAndDisplayFields();
    showNotification('Formula formatted!');
});

// Hide autocomplete when clicking outside
document.addEventListener('click', (e) => {
    if (!autocompleteDropdown.contains(e.target) && e.target !== textarea) {
        hideAutocomplete();
        hideAllHints();
    }
});

// Update parameter hint and autocomplete on cursor movement (click)
textarea.addEventListener('click', () => {
    updateAutocomplete();
    updateAllHints();
});

textarea.addEventListener('keyup', (e) => {
    // Update on arrow keys for cursor movement (but not when navigating autocomplete)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        if (!autocompleteVisible) {
            updateAutocomplete();
        }
        updateAllHints();
    }
});

// Hide hints when textarea loses focus
textarea.addEventListener('blur', () => {
    // Small delay to allow clicking on autocomplete items
    setTimeout(() => {
        if (document.activeElement !== textarea && !autocompleteDropdown.contains(document.activeElement)) {
            hideAutocomplete();
            hideAllHints();
        }
    }, 150);
});

// Restore hints when textarea gains focus
textarea.addEventListener('focus', () => {
    updateAutocomplete();
    updateAllHints();
});

// Handle input for live updates (includes undo/redo)
textarea.addEventListener('input', (e) => {
    updateEditor();
    updateAutocomplete();
    updateAllHints();
    extractAndDisplayFields();
   //formatLive();
});

// Sync scroll between textarea, highlight, and line numbers
textarea.addEventListener('scroll', () => {
    // Use transform for smoother sync of highlight layer
    highlight.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
    // Sync line numbers vertically
    lineNumbers.style.transform = `translateY(${-textarea.scrollTop}px)`;
});

// Handle tab key
textarea.addEventListener('keydown', (e) => {
    // Handle autocomplete navigation
    if (autocompleteVisible) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateAutocomplete(1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateAutocomplete(-1);
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            selectAutocompleteItem(selectedIndex);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            hideAutocomplete();
            return;
        }
    }
    
    // Handle Enter - maintain current indentation
    if (e.key === 'Enter' && !autocompleteVisible) {
        e.preventDefault();
        
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        // Get the current line's indentation
        const lastNewline = textBefore.lastIndexOf('\n');
        const currentLine = textBefore.substring(lastNewline + 1);
        const indentMatch = currentLine.match(/^(\s*)/);
        const currentIndent = indentMatch ? indentMatch[1] : '';
        
        // Check if we're after an opening parenthesis ON THE CURRENT LINE - add extra indent
        const currentLineTrimmed = currentLine.trimEnd();
        const charBefore = currentLineTrimmed.slice(-1);
        let insertion;
        
        if (charBefore === '(') {
            // Check if there's a ) immediately after cursor (empty parens case)
            if (textAfter.trimStart().startsWith(')')) {
                // Expand empty parens: put cursor on indented line, ) on line below at base indent
                const innerIndent = currentIndent + INDENT_UNIT;
                insertion = '\n' + innerIndent + '\n' + currentIndent;
                const newPos = cursorPos + 1 + innerIndent.length; // Position cursor on the indented line
                
                insertTextAtCursor(insertion, newPos, newPos);
                updateEditor();
                return;
            }
            // Add extra indentation after opening paren
            const extraIndent = currentIndent + INDENT_UNIT;
            insertion = '\n' + extraIndent;
        } else {
            insertion = '\n' + currentIndent;
        }
        
        const newPos = cursorPos + insertion.length;
        
        insertTextAtCursor(insertion, newPos, newPos);
        updateEditor();
        return;
    }
    
    // Handle Backspace - delete entire indent level if cursor is in leading whitespace
    if (e.key === 'Backspace') {
        const cursorPos = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        // Only handle if no text is selected
        if (cursorPos === selectionEnd && cursorPos > 0) {
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);
            
            // Get current line info
            const lastNewline = textBefore.lastIndexOf('\n');
            const currentLineStart = lastNewline + 1;
            const textOnCurrentLine = textBefore.substring(currentLineStart);
            
            // Check if we're in leading whitespace (only spaces/tabs before cursor on this line)
            // OR if the line is only whitespace and ) (cursor right before the paren)
            const restOfLine = textAfter.split('\n')[0];
            const isOnlyWhitespaceBeforeCursor = /^[ \t]*$/.test(textOnCurrentLine);
            const restStartsWithParen = restOfLine.trimStart().startsWith(')');
            
            if (isOnlyWhitespaceBeforeCursor && restStartsWithParen) {
                // Find the matching opening paren to determine correct indent
                const textBeforeLine = lastNewline >= 0 ? textarea.value.substring(0, lastNewline) : '';
                let parenDepth = 1;
                let matchIndent = '';
                let foundMatch = false;
                
                // Scan backwards to find matching (
                for (let i = textBeforeLine.length - 1; i >= 0 && parenDepth > 0; i--) {
                    const char = textBeforeLine[i];
                    if (char === ')') parenDepth++;
                    if (char === '(') {
                        parenDepth--;
                        if (parenDepth === 0) {
                            // Found matching paren, get its line's indent
                            const lineStart = textBeforeLine.lastIndexOf('\n', i) + 1;
                            const line = textBeforeLine.substring(lineStart);
                            const indentMatch = line.match(/^([ \t]*)/);
                            matchIndent = indentMatch ? indentMatch[1] : '';
                            foundMatch = true;
                        }
                    }
                }
                
                // Snap to match indent if current indent differs
                if (foundMatch && textOnCurrentLine !== matchIndent) {
                    e.preventDefault();
                    const newPos = currentLineStart + matchIndent.length;
                    replaceTextRange(currentLineStart, cursorPos, matchIndent, newPos);
                    updateEditor();
                    return;
                }
                
                // If already at correct indent (or no match found), check if we should delete the line
                if (foundMatch && textOnCurrentLine === matchIndent && textOnCurrentLine.length === 0) {
                    // Already at base indent with no whitespace - let normal backspace happen
                    // This will merge with the previous line
                    return;
                }
            }
            
            // Check if we're in leading whitespace for normal indent backspace
            if (/^[ \t]+$/.test(textOnCurrentLine)) {
                const currentIndentLength = textOnCurrentLine.length;
                
                // Normal indent backspace - remove one indent level
                const spacesToRemove = currentIndentLength % INDENT_SIZE === 0 
                    ? INDENT_SIZE 
                    : currentIndentLength % INDENT_SIZE;
                
                if (spacesToRemove > 0 && currentIndentLength >= spacesToRemove) {
                    e.preventDefault();
                    
                    const newPos = cursorPos - spacesToRemove;
                    replaceTextRange(newPos, cursorPos, '', newPos);
                    
                    updateEditor();
                    return;
                }
            }
        }
    }
    
    // Handle Tab - indent selection or insert tab
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Check if there's a selection spanning multiple characters
        if (start !== end) {
            const text = textarea.value;
            
            // Find the start of the first selected line
            let lineStart = start;
            while (lineStart > 0 && text[lineStart - 1] !== '\n') {
                lineStart--;
            }
            
            // Find the end of the last selected line
            let lineEnd = end;
            while (lineEnd < text.length && text[lineEnd] !== '\n') {
                lineEnd++;
            }
            
            // Get the selected lines
            const selectedText = text.substring(lineStart, lineEnd);
            const lines = selectedText.split('\n');
            
            let newText;
            let newStart, newEnd;
            
            if (e.shiftKey) {
                // Shift+Tab: Unindent
                newText = lines.map(line => {
                    if (line.startsWith(INDENT_UNIT)) {
                        return line.substring(INDENT_SIZE);
                    } else if (line.startsWith('\t')) {
                        return line.substring(1);
                    } else if (line.startsWith(' ')) {
                        // Remove leading spaces (up to a tab-width worth)
                        let spacesToRemove = 0;
                        while (spacesToRemove < 4 && line[spacesToRemove] === ' ') {
                            spacesToRemove++;
                        }
                        return line.substring(spacesToRemove);
                    }
                    return line;
                }).join('\n');
                
                const diff = selectedText.length - newText.length;
                newStart = Math.max(lineStart, start - (lines[0].length - (newText.split('\n')[0] || '').length));
                newEnd = end - diff;
            } else {
                // Tab: Indent
                newText = lines.map(line => INDENT_UNIT + line).join('\n');
                newStart = start + INDENT_SIZE;
                newEnd = end + (lines.length * INDENT_SIZE);
            }
            
            // Replace the text
            textarea.setSelectionRange(lineStart, lineEnd);
            document.execCommand('insertText', false, newText);
            
            // Restore selection
            textarea.setSelectionRange(
                Math.max(0, newStart),
                Math.min(textarea.value.length, newEnd)
            );
            
            updateEditor();
        } else {
            // No selection - just insert tab
            insertTextAtCursor(INDENT_UNIT, start + INDENT_SIZE, start + INDENT_SIZE);
            updateEditor();
        }
    }
});

// Calculate indent level based on unmatched opening parens (outside brackets)
function getIndentLevel(text) {
    let level = 0;
    let bracketDepth = 0;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
        
        if (bracketDepth === 0) {
            if (char === '(') level++;
            if (char === ')') level = Math.max(0, level - 1);
        }
    }
    
    return level;
}

// Copy formatted (with indentation)
// Remove comments from code
function stripComments(code) {
    // Remove comments (// to end of line) but preserve the newline
    return code.replace(/\/\/[^\n]*/g, '');
}

function copyFormatted() {
    const code = textarea.value;
    if (!code.trim()) {
        showNotification('Nothing to copy!', 'error');
        return;
    }
    // Strip comments but keep formatting
    let cleaned = stripComments(code);
    // Remove empty lines that were just comments
    cleaned = cleaned.split('\n').filter(line => line.trim() !== '').join('\n');
    
    navigator.clipboard.writeText(cleaned)
        .then(() => showNotification('Copied formatted!'))
        .catch(() => showNotification('Failed to copy', 'error'));
}

// Copy raw (without formatting)
function copyRaw() {
    const code = textarea.value;
    if (!code.trim()) {
        showNotification('Nothing to copy!', 'error');
        return;
    }
    // Strip comments first
    let raw = stripComments(code);
    raw = raw.replace(/[\n\r\t]+/g, '');
    raw = raw.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    // Clean up any extra spaces left from removed comments
    raw = raw.replace(/\s+/g, ' ').replace(/; /g, ';').replace(/ ;/g, ';');
    
    navigator.clipboard.writeText(raw)
        .then(() => showNotification('Copied raw!'))
        .catch(() => showNotification('Failed to copy', 'error'));
}

function clearEditor() {
    setTextareaContent('', 0);
    updateEditor();
    extractAndDisplayFields();
    showNotification('Cleared!');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification' + (type === 'error' ? ' error' : '');
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2500);
}

// Help modal
function toggleHelpModal() {
    document.getElementById('helpModal').classList.toggle('show');
    document.getElementById('helpModalOverlay').classList.toggle('show');
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    body.classList.toggle('light-mode');
    
    const isLight = body.classList.contains('light-mode');
    themeIcon.textContent = isLight ? '☀️' : '🌙';
    
    // Save preference to localStorage
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.textContent = '☀️';
    }
}

// Sidebar functions
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
}

// Left Sidebar - Saved Formulas functions
function toggleFormulasSidebar() {
    document.getElementById('leftSidebar').classList.toggle('open');
    document.getElementById('leftSidebarOverlay').classList.toggle('show');
}

// Get saved formulas from localStorage
function getSavedFormulas() {
    const formulas = localStorage.getItem('savedFormulas');
    return formulas ? JSON.parse(formulas) : [];
}

// Save formulas to localStorage
function setSavedFormulas(formulas) {
    localStorage.setItem('savedFormulas', JSON.stringify(formulas));
}

// Save current formula
function saveFormula() {
    const nameInput = document.getElementById('formulaNameInput');
    const name = nameInput.value.trim();
    const content = textarea.value;
    
    if (!name) {
        showNotification('Please enter a formula name', 'error');
        nameInput.focus();
        return;
    }
    
    if (!content.trim()) {
        showNotification('Cannot save empty formula', 'error');
        return;
    }
    
    const formulas = getSavedFormulas();
    
    // Check if name already exists
    const existingIndex = formulas.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
    
    const formula = {
        id: existingIndex >= 0 ? formulas[existingIndex].id : Date.now().toString(),
        name: name,
        content: content,
        updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        formulas[existingIndex] = formula;
        showNotification(`Formula "${name}" updated!`);
    } else {
        formulas.unshift(formula);
        showNotification(`Formula "${name}" saved!`);
    }
    
    setSavedFormulas(formulas);
    nameInput.value = '';
    renderFormulasList();
}

// Load a formula into the editor
function loadFormula(id) {
    const formulas = getSavedFormulas();
    const formula = formulas.find(f => f.id === id);
    
    if (formula) {
        setTextareaContent(formula.content, formula.content.length);
        document.getElementById('formulaNameInput').value = formula.name;
        updateEditor();
        extractAndDisplayFields();
        toggleFormulasSidebar();
        showNotification(`Loaded "${formula.name}"`);
    }
}

// Delete a formula
function deleteFormula(id, event) {
    event.stopPropagation();
    
    const formulas = getSavedFormulas();
    const formula = formulas.find(f => f.id === id);
    
    if (formula && confirm(`Delete "${formula.name}"?`)) {
        const updatedFormulas = formulas.filter(f => f.id !== id);
        setSavedFormulas(updatedFormulas);
        renderFormulasList();
        showNotification(`Deleted "${formula.name}"`);
    }
}

// Format date for display
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

// Render the formulas list
function renderFormulasList() {
    const formulas = getSavedFormulas();
    const container = document.getElementById('formulasList');
    
    if (formulas.length === 0) {
        container.innerHTML = `
            <div class="no-formulas">
                <div class="no-formulas-icon">📁</div>
                <div>No saved formulas yet</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = formulas.map(formula => `
        <div class="formula-item" onclick="loadFormula('${formula.id}')">
            <div class="formula-item-info">
                <div class="formula-item-name">${escapeHtml(formula.name)}</div>
                <div class="formula-item-date">${formatDate(formula.updatedAt)}</div>
            </div>
            <div class="formula-item-actions">
                <button class="formula-action-btn delete" onclick="deleteFormula('${formula.id}', event)" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Export all formulas to a JSON file
function exportFormulas() {
    const formulas = getSavedFormulas();
    
    if (formulas.length === 0) {
        showNotification('No formulas to export', 'error');
        return;
    }
    
    const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        formulas: formulas
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulas-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${formulas.length} formula${formulas.length > 1 ? 's' : ''}`);
}

// Import formulas from a JSON file
function importFormulas(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the import data
            if (!data.formulas || !Array.isArray(data.formulas)) {
                showNotification('Invalid import file format', 'error');
                return;
            }
            
            const existingFormulas = getSavedFormulas();
            const existingNames = new Set(existingFormulas.map(f => f.name.toLowerCase()));
            
            let imported = 0;
            let skipped = 0;
            
            for (const formula of data.formulas) {
                // Validate each formula has required fields
                if (!formula.name || !formula.content) {
                    skipped++;
                    continue;
                }
                
                // Check for duplicates by name
                if (existingNames.has(formula.name.toLowerCase())) {
                    // Update existing formula
                    const existingIndex = existingFormulas.findIndex(
                        f => f.name.toLowerCase() === formula.name.toLowerCase()
                    );
                    if (existingIndex >= 0) {
                        existingFormulas[existingIndex] = {
                            ...existingFormulas[existingIndex],
                            content: formula.content,
                            updatedAt: new Date().toISOString()
                        };
                        imported++;
                    }
                } else {
                    // Add new formula
                    existingFormulas.unshift({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: formula.name,
                        content: formula.content,
                        updatedAt: formula.updatedAt || new Date().toISOString()
                    });
                    existingNames.add(formula.name.toLowerCase());
                    imported++;
                }
            }
            
            setSavedFormulas(existingFormulas);
            renderFormulasList();
            
            if (imported > 0) {
                showNotification(`Imported ${imported} formula${imported > 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped` : ''}`);
            } else {
                showNotification('No formulas were imported', 'error');
            }
        } catch (err) {
            showNotification('Failed to parse import file', 'error');
            console.error('Import error:', err);
        }
    };
    
    reader.readAsText(file);
    
    // Reset the file input so the same file can be imported again
    event.target.value = '';
}


function extractFields(code) {
    const fieldPattern = /\[\[\s*([^\]]+?)\s*\]\]/g;
    const fields = new Set();
    let match;
    
    while ((match = fieldPattern.exec(code)) !== null) {
        fields.add(match[1].trim());
    }
    
    return Array.from(fields).sort();
}

function extractAndDisplayFields() {
    const code = textarea.value;
    const fields = extractFields(code);
    const container = document.getElementById('fieldsContainer');
    
    if (fields.length === 0) {
        container.innerHTML = '<div class="no-fields">No fields detected. Add field tokens like [[FieldName]] to your formula.</div>';
        return;
    }
    
    // Preserve existing values
    const oldValues = { ...fieldValues };
    fieldValues = {};
    
    container.innerHTML = fields.map(field => {
        const existingValue = oldValues[field] || '';
        fieldValues[field] = existingValue;
        return `
            <div class="field-item">
                <label class="field-label">[[ ${field} ]]</label>
                <input type="text" 
                       class="field-input" 
                       placeholder="Enter value..."
                       value="${escapeHtml(existingValue)}"
                       onchange="updateFieldValue('${escapeHtml(field)}', this.value)"
                       oninput="updateFieldValue('${escapeHtml(field)}', this.value)">
            </div>
        `;
    }).join('');
}

function updateFieldValue(field, value) {
    fieldValues[field] = value;
}

// ============================================
// UI Functions
// ============================================

function toggleFunctionStatus() {
    const container = document.getElementById('functionStatusContainer');
    const toggle = document.querySelector('.function-status-toggle');
    container.classList.toggle('show');
    toggle.textContent = container.classList.contains('show') ? 'Hide Details' : 'Show Details';
}

function toggleVideoTutorial(event) {
    event.preventDefault();
    const container = document.getElementById('videoContainer');
    container.classList.toggle('show');
}

function renderFunctionStatus() {
    const summaryEl = document.getElementById('functionStatusSummary');
    const gridEl = document.getElementById('functionStatusGrid');
    
    let implemented = 0, partial = 0, notImplemented = 0;
    
    const items = Object.entries(FUNCTION_DATA).map(([name, data]) => {
        const status = data.status;
        if (status === 'implemented') implemented++;
        else if (status === 'partial') partial++;
        else notImplemented++;
        
        const icon = status === 'implemented' ? '✓' : status === 'partial' ? '◐' : '✗';
        return `<div class="function-status-item ${status}"><span class="status-icon">${icon}</span>${name}</div>`;
    });
    
    summaryEl.innerHTML = `
        <div class="status-count implemented">✓ ${implemented} Implemented</div>
        <div class="status-count partial">◐ ${partial} Partial</div>
        <div class="status-count not-implemented">✗ ${notImplemented} Not Available</div>
    `;
    
    gridEl.innerHTML = items.join('');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderFunctionReference() {
    const container = document.getElementById('functionList');
    container.innerHTML = FUNCTION_LIST.map(name => {
        const data = FUNCTION_DATA[name];
        const syntax = getFunctionSyntax(name);
        return `
        <div class="function-item" data-name="${name}">
            <div class="function-header" onclick="toggleFunction(this)">
                <span class="function-name">=${name}()</span>
                <span class="function-arrow">▼</span>
            </div>
            <div class="function-details">
                <div class="function-syntax">${escapeHtml(syntax)}</div>
                <div class="function-description">${data.description}</div>
                <div class="function-example">
                    <div class="function-example-label">Example</div>
                    <div class="function-example-code">${escapeHtml(data.example)}</div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function toggleFunction(header) {
}

function filterFunctions() {
    const search = document.getElementById('functionSearch').value.toLowerCase();
    const container = document.getElementById('functionList');
    
    const filtered = FUNCTION_LIST.filter(name => name.toLowerCase().includes(search));
    
    container.innerHTML = filtered.map(name => {
        const data = FUNCTION_DATA[name];
        const syntax = getFunctionSyntax(name);
        return `
        <div class="function-item" data-name="${name}">
            <div class="function-header" onclick="toggleFunction(this)">
                <span class="function-name">=${name}()</span>
                <span class="function-arrow">▼</span>
            </div>
            <div class="function-details">
                <div class="function-syntax">${escapeHtml(syntax)}</div>
                <div class="function-description">${data.description}</div>
                <div class="function-example">
                    <div class="function-example-label">Example</div>
                    <div class="function-example-code">${escapeHtml(data.example)}</div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    loadSettings();
    renderFunctionReference();
    renderFormulasList();
    renderFunctionStatus();
    updateEditor();
    
    // Prevent parameter hint and function help panel from stealing focus from textarea
    // We save the textarea selection, then restore it after any click in these panels
    const paramHint = document.getElementById('parameterHint');
    const funcHelpPanel = document.getElementById('functionHelpPanel');
    const codeTextarea = document.getElementById('codeTextarea');
    
    let savedSelection = null;
    
    function saveSelection() {
        if (document.activeElement === codeTextarea) {
            savedSelection = {
                start: codeTextarea.selectionStart,
                end: codeTextarea.selectionEnd
            };
        }
    }
    
    function restoreSelection() {
        if (savedSelection !== null) {
            // Use setTimeout to restore after the click completes
            setTimeout(() => {
                codeTextarea.focus();
                codeTextarea.setSelectionRange(savedSelection.start, savedSelection.end);
            }, 0);
        }
    }
    
    if (paramHint) {
        paramHint.addEventListener('mousedown', saveSelection);
        paramHint.addEventListener('click', restoreSelection);
    }
    
    if (funcHelpPanel) {
        funcHelpPanel.addEventListener('mousedown', saveSelection);
        funcHelpPanel.addEventListener('click', restoreSelection);
    }
});
