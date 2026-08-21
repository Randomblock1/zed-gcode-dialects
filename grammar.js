/*
 * An independently authored, deliberately tolerant grammar for the G-code
 * people edit in practice. Firmware validates commands and parameter types;
 * this grammar preserves useful structure even for unknown vendor commands.
 */

const PREC = {
  CONDITIONAL: 1,
  OR: 2,
  AND: 3,
  COMPARE: 4,
  CONCAT: 5,
  ADD: 6,
  MULTIPLY: 7,
  POWER: 8,
  UNARY: 9,
  POSTFIX: 10,
};

module.exports = grammar({
  name: "practical_gcode",

  extras: ($) => [/[ \t\f]/],

  word: ($) => $.identifier,

  supertypes: ($) => [$._expression, $._program_item],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $._newline,
          $.semicolon_comment,
          $.hash_comment,
          $.percent_line,
          $.klipper_section,
          $.klipper_option,
          $.rrf_declaration,
          $.rrf_assignment,
          $.rrf_control,
          $.rrf_else,
          $.rrf_output,
          $.o_statement,
          $.program_line,
        ),
      ),

    _newline: (_) => /\r?\n/,

    semicolon_comment: (_) => token(/;[^\r\n]*/),
    hash_comment: (_) => token(/#(?:[ \t]|[A-Za-z])[^\r\n]*/),
    parenthesized_comment: (_) => token(prec(-1, /\([^()\r\n]*\)/)),
    comment_text: (_) => token(prec(-1, /[^#\r\n](?:[^\r\n]*[^#\r\n])?/)),

    percent_line: ($) =>
      prec.right(seq("%", optional($.semicolon_comment), $._newline)),

    klipper_section: ($) =>
      prec(
        5,
        prec.right(
          seq(
            field("kind", $.section_start),
            optional(field("name", $.section_name)),
            "]",
            optional($.hash_comment),
            $._newline,
          ),
        ),
      ),
    section_start: (_) => token(/\[[A-Za-z_][A-Za-z0-9_-]*/),
    section_name: (_) => token(/[A-Za-z0-9_.-]+(?:[ \t]+[A-Za-z0-9_.-]+)*/),

    klipper_option: ($) =>
      prec(
        3,
        prec.right(
          seq(
            field("name", $.option_name),
            repeat(
              choice(
                $._template_item,
                $.bare_argument,
                $.string,
                $.number,
                $.comma,
                $.colon,
              ),
            ),
            optional($.hash_comment),
            $._newline,
          ),
        ),
      ),
    option_name: (_) => token(/[A-Za-z_][A-Za-z0-9_]*(?::|[ \t]*=)/),

    rrf_declaration: ($) =>
      prec(
        10,
        prec.right(
          seq(
            field("keyword", $.rrf_declaration_keyword),
            field("name", $.identifier),
            "=",
            field("value", $._expression),
            optional($.semicolon_comment),
            $._newline,
          ),
        ),
      ),

    rrf_assignment: ($) =>
      prec(
        10,
        prec.right(
          seq(
            field("keyword", $.rrf_set_keyword),
            field("target", $._assignable),
            "=",
            field("value", $._expression),
            optional($.semicolon_comment),
            $._newline,
          ),
        ),
      ),

    rrf_control: ($) =>
      prec(
        10,
        prec.right(
          seq(
            field("keyword", $.rrf_control_keyword),
            field("condition", $._expression),
            optional($.semicolon_comment),
            $._newline,
          ),
        ),
      ),

    rrf_else: ($) =>
      prec(
        10,
        prec.right(
          seq(
            field("keyword", $.rrf_else_keyword),
            optional($.semicolon_comment),
            $._newline,
          ),
        ),
      ),

    rrf_output: ($) =>
      prec(
        10,
        prec.right(
          seq(
            field("keyword", $.rrf_output_keyword),
            repeat1(choice($._expression, $.bare_argument, $.comma)),
            optional($.semicolon_comment),
            $._newline,
          ),
        ),
      ),

    rrf_declaration_keyword: (_) => choice("var", "global"),
    rrf_set_keyword: (_) => "set",
    rrf_control_keyword: (_) => choice("if", "elif", "while"),
    rrf_else_keyword: (_) => "else",
    rrf_output_keyword: (_) => choice("echo", "abort"),

    o_statement: ($) =>
      prec.right(
        seq(
          field("label", $.o_label),
          field(
            "keyword",
            choice(
              "sub",
              "endsub",
              "call",
              "return",
              "if",
              "elseif",
              "else",
              "endif",
              "while",
              "endwhile",
              "do",
              "repeat",
              "endrepeat",
              "break",
              "continue",
            ),
          ),
          repeat(
            choice(
              $.bracket_expression,
              $.parameter_reference,
              $.number,
              $.bare_argument,
            ),
          ),
          optional($.semicolon_comment),
          $._newline,
        ),
      ),
    o_label: (_) => token(/[oO](?:\d+(?:\.\d+)?|<[^>\r\n]+>)/),

    program_line: ($) =>
      prec.right(
        seq(
          optional($.block_delete),
          optional($.line_number),
          choice(
            seq(field("command", $._command), repeat($._program_item)),
            repeat1($._program_item),
          ),
          optional($.checksum),
          optional($.semicolon_comment),
          $._newline,
        ),
      ),

    block_delete: (_) => "/",
    line_number: (_) => token(prec(8, /[Nn]\d+(?:\.\d+)?/)),
    checksum: (_) => token(/\*\d+/),

    _command: ($) =>
      choice($.g_code, $.m_code, $.tool_code, $.extended_command),
    g_code: (_) => token(prec(8, /[Gg][-+]?\d+(?:\.\d+)?/)),
    m_code: (_) => token(prec(8, /[Mm][-+]?\d+(?:\.\d+)?/)),
    tool_code: (_) => token(prec(8, /[Tt][-+]?\d+(?:\.\d+)?/)),
    extended_command: (_) => token(prec(-1, /[A-Za-z_][A-Za-z0-9_]+/)),

    _program_item: ($) =>
      choice(
        $.axis_word,
        $.feed_word,
        $.spindle_word,
        $.parameter_word,
        $.expression_word,
        $.named_argument,
        $.parameter_assignment,
        $.parameter_reference,
        $.brace_expression,
        $.bracket_expression,
        $.jinja_statement_inline,
        $.jinja_comment_inline,
        $.parenthesized_comment,
        $.string,
        $.number,
        $.colon,
        $.comma,
        $.bare_argument,
      ),

    axis_word: (_) =>
      token(
        prec(
          7,
          /[XYZABCUVWExyzabcuvwe][-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/,
        ),
      ),
    feed_word: (_) =>
      token(prec(7, /[Ff][-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/)),
    spindle_word: (_) =>
      token(prec(7, /[Ss][-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/)),
    parameter_word: (_) =>
      token(prec(6, /[A-Za-z][-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/)),
    expression_word: ($) =>
      choice(
        seq(
          field("prefix", $.brace_word_start),
          optional(commaSep1($._expression)),
          "}",
        ),
        seq(
          field("prefix", $.bracket_word_start),
          optional(commaSep1($._expression)),
          "]",
        ),
        $.parameter_reference_word,
      ),
    brace_word_start: (_) => token(/[A-Za-z]\{/),
    bracket_word_start: (_) => token(/[A-Za-z]\[/),
    parameter_reference_word: (_) => token(/[A-Za-z]#+(?:\d+|<[^>\r\n]+>)/),

    named_argument: ($) =>
      seq(
        field("name", $.argument_name),
        field("value", choice($._expression, $.bare_argument)),
      ),
    argument_name: (_) => token(/[A-Za-z_][A-Za-z0-9_]*=/),
    parameter_assignment: ($) =>
      seq(
        field("target", $.parameter_reference),
        "=",
        field("value", $._expression),
      ),

    jinja_statement_inline: ($) =>
      seq("{%", field("directive", $.jinja_directive), "%}"),
    jinja_directive: ($) =>
      choice(
        seq("set", $._assignable, "=", $._expression),
        seq(choice("if", "elif"), $._expression),
        "else",
        "endif",
        seq("for", commaSep1($.identifier), "in", $._expression),
        "endfor",
        seq("macro", $.identifier, optional($.argument_list)),
        "endmacro",
        seq(
          choice(
            "filter",
            "with",
            "block",
            "extends",
            "include",
            "import",
            "from",
            "do",
          ),
          repeat($._template_item),
        ),
        choice(
          "endfilter",
          "endwith",
          "endblock",
          "raw",
          "endraw",
          "break",
          "continue",
        ),
      ),
    jinja_comment_inline: ($) => seq("{#", optional($.comment_text), "#}"),
    _template_item: ($) =>
      choice(
        $.brace_expression,
        $.jinja_statement_inline,
        $.jinja_comment_inline,
      ),

    _assignable: ($) =>
      choice($.identifier, $.parameter_reference, $.reference_expression),

    _expression: ($) =>
      choice(
        $.number,
        $.string,
        $.boolean,
        $.null,
        $.parameter_reference,
        $.identifier,
        $.reference_expression,
        $.call_expression,
        $.brace_expression,
        $.bracket_expression,
        $.parenthesized_expression,
        $.tuple_expression,
        $.unary_expression,
        $.binary_expression,
        $.conditional_expression,
        $.filter_expression,
      ),

    brace_expression: ($) =>
      seq("{", optional(commaSep1(choice($._expression, $.dict_entry))), "}"),
    bracket_expression: ($) =>
      seq("[", optional(commaSep1($._expression)), "]"),
    dict_entry: ($) =>
      seq(field("key", $._expression), ":", field("value", $._expression)),
    parenthesized_expression: ($) => seq("(", $._expression, ")"),
    tuple_expression: ($) =>
      seq("(", $._expression, ",", optional(commaSep1($._expression)), ")"),

    reference_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("object", $.identifier),
          repeat1(choice($.member_access, $.subscript_access)),
        ),
      ),
    member_access: ($) => seq(".", field("property", $.identifier)),
    subscript_access: ($) =>
      seq(
        "[",
        optional(field("index", choice($._expression, $.slice_expression))),
        "]",
      ),
    slice_expression: ($) =>
      seq(
        optional($._expression),
        ":",
        optional($._expression),
        optional(seq(":", optional($._expression))),
      ),
    call_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("function", choice($.identifier, $.reference_expression)),
          field("arguments", $.argument_list),
          repeat(choice($.member_access, $.subscript_access)),
        ),
      ),
    argument_list: ($) =>
      seq(
        "(",
        optional(commaSep1(choice($._expression, $.keyword_argument))),
        optional(","),
        ")",
      ),
    keyword_argument: ($) => seq($.identifier, "=", $._expression),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field("operator", choice("!", "-", "+", "not", "NOT", "#")),
          field("operand", $._expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...binaryLeft(PREC.OR, ["or", "OR", "||"], $),
        ...binaryLeft(PREC.AND, ["and", "AND", "xor", "XOR", "&&"], $),
        ...binaryLeft(
          PREC.COMPARE,
          [
            "==",
            "!=",
            "<>",
            "<=",
            ">=",
            "<",
            ">",
            "eq",
            "EQ",
            "ne",
            "NE",
            "lt",
            "LT",
            "le",
            "LE",
            "gt",
            "GT",
            "ge",
            "GE",
            "in",
            "IN",
            "is",
            "IS",
          ],
          $,
        ),
        prec.left(
          PREC.COMPARE,
          seq(
            field("left", $._expression),
            field("operator", seq("not", "in")),
            field("right", $._expression),
          ),
        ),
        prec.left(
          PREC.COMPARE,
          seq(
            field("left", $._expression),
            field("operator", seq("is", "not")),
            field("right", $._expression),
          ),
        ),
        ...binaryLeft(PREC.CONCAT, ["^", "~"], $),
        ...binaryLeft(PREC.ADD, ["+", "-"], $),
        ...binaryLeft(PREC.MULTIPLY, ["*", "/", "//", "%", "mod", "MOD"], $),
        prec.right(
          PREC.POWER,
          seq(
            field("left", $._expression),
            field("operator", "**"),
            field("right", $._expression),
          ),
        ),
      ),

    conditional_expression: ($) =>
      choice(
        prec.right(
          PREC.CONDITIONAL,
          seq($._expression, "?", $._expression, ":", $._expression),
        ),
        prec.right(
          PREC.CONDITIONAL,
          seq($._expression, "if", $._expression, "else", $._expression),
        ),
      ),

    filter_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("value", $._expression),
          "|",
          field("filter", $.identifier),
          optional($.argument_list),
        ),
      ),

    parameter_reference: (_) => token(prec(8, /#+(?:\d+|<[^>\r\n]+>)/)),
    identifier: (_) => token(prec(1, /[A-Za-z_][A-Za-z0-9_]*/)),
    number: (_) =>
      token(
        /[-+]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|0[xX][0-9A-Fa-f]+)/,
      ),
    string: ($) => choice($.double_quoted_string, $.single_quoted_string),
    double_quoted_string: (_) =>
      token(seq('"', repeat(choice(/[^"\\\r\n]/, /\\./)), '"')),
    single_quoted_string: (_) =>
      token(seq("'", repeat(choice(/[^'\\\r\n]/, /\\./)), "'")),
    boolean: (_) => choice("true", "false", "True", "False", "TRUE", "FALSE"),
    null: (_) => choice("null", "none", "None", "NULL"),
    colon: (_) => ":",
    comma: (_) => ",",
    bare_argument: (_) => token(prec(-2, /[^\s;(){}\[\],:=*]+/)),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function binaryLeft(precedence, operators, $) {
  return operators.map((operator) =>
    prec.left(
      precedence,
      seq(
        field("left", $._expression),
        field("operator", operator),
        field("right", $._expression),
      ),
    ),
  );
}
