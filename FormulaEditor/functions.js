/**
 * ProcessPlan Formula Functions - Single Source of Truth
 * All function metadata in one place
 */

const FUNCTION_DATA = {
    '!CONTAINS': {
        params: ['DoesThisValueNotExist', 'AnywhereInsideThisValue'],
        description: 'Returns true if a search text is NOT found within some other text.',
        example: '=!CONTAINS(SearchText; [[Field]])',
        status: 'implemented'
    },
    '!EQUALS': {
        params: ['DoesThisValue', 'NotEqualThisValue', 'OrThisValue', '...'],
        description: 'Returns true if the first value does NOT equal any of the other values.',
        example: '=!EQUALS([[Status]]; Approved; Complete)',
        status: 'implemented'
    },
    'ANYTRUE': {
        params: ['IsThisFunctionTrue', 'IsThisFunctionTrue', '...'],
        description: 'Returns 1 (true) if ANY parameter returns true. Numbers > 0 are true.',
        example: '=ANYTRUE(=EQUALS([[Status]]; Complete); =GTNUM([[Score]]; 80))',
        status: 'implemented'
    },
    'APPEND': {
        params: ['Separator', 'Item1', 'Item2', '...'],
        description: 'Combines values together with a specified separator character.',
        example: '[[FirstName]]=APPEND( ; [[LastName]])',
        status: 'implemented'
    },
    'BDATE': {
        params: ['IsThisDate', 'GreaterThanThisDate', 'AndLessThanThisDate'],
        description: 'Returns 1 if the date is between two other dates (exclusive), 0 if false.',
        example: '=BDATE([[DueDate]]; 2024-01-01; 2024-12-31)',
        status: 'implemented'
    },
    'BEDATE': {
        params: ['IsThisDate', 'GreaterThanOrEqualToThisDate', 'AndLessThanOrEqualToThisDate'],
        description: 'Returns 1 if the date is between or equal to two other dates (inclusive), 0 if false.',
        example: '=BEDATE([[DueDate]]; 2024-01-01; 2024-12-31)',
        status: 'implemented'
    },
    'BENUM': {
        params: ['IsThisNum', 'GreaterThanOrEqualToThisNum', 'AndLessThanOrEqualToThisNum'],
        description: 'Returns 1 if number is between or equal to two numbers (inclusive).',
        example: '=BENUM([[Score]]; 0; 100)',
        status: 'implemented'
    },
    'BNUM': {
        params: ['IsThisNum', 'GreaterThanThisNum', 'AndLessThanThisNum'],
        description: 'Returns 1 if number is between two numbers (exclusive).',
        example: '=BNUM([[Score]]; 0; 100)',
        status: 'implemented'
    },
    'CALC': {
        params: ['MathematicalExpression'],
        description: 'Performs mathematical operations on numbers or numeric fields.',
        example: '=CALC([[Price]] * [[Quantity]])',
        status: 'implemented'
    },
    'CEILING': {
        params: ['AnyNumber'],
        description: 'Returns the smallest integer >= the specified number.',
        example: '=CEILING(4.2)',
        status: 'implemented'
    },
    'CONTAINS': {
        params: ['DoesThisValueExist', 'AnywhereInsideThisValue'],
        description: 'Returns true if search text is found within other text.',
        example: '=CONTAINS(urgent; [[Description]])',
        status: 'implemented'
    },
    'DATEADD': {
        params: ['UnitToIncrement', 'IncrementBy', 'DateToIncrement', 'OptionalMinDate'],
        description: 'Adds/subtracts time from a date. Units: minute, hour, workhour, day, weekday, week, month, year.',
        example: '=DATEADD(day; 30; [[StartDate]])',
        status: 'implemented'
    },
    'DATEDIFF': {
        params: ['ReturnUnit', 'SubtractThisDate', 'FromThisDate'],
        description: 'Returns difference between two dates in specified unit.',
        example: '=DATEDIFF(day; [[StartDate]]; [[EndDate]])',
        status: 'implemented'
    },
    'DATELIST': {
        params: ['StartDate', 'EndDate'],
        description: 'Generates semicolon-separated list of consecutive dates (inclusive).',
        example: '=DATELIST(2024-01-01; 2024-01-31)',
        status: 'partial'
    },
    'DATEPART': {
        params: ['DatePart', 'DateValue'],
        description: 'Extracts numeric part from date: year, weekday, yearday, monthweek, yearweek, month, day, hour, minute, second.',
        example: '=DATEPART(weekday; [[CreatedDate]])',
        status: 'implemented'
    },
    'DATEPATTERN': {
        params: ['DateRecurrencePattern', 'EndDateToGenerate', 'RecurrenceAnchorDate', 'StartFromStartDate'],
        description: 'Generates future dates based on recurrence pattern.',
        example: '=DATEPATTERN(f1w d{12345}; 2024-12-31)',
        status: 'not-implemented'
    },
    'DATEROUND': {
        params: ['UnitToRoundTo', 'IntervalNum', 'DateToRound'],
        description: 'Rounds date/time to nearest interval. Units: minute, hour, day.',
        example: '=DATEROUND(hour; 1; [[Timestamp]])',
        status: 'partial'
    },
    'DATESERIAL': {
        params: ['Year', 'Month', 'Day'],
        description: 'Creates a date from year, month, day components.',
        example: '=DATESERIAL(2024; 12; 25)',
        status: 'implemented'
    },
    'DATETIMEMERGE': {
        params: ['DateValue', 'TimeValue'],
        description: 'Merges date and time into single date/time value.',
        example: '=DATETIMEMERGE([[DateField]]; [[TimeField]])',
        status: 'partial'
    },
    'EMAILSPLIT': {
        params: ['ReturnIndex', 'EmailAddressText'],
        description: 'Splits emails into semicolon list. Index 0 returns all.',
        example: '=EMAILSPLIT(0; email1@test.com, email2@test.com)',
        status: 'partial'
    },
    'ENCLOSE': {
        params: ['ValueYouWantToHide'],
        description: 'Hides text from rest of function. Useful for tokens with semicolons/HTML.',
        example: '=ENCLOSE([[FieldWithSemicolons]])',
        status: 'implemented'
    },
    'EQUALS': {
        params: ['DoesThisValue', 'EqualThisValue', 'AndThisValue', '...'],
        description: 'Returns true if first value equals ALL other values.',
        example: '=EQUALS([[Status]]; Approved)',
        status: 'implemented'
    },
    'FIRSTVALUE': {
        params: ['Item1', 'Item2', 'Item3', '...'],
        description: 'Returns first non-empty value from list.',
        example: '=FIRSTVALUE([[PreferredName]]; [[FirstName]]; Unknown)',
        status: 'implemented'
    },
    'FISCALMONTH': {
        params: ['FiscalYearStartMonthNumber', 'DateToEvaluate'],
        description: 'Returns fiscal month number based on fiscal year start.',
        example: '=FISCALMONTH(7; [[Date]])',
        status: 'partial'
    },
    'FISCALYEAR': {
        params: ['FiscalYearStartMonthNumber', 'DateToEvaluate'],
        description: 'Returns fiscal year based on fiscal year start month.',
        example: '=FISCALYEAR(7; [[Date]])',
        status: 'partial'
    },
    'FLOOR': {
        params: ['AnyNumber'],
        description: 'Returns largest integer <= the specified number.',
        example: '=FLOOR(4.8)',
        status: 'implemented'
    },
    'FORMAT': {
        params: ['FormatString', 'NumberOrDate'],
        description: 'Formats number/date according to format string.',
        example: '=FORMAT(0.00; [[Price]])',
        status: 'partial'
    },
    'GTDATE': {
        params: ['IsThisDate', 'GreaterThanThisDate'],
        description: 'Returns 1 if first date > second date, 0 if false.',
        example: '=GTDATE([[DueDate]]; [[Today]])',
        status: 'implemented'
    },
    'GTEDATE': {
        params: ['Date1', 'Date2'],
        description: 'Returns 1 if Date1 >= Date2, 0 if false.',
        example: '=GTEDATE([[EndDate]]; [[StartDate]])',
        status: 'implemented'
    },
    'GTENUM': {
        params: ['IsThisNumber', 'GreaterOrEqualToThisNumber'],
        description: 'Returns 1 if first number >= second, 0 if false.',
        example: '=GTENUM([[Score]]; 70)',
        status: 'implemented'
    },
    'GTNUM': {
        params: ['IsThisNumber', 'GreaterThanThisNumber'],
        description: 'Returns 1 if first number > second, 0 if false.',
        example: '=GTNUM([[Total]]; 1000)',
        status: 'implemented'
    },
    'HASVALUE': {
        params: ['DoesAnyValueExistHere'],
        description: 'Returns true if any value exists (not empty).',
        example: '=HASVALUE([[Comments]])',
        status: 'implemented'
    },
    'IF': {
        params: ['ConditionCheck', 'IfTrueReturnThis', 'AnotherCondition OR IfFalseReturnThis', 'IfTrueReturnThis', 'OptionalIfFalse'],
        description: 'Checks conditions, returns corresponding values. First true wins.',
        example: '=IF(=GTNUM([[Score]]; 70); Pass; Fail)',
        status: 'implemented'
    },
    'INSTANCECOUNT': {
        params: ['TableID', 'TableQuery'],
        description: 'Returns count of instances matching query.',
        example: '=INSTANCECOUNT(TableID; tf_id_xxx[eq]Value)',
        status: 'not-implemented'
    },
    'INSTANCETASKCOUNT': {
        params: ['ProcessInstanceID', 'TemplateTaskID'],
        description: 'Returns times a task was assigned in a process instance.',
        example: '=INSTANCETASKCOUNT([[ProcessInstanceID]]; TaskID)',
        status: 'not-implemented'
    },
    'INSTANCEUPDATE': {
        params: ['FieldIDToUpdate', 'TableIDToSearch', 'SearchQuery', 'NewFieldValue'],
        description: 'Updates field in processes matching query.',
        example: '=INSTANCEUPDATE(FieldID; TableID; Query; NewValue)',
        status: 'not-implemented'
    },
    'ISCONTEXT': {
        params: ['ContextIDToTest', 'AnotherOptionalID', '...'],
        description: 'Tests if formula runs in specified context.',
        example: '=IF(=ISCONTEXT(FormID); Atlanta; Orlando)',
        status: 'not-implemented'
    },
    'ISEMPTY': {
        params: ['IsTheValueEmpty'],
        description: 'Returns true if field is empty.',
        example: '=ISEMPTY([[Notes]])',
        status: 'implemented'
    },
    'ISPUBLICUSER': {
        params: [],
        description: 'Returns true if executed by non-logged-in user.',
        example: '=IF(=ISPUBLICUSER(); PublicContent; PrivateContent)',
        status: 'not-implemented'
    },
    'ISTRUE': {
        params: ['IsThisTrue', 'OptionalIsThisTrue', '...'],
        description: 'Returns true if ALL values are true. Numbers > 0 are true.',
        example: '=ISTRUE([[IsActive]]; [[IsVerified]])',
        status: 'implemented'
    },
    'JSONENCODE': {
        params: ['TextParameter'],
        description: 'Returns text JSON encoded for use as JSON property value.',
        example: '=JSONENCODE([[MultilineText]])',
        status: 'implemented'
    },
    'JSONEXTRACT': {
        params: ['AnyTextContainingJSON'],
        description: 'Extracts first valid JSON object/array from text.',
        example: '=JSONEXTRACT([[APIResponse]])',
        status: 'implemented'
    },
    'JSONFIFO': {
        params: ['ExistingJsonArray', 'NewJsonObjectToAdd', 'MaximumLength'],
        description: 'Adds JSON object to array. If MaxLength exceeded, removes last.',
        example: '=JSONFIFO([[LogArray]]; {"action":"login"}; 100)',
        status: 'implemented'
    },
    'JSONINDEX': {
        params: ['IndexToRetrieve', 'ExistingJsonArray'],
        description: 'Returns element at index. Positive from start, negative from end.',
        example: '=JSONINDEX(1; [[JsonArray]])',
        status: 'implemented'
    },
    'JSONQUERY': {
        params: ['JSONPropertyName', 'JSONContainingTheProperty'],
        description: 'Queries JSON and extracts property values. Use dot notation for nested.',
        example: '=JSONQUERY(data.name; [[JsonField]])',
        status: 'implemented'
    },
    'JSONREMOVE': {
        params: ['IndexToRemove', 'ExistingJsonArray'],
        description: 'Removes element at index and returns modified array.',
        example: '=JSONREMOVE(1; [[JsonArray]])',
        status: 'implemented'
    },
    'JSONUPDATE': {
        params: ['ExistingJsonObject', 'PropertyName', 'PropertyValue'],
        description: 'Adds or updates property in JSON object.',
        example: '=JSONUPDATE([[JsonObject]]; status; updated)',
        status: 'implemented'
    },
    'LEFT': {
        params: ['Count', 'Value'],
        description: 'Returns specified characters from start of string.',
        example: '=LEFT(3; [[Code]])',
        status: 'implemented'
    },
    'LEFTOF': {
        params: ['ReturnLeftOf', 'SearchInString'],
        description: 'Returns text left of first occurrence of characters.',
        example: '=LEFTOF(@; [[Email]])',
        status: 'implemented'
    },
    'LEFTOFLAST': {
        params: ['ReturnLeftOf', 'SearchInString'],
        description: 'Returns text left of LAST occurrence.',
        example: '=LEFTOFLAST(/; [[FilePath]])',
        status: 'implemented'
    },
    'LENGTH': {
        params: ['CharacterString'],
        description: 'Returns character count in string.',
        example: '=LENGTH([[Description]])',
        status: 'implemented'
    },
    'LINESPLIT': {
        params: ['IndexOfSplitListToReturn', 'TextToSplit'],
        description: 'Splits multiline text into list. Index 0 returns all.',
        example: '=LINESPLIT(1; [[Address]])',
        status: 'implemented'
    },
    'LISTASLINES': {
        params: ['SemicolonSeparatedList'],
        description: 'Converts list to text with each entry on separate line.',
        example: '=LISTASLINES([[Items]])',
        status: 'implemented'
    },
    'LISTCOUNT': {
        params: ['Item1', 'Item2', '...'],
        description: 'Returns total items in list.',
        example: '=LISTCOUNT([[Tags]])',
        status: 'implemented'
    },
    'LISTDIFF': {
        params: ['SemicolonSeparatedList1', 'SemicolonSeparatedList2'],
        description: 'Returns first list minus second list entries.',
        example: '=LISTDIFF([[AllItems]]; [[CompletedItems]])',
        status: 'implemented'
    },
    'LISTINDEX': {
        params: ['ReturnIndex', 'SemicolonSeparatedTextList'],
        description: 'Returns entry at specified index.',
        example: '=LISTINDEX(2; [[Options]])',
        status: 'implemented'
    },
    'LISTINTERSECT': {
        params: ['SemicolonSeparatedList1', 'SemicolonSeparatedList2'],
        description: 'Returns entries appearing in both lists.',
        example: '=LISTINTERSECT([[Skills]]; [[Required]])',
        status: 'implemented'
    },
    'LISTITEMAPPEND': {
        params: ['AppendText', 'SemicolonSeparatedList'],
        description: 'Appends text to each list entry.',
        example: '=LISTITEMAPPEND(.pdf; [[Filenames]])',
        status: 'partial'
    },
    'LISTITEMCONTAINS': {
        params: ['SearchForText', 'SemicolonSeparatedList'],
        description: 'Returns entries containing search text.',
        example: '=LISTITEMCONTAINS(error; [[LogEntries]])',
        status: 'partial'
    },
    'LISTITEMENDSWITH': {
        params: ['SearchForText', 'SemicolonSeparatedList'],
        description: 'Returns entries ending with text.',
        example: '=LISTITEMENDSWITH(.pdf; [[Files]])',
        status: 'partial'
    },
    'LISTITEMLEFT': {
        params: ['NumberOfCharsToReturn', 'SemicolonSeparatedList'],
        description: 'Returns leftmost chars from each entry.',
        example: '=LISTITEMLEFT(4; [[Codes]])',
        status: 'partial'
    },
    'LISTITEMLEFTOF': {
        params: ['SearchForText', 'SemicolonSeparatedList'],
        description: 'Returns text left of search text for each entry.',
        example: '=LISTITEMLEFTOF(@; [[Emails]])',
        status: 'partial'
    },
    'LISTITEMPREPEND': {
        params: ['PrependText', 'SemicolonSeparatedList'],
        description: 'Prepends text to each list entry.',
        example: '=LISTITEMPREPEND(ID-; [[Numbers]])',
        status: 'partial'
    },
    'LISTITEMREGEX': {
        params: ['RegEx', 'SemicolonSeparatedList'],
        description: 'Returns entries matching regex.',
        example: '=LISTITEMREGEX(.*Entry\\d; [[Items]])',
        status: 'partial'
    },
    'LISTITEMRIGHT': {
        params: ['NumberOfCharsToReturn', 'SemicolonSeparatedList'],
        description: 'Returns rightmost chars from each entry.',
        example: '=LISTITEMRIGHT(4; [[Files]])',
        status: 'partial'
    },
    'LISTITEMRIGHTOF': {
        params: ['SearchForText', 'SemicolonSeparatedList'],
        description: 'Returns text right of search text for each entry.',
        example: '=LISTITEMRIGHTOF(@; [[Emails]])',
        status: 'partial'
    },
    'LISTITEMSTARTSWITH': {
        params: ['SearchForText', 'SemicolonSeparatedList'],
        description: 'Returns entries starting with text.',
        example: '=LISTITEMSTARTSWITH(A; [[Codes]])',
        status: 'partial'
    },
    'LISTJOIN': {
        params: ['NewListItemSeparator', 'SemicolonSeparatedList'],
        description: 'Joins entries with separator. Keywords: ppnewline, pptab, ppcrlf, ppsp.',
        example: '=LISTJOIN(ppnewline; [[Items]])',
        status: 'implemented'
    },
    'LISTMERGE': {
        params: ['SemicolonSeparatedList1', 'SemicolonSeparatedList2'],
        description: 'Returns all unique entries from both lists.',
        example: '=LISTMERGE([[List1]]; [[List2]])',
        status: 'implemented'
    },
    'LISTUNIQUE': {
        params: ['SemicolonSeparatedList'],
        description: 'Returns unique entries only (removes duplicates).',
        example: '=LISTUNIQUE([[AllTags]])',
        status: 'implemented'
    },
    'LOWERCASE': {
        params: ['String'],
        description: 'Converts string to lowercase.',
        example: '=LOWERCASE([[Name]])',
        status: 'implemented'
    },
    'LTDATE': {
        params: ['IsThisDate', 'LessThanThisDate'],
        description: 'Returns 1 if first date < second date, 0 if false.',
        example: '=LTDATE([[Created]]; [[Deadline]])',
        status: 'implemented'
    },
    'LTEDATE': {
        params: ['IsThisDate', 'LessThanOrEqualToThisDate'],
        description: 'Returns 1 if first date <= second date, 0 if false.',
        example: '=LTEDATE([[Start]]; [[End]])',
        status: 'implemented'
    },
    'LTENUM': {
        params: ['Value1', 'Value2'],
        description: 'Returns 1 if first value <= second, 0 if false.',
        example: '=LTENUM([[Count]]; 10)',
        status: 'implemented'
    },
    'LTNUM': {
        params: ['IsThisValue', 'LessThanThisValue'],
        description: 'Returns 1 if first value < second, 0 if false.',
        example: '=LTNUM([[Age]]; 18)',
        status: 'implemented'
    },
    'MAX': {
        params: ['Parameter1', 'Parameter2', '...'],
        description: 'Returns maximum number from list.',
        example: '=MAX([[Score1]]; [[Score2]]; [[Score3]])',
        status: 'implemented'
    },
    'MIN': {
        params: ['Parameter1', 'Parameter2', '...'],
        description: 'Returns minimum number from list.',
        example: '=MIN([[Price1]]; [[Price2]])',
        status: 'implemented'
    },
    'MONTH': {
        params: ['DateValue'],
        description: 'Extracts month (1-12) from date.',
        example: '=MONTH([[CreatedDate]])',
        status: 'implemented'
    },
    'MONTHDAY': {
        params: ['DateValue'],
        description: 'Extracts day of month (1-31) from date.',
        example: '=MONTHDAY([[Birthday]])',
        status: 'implemented'
    },
    'MONTHLASTDAY': {
        params: ['DateValue', 'OptionalAddOrSubtractDay'],
        description: 'Returns last day of month. Optional param adds/subtracts days.',
        example: '=MONTHLASTDAY([[InvoiceDate]]; -1)',
        status: 'implemented'
    },
    'NORMALIZETEXT': {
        params: ['TextValue'],
        description: 'Removes spaces, formatting, HTML, carriage returns, line feeds.',
        example: '=NORMALIZETEXT([[Input]])',
        status: 'partial'
    },
    'NOT': {
        params: ['BooleanParameter'],
        description: 'Returns opposite of Boolean (True->False). Zero is false.',
        example: '=NOT(=ISEMPTY([[Field]]))',
        status: 'implemented'
    },
    'NUM': {
        params: ['Parameter'],
        description: 'Extracts number by stripping non-numeric chars.',
        example: '=NUM([[PriceText]])',
        status: 'implemented'
    },
    'NUMSPLIT': {
        params: ['Parameter'],
        description: 'Extracts all numbers as semicolon list.',
        example: '=NUMSPLIT(123 Sample St, NY 10016)',
        status: 'partial'
    },
    'PARSE': {
        params: ['GetRightOfThisText', 'GetLeftOfThisText', 'SearchWithinThisText'],
        description: 'Returns text between two markers. Special: crlf, tab.',
        example: '=PARSE(Name:; Age:; [[Data]])',
        status: 'implemented'
    },
    'PARTITION': {
        params: ['NumberToBePartitioned', 'Divisor'],
        description: 'Returns list of integers summing to original number.',
        example: '=PARTITION(100; 31)',
        status: 'implemented'
    },
    'RANDOMNUM': {
        params: ['MinimumNumber', 'MaximumNumber'],
        description: 'Returns random number between bounds.',
        example: '=RANDOMNUM(1; 100)',
        status: 'implemented'
    },
    'REGEXFIND': {
        params: ['RegEx', 'StringToSearch'],
        description: 'Returns text matching regex pattern.',
        example: '=REGEXFIND(\\d+; This has number: 263)',
        status: 'implemented'
    },
    'REGEXWORDSONLY': {
        params: ['TextToConvertToRegex'],
        description: 'Converts text to regex matching words only, ignoring punctuation.',
        example: '=REGEXWORDSONLY([[SearchText]])',
        status: 'partial'
    },
    'REMOVECHARS': {
        params: ['Value', 'CharsToRemove'],
        description: 'Removes specified characters from text.',
        example: '=REMOVECHARS([[Phone]]; -() )',
        status: 'implemented'
    },
    'REMOVEDIACRITICS': {
        params: ['Value'],
        description: 'Removes accents, replacing with equivalent chars.',
        example: '=REMOVEDIACRITICS(cafe)',
        status: 'partial'
    },
    'REMOVESPACES': {
        params: ['Value'],
        description: 'Removes all spaces from text.',
        example: '=REMOVESPACES([[Code]])',
        status: 'implemented'
    },
    'REMOVESYMBOLS': {
        params: ['Value'],
        description: 'Removes symbols, keeping alphanumeric and spaces.',
        example: '=REMOVESYMBOLS([[Input]])',
        status: 'partial'
    },
    'REPLACE': {
        params: ['SearchForText', 'NewText', 'SearchWithinText'],
        description: 'Finds and replaces text.',
        example: '=REPLACE(old; new; [[Text]])',
        status: 'implemented'
    },
    'RIGHT': {
        params: ['Count', 'Value'],
        description: 'Returns specified chars from end of string.',
        example: '=RIGHT(4; [[Filename]])',
        status: 'implemented'
    },
    'RIGHTOF': {
        params: ['ReturnRightOf', 'SearchInString'],
        description: 'Returns text right of first occurrence.',
        example: '=RIGHTOF(@; [[Email]])',
        status: 'implemented'
    },
    'RIGHTOFLAST': {
        params: ['ReturnRightOf', 'SearchInString'],
        description: 'Returns text right of LAST occurrence.',
        example: '=RIGHTOFLAST(/; [[FilePath]])',
        status: 'implemented'
    },
    'ROUND': {
        params: ['NumOfDecimals', 'AnyNumber'],
        description: 'Rounds to specified decimal places.',
        example: '=ROUND(2; [[Total]])',
        status: 'implemented'
    },
    'SPLIT': {
        params: ['CharacterToSplitOn', 'IndexOfSplitToReturn', 'TextToSplit'],
        description: 'Splits on character, returns section. Index 0 returns all.',
        example: '=SPLIT(-; 2; [[Code]])',
        status: 'implemented'
    },
    'SUM': {
        params: ['Parameter1', 'Parameter2', '...'],
        description: 'Sums list of numbers.',
        example: '=SUM([[Item1]]; [[Item2]]; [[Item3]])',
        status: 'implemented'
    },
    'TABLEAVG': {
        params: ['FieldID', 'TableID', 'TableQuery'],
        description: 'Returns average of column values in table.',
        example: '=TABLEAVG(FieldID; TableID; Query)',
        status: 'not-implemented'
    },
    'TABLEJSON': {
        params: ['NumberOfColumns', 'ProcessTableID', 'OptionalTableQuery'],
        description: 'Returns table data as JSON array of objects.',
        example: '=TABLEJSON(5; TableID; Query)',
        status: 'not-implemented'
    },
    'TABLELOOKUP': {
        params: ['FieldTokenToRetrieve', 'TableID', 'TableQuery'],
        description: 'Returns value from Process Table matching query.',
        example: '=TABLELOOKUP([[FieldToken]]; TableID; Query)',
        status: 'not-implemented'
    },
    'TABLESUM': {
        params: ['FieldID', 'TableID', 'TableQuery'],
        description: 'Sums column values in table.',
        example: '=TABLESUM(FieldID; TableID; Query)',
        status: 'not-implemented'
    },
    'TASKLOOKUP': {
        params: ['FieldTokenToRetrieve', 'TemplateTaskID', 'TaskQuery'],
        description: 'Queries task and returns requested attribute.',
        example: '=TASKLOOKUP([[AssignedTo]]; TaskID; Query)',
        status: 'not-implemented'
    },
    'TASKREPORT': {
        params: ['TextBlockID', 'ProcessInstanceID', 'IncludeSubprocessTask', 'FilterQuery'],
        description: 'Produces task report using Text Block format.',
        example: '=TASKREPORT([[TextBlockID]]; [[ProcessInstanceID]]; true; it_name[ct]task)',
        status: 'not-implemented'
    },
    'TITLECASE': {
        params: ['TextParameter'],
        description: 'Capitalizes first letter of each word.',
        example: '=TITLECASE([[name]])',
        status: 'implemented'
    },
    'TRIM': {
        params: ['TextToTrim'],
        description: 'Removes leading/trailing spaces and double spaces.',
        example: '=TRIM([[Input]])',
        status: 'implemented'
    },
    'UPPERCASE': {
        params: ['String'],
        description: 'Capitalizes each letter.',
        example: '=UPPERCASE([[Code]])',
        status: 'implemented'
    },
    'URLENCODE': {
        params: ['CharacterToEncode'],
        description: 'Encodes characters for URL use.',
        example: '=URLENCODE([[SearchTerm]])',
        status: 'partial'
    },
    'WORDSPLIT': {
        params: ['ReturnWordIndex', 'PlainText'],
        description: 'Splits text into word list. Index 0 returns all.',
        example: '=WORDSPLIT(1; [[FullName]])',
        status: 'partial'
    },
    'WORKDAY': {
        params: ['WorkScheduleID', 'WorkdaysToSkip', 'DateToStartEvaluatingFrom'],
        description: 'Advances date to next working day based on work schedule.',
        example: '=WORKDAY([[WorkScheduleID]]; 5; [[StartDate]])',
        status: 'not-implemented'
    },
    'YEAR': {
        params: ['DateValue'],
        description: 'Extracts year from date.',
        example: '=YEAR([[CreatedDate]])',
        status: 'implemented'
    }
};

// Derived data for quick access
const FUNCTIONS = new Set(Object.keys(FUNCTION_DATA));
const FUNCTION_LIST = Object.keys(FUNCTION_DATA).sort();

// Helper functions
function getFunctionParams(name) {
    return FUNCTION_DATA[name]?.params || [];
}

function getFunctionStatus(name) {
    return FUNCTION_DATA[name]?.status || 'not-implemented';
}

function getFunctionSyntax(name) {
    const params = getFunctionParams(name);
    return `=${name}(${params.join('; ')})`;
}

function getFunctionDescription(name) {
    return FUNCTION_DATA[name]?.description || '';
}

function getFunctionExample(name) {
    return FUNCTION_DATA[name]?.example || '';
}
