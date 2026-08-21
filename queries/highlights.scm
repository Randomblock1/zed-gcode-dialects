; Comments
[
  (semicolon_comment)
  (hash_comment)
  (parenthesized_comment)
  (jinja_comment_inline)
] @comment

; Commands and control words
(g_code) @function.builtin
(m_code) @function.builtin
(tool_code) @type.builtin
(extended_command) @function
(o_label) @label

[
  (rrf_declaration_keyword)
  (rrf_set_keyword)
  (rrf_control_keyword)
  (rrf_output_keyword)
] @keyword

(jinja_directive) @keyword

; Klipper configuration
(section_start) @tag
(section_name) @type
(option_name) @property

; G-code operands
(line_number) @comment.doc
(checksum) @comment.doc
(axis_word) @variable.special
(feed_word) @number
(spindle_word) @number
(parameter_word) @number
(expression_word) @variable.special
(argument_name) @property
(parameter_reference) @variable.special
(parameter_reference_word) @variable.special

; Expressions
(number) @number
[
  (double_quoted_string)
  (single_quoted_string)
] @string
(boolean) @boolean
(null) @constant.builtin

(rrf_declaration name: (identifier) @variable)
(reference_expression object: (identifier) @variable)
(member_access property: (identifier) @property)
(call_expression function: (identifier) @function)
(call_expression function: (reference_expression) @function)
(filter_expression filter: (identifier) @function)

[
  "="
  "!"
  "-"
  "+"
  "not"
  "NOT"
  "#"
  "or"
  "OR"
  "||"
  "and"
  "AND"
  "xor"
  "XOR"
  "&&"
  "=="
  "!="
  "<>"
  "<="
  ">="
  "<"
  ">"
  "eq"
  "EQ"
  "ne"
  "NE"
  "lt"
  "LT"
  "le"
  "LE"
  "gt"
  "GT"
  "ge"
  "GE"
  "in"
  "IN"
  "is"
  "IS"
  "^"
  "~"
  "*"
  "/"
  "%"
  "mod"
  "MOD"
  "**"
  "?"
  "|"
] @operator

[
  ","
  (comma)
  ":"
  (colon)
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "{%"
  "%}"
  "{#"
  "#}"
] @punctuation.bracket

