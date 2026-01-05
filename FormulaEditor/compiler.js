/**
 * ProcessPlan Formula Compiler
 * Tokenizer, Parser, and Evaluator for ProcessPlan formulas
 * Requires: functions.js to be loaded first
 */

function compilerTokenize(formula) {
    const tokens = [];
    let i = 0;
    
    while (i < formula.length) {
        // Skip whitespace
        if (/\s/.test(formula[i])) {
            i++;
            continue;
        }
        
        // Skip comments (// style)
        if (formula[i] === '/' && formula[i + 1] === '/') {
            while (i < formula.length && formula[i] !== '\n') i++;
            continue;
        }
        
        // Field reference [[...]]
        if (formula[i] === '[' && formula[i + 1] === '[') {
            let value = '';
            i += 2;
            while (i < formula.length && !(formula[i] === ']' && formula[i + 1] === ']')) {
                value += formula[i];
                i++;
            }
            i += 2; // Skip ]]
            tokens.push({ type: 'FIELD', value: value.trim() });
            continue;
        }
        
        // String literal (double quotes)
        if (formula[i] === '"') {
            let value = '';
            i++;
            while (i < formula.length && formula[i] !== '"') {
                if (formula[i] === '\\' && i + 1 < formula.length) {
                    value += formula[i + 1];
                    i += 2;
                } else {
                    value += formula[i];
                    i++;
                }
            }
            i++; // Skip closing quote
            tokens.push({ type: 'STRING', value });
            continue;
        }
        
        // String literal (single quotes)
        if (formula[i] === "'") {
            let value = '';
            i++;
            while (i < formula.length && formula[i] !== "'") {
                value += formula[i];
                i++;
            }
            i++; // Skip closing quote
            tokens.push({ type: 'STRING', value });
            continue;
        }
        
        // Number
        if (/\d/.test(formula[i]) || (formula[i] === '-' && /\d/.test(formula[i + 1]))) {
            let value = '';
            if (formula[i] === '-') {
                value += '-';
                i++;
            }
            while (i < formula.length && /[\d.]/.test(formula[i])) {
                value += formula[i];
                i++;
            }
            tokens.push({ type: 'NUMBER', value: parseFloat(value) });
            continue;
        }
        
        // Function call starting with = and possibly !
        if (formula[i] === '=') {
            i++;
            let name = '';
            if (formula[i] === '!') {
                name += '!';
                i++;
            }
            while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
                name += formula[i];
                i++;
            }
            tokens.push({ type: 'FUNCTION', value: name.toUpperCase() });
            continue;
        }
        
        // Operators and delimiters
        if (formula[i] === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            i++;
            continue;
        }
        if (formula[i] === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            i++;
            continue;
        }
        if (formula[i] === ';') {
            tokens.push({ type: 'SEMICOLON', value: ';' });
            i++;
            continue;
        }
        if (formula[i] === ',') {
            tokens.push({ type: 'COMMA', value: ',' });
            i++;
            continue;
        }
        
        // Arithmetic operators for CALC
        if (/[+\-*/%]/.test(formula[i])) {
            tokens.push({ type: 'OPERATOR', value: formula[i] });
            i++;
            continue;
        }
        
        // Plain text/identifier (until we hit a delimiter)
        let text = '';
        while (i < formula.length && !/[\s\[\]();,=]/.test(formula[i])) {
            text += formula[i];
            i++;
        }
        if (text) {
            // Check if it looks like a date
            if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
                tokens.push({ type: 'DATE', value: text });
            } else if (/^\d+$/.test(text)) {
                tokens.push({ type: 'NUMBER', value: parseInt(text) });
            } else if (/^\d*\.\d+$/.test(text)) {
                tokens.push({ type: 'NUMBER', value: parseFloat(text) });
            } else {
                tokens.push({ type: 'TEXT', value: text });
            }
        }
    }
    
    return tokens;
}

// AST Node types
class ASTNode {
    constructor(type, value = null, children = []) {
        this.type = type;
        this.value = value;
        this.children = children;
    }
}

// Parser
class FormulaParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }
    
    current() {
        return this.tokens[this.pos];
    }
    
    consume(expectedType = null) {
        const token = this.current();
        if (expectedType && (!token || token.type !== expectedType)) {
            throw new Error(`Expected ${expectedType} but got ${token ? token.type : 'EOF'}`);
        }
        this.pos++;
        return token;
    }
    
    peek(offset = 0) {
        return this.tokens[this.pos + offset];
    }
    
    parse() {
        const nodes = [];
        while (this.pos < this.tokens.length) {
            nodes.push(this.parseExpression());
        }
        // If multiple top-level nodes, concatenate them
        if (nodes.length === 1) return nodes[0];
        return new ASTNode('CONCAT', null, nodes);
    }
    
    parseExpression() {
        const token = this.current();
        if (!token) return new ASTNode('LITERAL', '');
        
        if (token.type === 'FUNCTION') {
            return this.parseFunctionCall();
        }
        if (token.type === 'FIELD') {
            this.consume();
            return new ASTNode('FIELD', token.value);
        }
        if (token.type === 'STRING') {
            this.consume();
            return new ASTNode('LITERAL', token.value);
        }
        if (token.type === 'NUMBER') {
            this.consume();
            return new ASTNode('LITERAL', token.value);
        }
        if (token.type === 'DATE') {
            this.consume();
            return new ASTNode('LITERAL', token.value);
        }
        if (token.type === 'TEXT') {
            this.consume();
            return new ASTNode('LITERAL', token.value);
        }
        if (token.type === 'OPERATOR') {
            this.consume();
            return new ASTNode('LITERAL', token.value);
        }
        
        // Skip unexpected tokens
        this.consume();
        return new ASTNode('LITERAL', '');
    }
    
    parseFunctionCall() {
        const funcToken = this.consume('FUNCTION');
        const funcName = funcToken.value;
        
        this.consume('LPAREN');
        
        const args = [];
        while (this.current() && this.current().type !== 'RPAREN') {
            // Collect all tokens until semicolon or rparen as one argument
            const argParts = [];
            let parenDepth = 0;
            
            while (this.current()) {
                const cur = this.current();
                
                if (cur.type === 'LPAREN') parenDepth++;
                if (cur.type === 'RPAREN') {
                    if (parenDepth === 0) break;
                    parenDepth--;
                }
                if ((cur.type === 'SEMICOLON' || cur.type === 'COMMA') && parenDepth === 0) break;
                
                if (cur.type === 'FUNCTION') {
                    argParts.push(this.parseFunctionCall());
                } else {
                    argParts.push(this.parseExpression());
                }
            }
            
            // Combine argument parts
            if (argParts.length === 1) {
                args.push(argParts[0]);
            } else if (argParts.length > 1) {
                args.push(new ASTNode('CONCAT', null, argParts));
            }
            
            // Skip semicolon/comma separator
            if (this.current() && (this.current().type === 'SEMICOLON' || this.current().type === 'COMMA')) {
                this.consume();
            }
        }
        
        this.consume('RPAREN');
        
        return new ASTNode('FUNCTION', funcName, args);
    }
}

// Evaluator
class FormulaEvaluator {
    constructor(fieldValues) {
        this.fieldValues = fieldValues;
    }
    
    evaluate(node) {
        if (!node) return '';
        
        switch (node.type) {
            case 'LITERAL':
                return node.value;
                
            case 'FIELD':
                return this.fieldValues[node.value] ?? `[[${node.value}]]`;
                
            case 'CONCAT':
                return node.children.map(c => this.stringify(this.evaluate(c))).join('');
                
            case 'FUNCTION':
                return this.evaluateFunction(node.value, node.children);
                
            default:
                return '';
        }
    }
    
    stringify(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? '1' : '0';
        return String(value);
    }
    
    toNumber(value) {
        if (typeof value === 'number') return value;
        const str = this.stringify(value).replace(/[^0-9.\-]/g, '');
        return parseFloat(str) || 0;
    }
    
    toBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        const str = this.stringify(value).toLowerCase();
        return str === 'true' || str === '1' || (parseFloat(str) > 0);
    }
    
    parseDate(value) {
        const str = this.stringify(value);
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }
    
    formatDate(format, date) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const pad = (n, width = 2) => String(n).padStart(width, '0');
        
        const hours24 = date.getHours();
        const hours12 = hours24 % 12 || 12;
        const ampm = hours24 < 12 ? 'AM' : 'PM';
        
        // Process format string - order matters (longer patterns first)
        let result = format;
        
        // Year patterns
        result = result.replace(/yyyyy/g, pad(date.getFullYear(), 5));
        result = result.replace(/yyyy/g, pad(date.getFullYear(), 4));
        result = result.replace(/yyy/g, pad(date.getFullYear(), 3));
        result = result.replace(/yy/g, pad(date.getFullYear() % 100, 2));
        result = result.replace(/y/g, String(date.getFullYear() % 100));
        
        // Month patterns (must come before minutes due to 'm' conflict)
        result = result.replace(/MMMM/g, monthNames[date.getMonth()]);
        result = result.replace(/MMM/g, monthNamesShort[date.getMonth()]);
        result = result.replace(/MM/g, pad(date.getMonth() + 1));
        result = result.replace(/M/g, String(date.getMonth() + 1));
        
        // Day patterns
        result = result.replace(/dddd/g, dayNames[date.getDay()]);
        result = result.replace(/ddd/g, dayNamesShort[date.getDay()]);
        result = result.replace(/dd/g, pad(date.getDate()));
        result = result.replace(/d/g, String(date.getDate()));
        
        // Hour patterns (24-hour)
        result = result.replace(/HH/g, pad(hours24));
        result = result.replace(/H/g, String(hours24));
        
        // Hour patterns (12-hour)
        result = result.replace(/hh/g, pad(hours12));
        result = result.replace(/h/g, String(hours12));
        
        // Minute patterns
        result = result.replace(/mm/g, pad(date.getMinutes()));
        result = result.replace(/m/g, String(date.getMinutes()));
        
        // Second patterns
        result = result.replace(/ss/g, pad(date.getSeconds()));
        result = result.replace(/s/g, String(date.getSeconds()));
        
        // AM/PM patterns
        result = result.replace(/tt/g, ampm.toLowerCase());
        result = result.replace(/TT/g, ampm);
        result = result.replace(/t/g, ampm.charAt(0).toLowerCase());
        result = result.replace(/T/g, ampm.charAt(0));
        
        return result;
    }
    
    evaluateFunction(name, argNodes) {
        const status = getFunctionStatus(name);
        if (status === 'not-implemented') {
            return `[${name}: Not available - requires ProcessPlan backend]`;
        }
        
        // Helper to evaluate args lazily
        const evalArg = (index) => this.evaluate(argNodes[index]);
        const evalAllArgs = () => argNodes.map(n => this.evaluate(n));
        
        switch (name) {
            // String functions
            case 'APPEND': {
                const args = evalAllArgs();
                const separator = this.stringify(args[0]);
                return args.slice(1).map(a => this.stringify(a)).filter(s => s !== '').join(separator);
            }
            
            case 'CONTAINS': {
                const search = this.stringify(evalArg(0)).toLowerCase();
                const text = this.stringify(evalArg(1)).toLowerCase();
                return text.includes(search) ? 1 : 0;
            }
            
            case '!CONTAINS': {
                const search = this.stringify(evalArg(0)).toLowerCase();
                const text = this.stringify(evalArg(1)).toLowerCase();
                return !text.includes(search) ? 1 : 0;
            }
            
            case 'EQUALS': {
                const args = evalAllArgs();
                const first = this.stringify(args[0]);
                return args.slice(1).every(a => this.stringify(a) === first) ? 1 : 0;
            }
            
            case '!EQUALS': {
                const args = evalAllArgs();
                const first = this.stringify(args[0]);
                return args.slice(1).every(a => this.stringify(a) !== first) ? 1 : 0;
            }
            
            case 'LEFT': {
                const count = this.toNumber(evalArg(0));
                const str = this.stringify(evalArg(1));
                return str.substring(0, count);
            }
            
            case 'RIGHT': {
                const count = this.toNumber(evalArg(0));
                const str = this.stringify(evalArg(1));
                return str.substring(str.length - count);
            }
            
            case 'LEFTOF': {
                const search = this.stringify(evalArg(0));
                const str = this.stringify(evalArg(1));
                const idx = str.indexOf(search);
                return idx >= 0 ? str.substring(0, idx) : str;
            }
            
            case 'RIGHTOF': {
                const search = this.stringify(evalArg(0));
                const str = this.stringify(evalArg(1));
                const idx = str.indexOf(search);
                return idx >= 0 ? str.substring(idx + search.length) : '';
            }
            
            case 'LEFTOFLAST': {
                const search = this.stringify(evalArg(0));
                const str = this.stringify(evalArg(1));
                const idx = str.lastIndexOf(search);
                return idx >= 0 ? str.substring(0, idx) : str;
            }
            
            case 'RIGHTOFLAST': {
                const search = this.stringify(evalArg(0));
                const str = this.stringify(evalArg(1));
                const idx = str.lastIndexOf(search);
                return idx >= 0 ? str.substring(idx + search.length) : '';
            }
            
            case 'LENGTH': {
                return this.stringify(evalArg(0)).length;
            }
            
            case 'LOWERCASE': {
                return this.stringify(evalArg(0)).toLowerCase();
            }
            
            case 'UPPERCASE': {
                return this.stringify(evalArg(0)).toUpperCase();
            }
            
            case 'TITLECASE': {
                return this.stringify(evalArg(0)).replace(/\w\S*/g, txt => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
            }
            
            case 'TRIM': {
                return this.stringify(evalArg(0)).trim().replace(/\s+/g, ' ');
            }
            
            case 'REPLACE': {
                const search = this.stringify(evalArg(0));
                const replacement = this.stringify(evalArg(1));
                const str = this.stringify(evalArg(2));
                return str.split(search).join(replacement);
            }
            
            case 'REMOVECHARS': {
                const str = this.stringify(evalArg(0));
                const chars = this.stringify(evalArg(1));
                let result = str;
                for (const c of chars) {
                    result = result.split(c).join('');
                }
                return result;
            }
            
            case 'REMOVESPACES': {
                return this.stringify(evalArg(0)).replace(/\s/g, '');
            }
            
            case 'REMOVEDIACRITICS': {
                return this.stringify(evalArg(0)).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            
            case 'REMOVESYMBOLS': {
                return this.stringify(evalArg(0)).replace(/[^a-zA-Z0-9\s]/g, '');
            }
            
            case 'NORMALIZETEXT': {
                return this.stringify(evalArg(0)).replace(/\s+/g, '').replace(/<[^>]*>/g, '');
            }
            
            case 'PARSE': {
                const leftMarker = this.stringify(evalArg(0));
                const rightMarker = this.stringify(evalArg(1));
                const str = this.stringify(evalArg(2));
                const leftIdx = str.indexOf(leftMarker);
                if (leftIdx < 0) return '';
                const afterLeft = str.substring(leftIdx + leftMarker.length);
                const rightIdx = afterLeft.indexOf(rightMarker);
                return rightIdx >= 0 ? afterLeft.substring(0, rightIdx) : afterLeft;
            }
            
            case 'REGEXFIND': {
                try {
                    const pattern = this.stringify(evalArg(0));
                    const str = this.stringify(evalArg(1));
                    const regex = new RegExp(pattern);
                    const match = str.match(regex);
                    return match ? match[0] : '';
                } catch (e) {
                    return `[Regex error: ${e.message}]`;
                }
            }
            
            case 'REGEXWORDSONLY': {
                const text = this.stringify(evalArg(0));
                return text.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(w => w).join('|');
            }
            
            case 'URLENCODE': {
                return encodeURIComponent(this.stringify(evalArg(0)));
            }
            
            case 'ENCLOSE': {
                return this.stringify(evalArg(0));
            }
            
            // Number functions
            case 'CALC': {
                // Evaluate all parts and concatenate to form expression
                const exprParts = argNodes.map(n => this.stringify(this.evaluate(n)));
                const expr = exprParts.join('');
                try {
                    // Safe math evaluation (only basic operations)
                    const sanitized = expr.replace(/[^0-9+\-*/%().\s]/g, '');
                    return Function('"use strict"; return (' + sanitized + ')')();
                } catch (e) {
                    return `[Calc error: ${e.message}]`;
                }
            }
            
            case 'NUM': {
                const str = this.stringify(evalArg(0));
                const nums = str.match(/-?\d+\.?\d*/);
                return nums ? parseFloat(nums[0]) : 0;
            }
            
            case 'NUMSPLIT': {
                const str = this.stringify(evalArg(0));
                const nums = str.match(/-?\d+\.?\d*/g);
                return nums ? nums.join(';') : '';
            }
            
            case 'ROUND': {
                const decimals = this.toNumber(evalArg(0));
                const num = this.toNumber(evalArg(1));
                return Number(num.toFixed(decimals));
            }
            
            case 'FLOOR': {
                return Math.floor(this.toNumber(evalArg(0)));
            }
            
            case 'CEILING': {
                return Math.ceil(this.toNumber(evalArg(0)));
            }
            
            case 'MAX': {
                const nums = evalAllArgs().map(a => this.toNumber(a));
                return Math.max(...nums);
            }
            
            case 'MIN': {
                const nums = evalAllArgs().map(a => this.toNumber(a));
                return Math.min(...nums);
            }
            
            case 'SUM': {
                const nums = evalAllArgs().map(a => this.toNumber(a));
                return nums.reduce((sum, n) => sum + n, 0);
            }
            
            case 'RANDOMNUM': {
                const min = this.toNumber(evalArg(0));
                const max = this.toNumber(evalArg(1));
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            
            case 'PARTITION': {
                const num = this.toNumber(evalArg(0));
                const divisor = this.toNumber(evalArg(1));
                const parts = [];
                let remaining = num;
                while (remaining > 0) {
                    const part = Math.min(divisor, remaining);
                    parts.push(part);
                    remaining -= part;
                }
                return parts.join(';');
            }
            
            // Comparison functions
            case 'GTNUM': {
                return this.toNumber(evalArg(0)) > this.toNumber(evalArg(1)) ? 1 : 0;
            }
            
            case 'GTENUM': {
                return this.toNumber(evalArg(0)) >= this.toNumber(evalArg(1)) ? 1 : 0;
            }
            
            case 'LTNUM': {
                return this.toNumber(evalArg(0)) < this.toNumber(evalArg(1)) ? 1 : 0;
            }
            
            case 'LTENUM': {
                return this.toNumber(evalArg(0)) <= this.toNumber(evalArg(1)) ? 1 : 0;
            }
            
            case 'BENUM': {
                const num = this.toNumber(evalArg(0));
                const min = this.toNumber(evalArg(1));
                const max = this.toNumber(evalArg(2));
                return (num >= min && num <= max) ? 1 : 0;
            }
            
            // Logic functions
            case 'IF': {
                // Process condition-result pairs
                for (let i = 0; i < argNodes.length - 1; i += 2) {
                    const condition = this.toBoolean(evalArg(i));
                    if (condition) {
                        return evalArg(i + 1);
                    }
                }
                // Last argument is the else case (if odd number of args)
                if (argNodes.length % 2 === 1) {
                    return evalArg(argNodes.length - 1);
                }
                return '';
            }
            
            case 'HASVALUE': {
                const val = this.stringify(evalArg(0)).trim();
                return val !== '' ? 1 : 0;
            }
            
            case 'ISEMPTY': {
                const val = this.stringify(evalArg(0)).trim();
                return val === '' ? 1 : 0;
            }
            
            case 'ISTRUE': {
                return evalAllArgs().every(a => this.toBoolean(a)) ? 1 : 0;
            }
            
            case 'ANYTRUE': {
                return evalAllArgs().some(a => this.toBoolean(a)) ? 1 : 0;
            }
            
            case 'NOT': {
                return this.toBoolean(evalArg(0)) ? 0 : 1;
            }
            
            case 'FIRSTVALUE': {
                for (const node of argNodes) {
                    const val = this.stringify(this.evaluate(node)).trim();
                    if (val !== '') return val;
                }
                return '';
            }
            
            // List functions
            case 'SPLIT': {
                const delimiter = this.stringify(evalArg(0));
                const index = this.toNumber(evalArg(1));
                const str = this.stringify(evalArg(2));
                const parts = str.split(delimiter);
                if (index === 0) return parts.join(';');
                return parts[index - 1] || '';
            }
            
            case 'LISTCOUNT': {
                const args = evalAllArgs();
                // If single argument with semicolons, split it
                if (args.length === 1) {
                    return this.stringify(args[0]).split(';').filter(s => s.trim()).length;
                }
                return args.filter(a => this.stringify(a).trim()).length;
            }
            
            case 'LISTINDEX': {
                const index = this.toNumber(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                if (index === 0) return list.join(';');
                return list[index - 1] || '';
            }
            
            case 'LISTJOIN': {
                let separator = this.stringify(evalArg(0));
                // Handle special keywords
                separator = separator
                    .replace(/ppnewline/gi, '\n')
                    .replace(/ppcrlf/gi, '\r\n')
                    .replace(/pptab/gi, '\t')
                    .replace(/ppsp/gi, ' ');
                const list = this.stringify(evalArg(1)).split(';');
                return list.join(separator);
            }
            
            case 'LISTMERGE': {
                const list1 = this.stringify(evalArg(0)).split(';').filter(s => s);
                const list2 = this.stringify(evalArg(1)).split(';').filter(s => s);
                return [...new Set([...list1, ...list2])].join(';');
            }
            
            case 'LISTDIFF': {
                const list1 = this.stringify(evalArg(0)).split(';').filter(s => s);
                const list2 = new Set(this.stringify(evalArg(1)).split(';').filter(s => s));
                return list1.filter(item => !list2.has(item)).join(';');
            }
            
            case 'LISTINTERSECT': {
                const list1 = this.stringify(evalArg(0)).split(';').filter(s => s);
                const list2 = new Set(this.stringify(evalArg(1)).split(';').filter(s => s));
                return list1.filter(item => list2.has(item)).join(';');
            }
            
            case 'LISTUNIQUE': {
                const list = this.stringify(evalArg(0)).split(';').filter(s => s);
                return [...new Set(list)].join(';');
            }
            
            case 'LISTASLINES': {
                return this.stringify(evalArg(0)).split(';').join('\n');
            }
            
            case 'LINESPLIT': {
                const index = this.toNumber(evalArg(0));
                const lines = this.stringify(evalArg(1)).split(/\r?\n/);
                if (index === 0) return lines.join(';');
                return lines[index - 1] || '';
            }
            
            case 'WORDSPLIT': {
                const index = this.toNumber(evalArg(0));
                const words = this.stringify(evalArg(1)).split(/\s+/).filter(w => w);
                if (index === 0) return words.join(';');
                return words[index - 1] || '';
            }
            
            case 'EMAILSPLIT': {
                const index = this.toNumber(evalArg(0));
                const text = this.stringify(evalArg(1));
                const emails = text.match(/[^\s,;]+@[^\s,;]+/g) || [];
                if (index === 0) return emails.join(';');
                return emails[index - 1] || '';
            }
            
            case 'LISTITEMAPPEND': {
                const append = this.stringify(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => item + append).join(';');
            }
            
            case 'LISTITEMPREPEND': {
                const prepend = this.stringify(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => prepend + item).join(';');
            }
            
            case 'LISTITEMCONTAINS': {
                const search = this.stringify(evalArg(0)).toLowerCase();
                const list = this.stringify(evalArg(1)).split(';');
                return list.filter(item => item.toLowerCase().includes(search)).join(';');
            }
            
            case 'LISTITEMSTARTSWITH': {
                const search = this.stringify(evalArg(0)).toLowerCase();
                const list = this.stringify(evalArg(1)).split(';');
                return list.filter(item => item.toLowerCase().startsWith(search)).join(';');
            }
            
            case 'LISTITEMENDSWITH': {
                const search = this.stringify(evalArg(0)).toLowerCase();
                const list = this.stringify(evalArg(1)).split(';');
                return list.filter(item => item.toLowerCase().endsWith(search)).join(';');
            }
            
            case 'LISTITEMLEFT': {
                const count = this.toNumber(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => item.substring(0, count)).join(';');
            }
            
            case 'LISTITEMRIGHT': {
                const count = this.toNumber(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => item.substring(item.length - count)).join(';');
            }
            
            case 'LISTITEMLEFTOF': {
                const search = this.stringify(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => {
                    const idx = item.indexOf(search);
                    return idx >= 0 ? item.substring(0, idx) : item;
                }).join(';');
            }
            
            case 'LISTITEMRIGHTOF': {
                const search = this.stringify(evalArg(0));
                const list = this.stringify(evalArg(1)).split(';');
                return list.map(item => {
                    const idx = item.indexOf(search);
                    return idx >= 0 ? item.substring(idx + search.length) : '';
                }).join(';');
            }
            
            case 'LISTITEMREGEX': {
                try {
                    const pattern = this.stringify(evalArg(0));
                    const list = this.stringify(evalArg(1)).split(';');
                    const regex = new RegExp(pattern);
                    return list.filter(item => regex.test(item)).join(';');
                } catch (e) {
                    return `[Regex error: ${e.message}]`;
                }
            }
            
            // Date functions
            case 'YEAR': {
                const d = this.parseDate(evalArg(0));
                return d ? d.getFullYear() : 0;
            }
            
            case 'MONTH': {
                const d = this.parseDate(evalArg(0));
                return d ? d.getMonth() + 1 : 0;
            }
            
            case 'MONTHDAY': {
                const d = this.parseDate(evalArg(0));
                return d ? d.getDate() : 0;
            }
            
            case 'DATEPART': {
                const part = this.stringify(evalArg(0)).toLowerCase();
                const d = this.parseDate(evalArg(1));
                if (!d) return 0;
                switch (part) {
                    case 'year': return d.getFullYear();
                    case 'month': return d.getMonth() + 1;
                    case 'day': return d.getDate();
                    case 'weekday': return d.getDay();
                    case 'hour': return d.getHours();
                    case 'minute': return d.getMinutes();
                    case 'second': return d.getSeconds();
                    case 'yearday': return Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1;
                    default: return 0;
                }
            }
            
            case 'DATESERIAL': {
                const year = this.toNumber(evalArg(0));
                const month = this.toNumber(evalArg(1)) - 1;
                const day = this.toNumber(evalArg(2));
                const d = new Date(year, month, day);
                return d.toISOString().split('T')[0];
            }
            
            case 'DATEDIFF': {
                const unit = this.stringify(evalArg(0)).toLowerCase();
                const d1 = this.parseDate(evalArg(1));
                const d2 = this.parseDate(evalArg(2));
                if (!d1 || !d2) return 0;
                const diffMs = d2 - d1;
                switch (unit) {
                    case 'second': return Math.floor(diffMs / 1000);
                    case 'minute': return Math.floor(diffMs / 60000);
                    case 'hour': return Math.floor(diffMs / 3600000);
                    case 'day': return Math.floor(diffMs / 86400000);
                    case 'week': return Math.floor(diffMs / 604800000);
                    case 'month': return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                    case 'year': return d2.getFullYear() - d1.getFullYear();
                    default: return Math.floor(diffMs / 86400000);
                }
            }
            
            case 'DATEADD': {
                const unit = this.stringify(evalArg(0)).toLowerCase();
                const amount = this.toNumber(evalArg(1));
                const d = this.parseDate(evalArg(2));
                if (!d) return '';
                const result = new Date(d);
                switch (unit) {
                    case 'second': result.setSeconds(result.getSeconds() + amount); break;
                    case 'minute': result.setMinutes(result.getMinutes() + amount); break;
                    case 'hour': result.setHours(result.getHours() + amount); break;
                    case 'day': result.setDate(result.getDate() + amount); break;
                    case 'weekday': {
                        const sign = Math.sign(amount) || 1;
                        const abs = Math.abs(amount);
                        const fullWeeks = Math.floor(abs / 5);
                        const remainder = abs % 5;
                        // Step 1: add full workweeks
                        result.setDate(result.getDate() + sign * fullWeeks * 7);
                        // Step 2: handle remainder
                        let dow = result.getDay();
                        // Normalize weekday index (Mon=0 ... Fri=4)
                        const weekdayIndex =
                            dow === 0 ? -1 :
                            dow === 6 ? -2 :
                            dow - 1;
                        let extraDays = remainder;
                        // Crossing weekend?
                        if (weekdayIndex + remainder >= 5) {
                            extraDays += 2;
                        }
                        result.setDate(result.getDate() + sign * extraDays);
                        break;
                    }
                    case 'week': result.setDate(result.getDate() + (amount * 7)); break;
                    case 'month': result.setMonth(result.getMonth() + amount); break;
                    case 'year': result.setFullYear(result.getFullYear() + amount); break;
                }
                return result.toISOString().split('T')[0];
            }
            
            case 'DATELIST': {
                const d1 = this.parseDate(evalArg(0));
                const d2 = this.parseDate(evalArg(1));
                if (!d1 || !d2) return '';
                const dates = [];
                const current = new Date(d1);
                while (current <= d2) {
                    dates.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                }
                return dates.join(';');
            }
            
            case 'DATETIMEMERGE': {
                const dateStr = this.stringify(evalArg(0));
                const timeStr = this.stringify(evalArg(1));
                return `${dateStr} ${timeStr}`;
            }
            
            case 'DATEROUND': {
                const unit = this.stringify(evalArg(0)).toLowerCase();
                const interval = this.toNumber(evalArg(1));
                const d = this.parseDate(evalArg(2));
                if (!d) return '';
                // Simplified rounding
                return d.toISOString().split('T')[0];
            }
            
            case 'GTDATE': {
                const d1 = this.parseDate(evalArg(0));
                const d2 = this.parseDate(evalArg(1));
                return (d1 && d2 && d1 > d2) ? 1 : 0;
            }
            
            case 'GTEDATE': {
                const d1 = this.parseDate(evalArg(0));
                const d2 = this.parseDate(evalArg(1));
                return (d1 && d2 && d1 >= d2) ? 1 : 0;
            }
            
            case 'LTDATE': {
                const d1 = this.parseDate(evalArg(0));
                const d2 = this.parseDate(evalArg(1));
                return (d1 && d2 && d1 < d2) ? 1 : 0;
            }
            
            case 'LTEDATE': {
                const d1 = this.parseDate(evalArg(0));
                const d2 = this.parseDate(evalArg(1));
                return (d1 && d2 && d1 <= d2) ? 1 : 0;
            }
            
            case 'BDATE': {
                const d = this.parseDate(evalArg(0));
                const d1 = this.parseDate(evalArg(1));
                const d2 = this.parseDate(evalArg(2));
                return (d && d1 && d2 && d > d1 && d < d2) ? 1 : 0;
            }
            
            case 'MONTHLASTDAY': {
                const d = this.parseDate(evalArg(0));
                if (!d) return '';
                const offset = argNodes.length > 1 ? this.toNumber(evalArg(1)) : 0;
                const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                lastDay.setDate(lastDay.getDate() + offset);
                return lastDay.toISOString().split('T')[0];
            }
            
            case 'FISCALMONTH': {
                const startMonth = this.toNumber(evalArg(0));
                const d = this.parseDate(evalArg(1));
                if (!d) return 0;
                const month = d.getMonth() + 1;
                let fiscalMonth = month - startMonth + 1;
                if (fiscalMonth <= 0) fiscalMonth += 12;
                return fiscalMonth;
            }
            
            case 'FISCALYEAR': {
                const startMonth = this.toNumber(evalArg(0));
                const d = this.parseDate(evalArg(1));
                if (!d) return 0;
                const month = d.getMonth() + 1;
                let year = d.getFullYear();
                if (month < startMonth) year--;
                return year;
            }
            
            // JSON functions
            case 'JSONENCODE': {
                return JSON.stringify(this.stringify(evalArg(0)));
            }
            
            case 'JSONEXTRACT': {
                const str = this.stringify(evalArg(0));
                const match = str.match(/[\[{].*[\]}]/s);
                return match ? match[0] : '';
            }
            
            case 'JSONQUERY': {
                const path = this.stringify(evalArg(0));
                const jsonStr = this.stringify(evalArg(1));
                try {
                    const obj = JSON.parse(jsonStr);
                    const parts = path.split('.');
                    let current = obj;
                    for (const part of parts) {
                        if (current === null || current === undefined) return '';
                        current = current[part];
                    }
                    return typeof current === 'object' ? JSON.stringify(current) : this.stringify(current);
                } catch (e) {
                    return `[JSON error: ${e.message}]`;
                }
            }
            
            case 'JSONUPDATE': {
                const jsonStr = this.stringify(evalArg(0));
                const prop = this.stringify(evalArg(1));
                const value = evalArg(2);
                try {
                    const obj = jsonStr ? JSON.parse(jsonStr) : {};
                    obj[prop] = value;
                    return JSON.stringify(obj);
                } catch (e) {
                    return `[JSON error: ${e.message}]`;
                }
            }
            
            case 'JSONINDEX': {
                const index = this.toNumber(evalArg(0));
                const jsonStr = this.stringify(evalArg(1));
                try {
                    const arr = JSON.parse(jsonStr);
                    if (!Array.isArray(arr)) return '';
                    const idx = index < 0 ? arr.length + index : index;
                    const item = arr[idx];
                    return typeof item === 'object' ? JSON.stringify(item) : this.stringify(item);
                } catch (e) {
                    return `[JSON error: ${e.message}]`;
                }
            }
            
            case 'JSONREMOVE': {
                const index = this.toNumber(evalArg(0));
                const jsonStr = this.stringify(evalArg(1));
                try {
                    const arr = JSON.parse(jsonStr);
                    if (!Array.isArray(arr)) return jsonStr;
                    arr.splice(index, 1);
                    return JSON.stringify(arr);
                } catch (e) {
                    return `[JSON error: ${e.message}]`;
                }
            }
            
            case 'JSONFIFO': {
                const jsonStr = this.stringify(evalArg(0));
                const newItem = evalArg(1);
                const maxLen = this.toNumber(evalArg(2));
                try {
                    let arr = jsonStr ? JSON.parse(jsonStr) : [];
                    if (!Array.isArray(arr)) arr = [];
                    arr.unshift(typeof newItem === 'string' ? JSON.parse(newItem) : newItem);
                    if (maxLen > 0 && arr.length > maxLen) {
                        arr = arr.slice(0, maxLen);
                    }
                    return JSON.stringify(arr);
                } catch (e) {
                    return `[JSON error: ${e.message}]`;
                }
            }
            
            case 'FORMAT': {
                const format = this.stringify(evalArg(0));
                const value = evalArg(1);
                
                // Check if format looks like a date format (contains date/time tokens)
                const isDateFormat = /[dMyHhms]/.test(format) && !/[#0]/.test(format);
                
                // Try date formatting if it looks like a date format
                if (isDateFormat) {
                    const d = this.parseDate(value);
                    if (d) {
                        return this.formatDate(format, d);
                    }
                }
                
                // Try number formatting
                const num = this.toNumber(value);
                if (!isNaN(num)) {
                    return this.formatNumber(format, num);
                }
                
                // Fallback - try date parsing for any value
                const d = this.parseDate(value);
                if (d) {
                    return this.formatDate(format, d);
                }
                
                return this.stringify(value);
            }
            
            default:
                return `[Unknown function: ${name}]`;
        }
    }
    
    // .NET-style number formatting
    formatNumber(format, num) {
        // Handle negative numbers
        const isNegative = num < 0;
        const absNum = Math.abs(num);
        
        // Check for decimal places in format
        const decimalIndex = format.indexOf('.');
        let decimals = 0;
        if (decimalIndex !== -1) {
            const afterDecimal = format.substring(decimalIndex + 1).replace(/[^0#]/g, '');
            decimals = afterDecimal.length;
        }
        
        // Round to specified decimal places
        let result = absNum.toFixed(decimals);
        
        // Check if format has thousands separator
        const hasThousands = format.includes(',');
        
        if (hasThousands) {
            // Split into integer and decimal parts
            const parts = result.split('.');
            // Add thousands separators to integer part
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            result = parts.join('.');
        }
        
        // Handle leading zeros from format
        if (decimalIndex === -1) {
            // No decimal in format - check for leading zeros
            const leadingZeros = (format.match(/^0+/) || [''])[0].length;
            if (leadingZeros > result.length) {
                result = result.padStart(leadingZeros, '0');
            }
        } else {
            // Has decimal - check integer part leading zeros
            const intFormat = format.substring(0, decimalIndex).replace(/,/g, '');
            const leadingZeros = (intFormat.match(/0+$/) || [''])[0].length;
            const parts = result.split('.');
            if (leadingZeros > parts[0].length) {
                parts[0] = parts[0].padStart(leadingZeros, '0');
            }
            result = parts.join('.');
        }
        
        return isNegative ? '-' + result : result;
    }
}

// Main compile function
function compileFormula() {
    const code = textarea.value;
    const outputEl = document.getElementById('compilerOutput');
    
    if (!code.trim()) {
        outputEl.textContent = 'Enter a formula to compile...';
        outputEl.className = 'output-box';
        return;
    }
    
    // Strip comments first
    const cleanCode = stripComments(code);
    
    try {
        // Tokenize
        const tokens = compilerTokenize(cleanCode);
        
        // Parse into AST
        const parser = new FormulaParser(tokens);
        const ast = parser.parse();
        
        // Evaluate
        const evaluator = new FormulaEvaluator(fieldValues);
        const result = evaluator.evaluate(ast);
        
        outputEl.textContent = evaluator.stringify(result);
        outputEl.className = 'output-box success';
        showNotification('Formula compiled successfully!');
    } catch (error) {
        outputEl.textContent = `Error: ${error.message}`;
        outputEl.className = 'output-box error';
        showNotification('Compilation error', 'error');
    }
}

// Toggle function status display
function toggleFunctionStatus() {
    const container = document.getElementById('functionStatusContainer');
    const toggle = document.querySelector('.function-status-toggle');
    container.classList.toggle('show');
    toggle.textContent = container.classList.contains('show') ? 'Hide Details' : 'Show Details';
}

// Render function status grid
function renderFunctionStatus() {
    const summaryEl = document.getElementById('functionStatusSummary');
    const gridEl = document.getElementById('functionStatusGrid');
    
    let implemented = 0, partial = 0, notImplemented = 0;
    
    const items = Object.entries(FUNCTION_STATUS).map(([name, status]) => {
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