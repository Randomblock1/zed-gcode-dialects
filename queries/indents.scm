((rrf_control
  keyword: (rrf_control_keyword) @_keyword) @indent
  (#match? @_keyword "^(if|elif|while)$"))

((jinja_statement_inline
  directive: (jinja_directive) @_directive) @indent
  (#match? @_directive "^(if|elif|else|for|macro|filter|with|block)\\b"))

((jinja_statement_inline
  directive: (jinja_directive) @_directive) @outdent
  (#match? @_directive "^(elif|else|endif|endfor|endmacro|endfilter|endwith|endblock)\\b"))

