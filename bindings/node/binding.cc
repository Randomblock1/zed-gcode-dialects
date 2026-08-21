#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage const *tree_sitter_practical_gcode();

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["language"] = Napi::External<TSLanguage>::New(env, const_cast<TSLanguage *>(tree_sitter_practical_gcode()));
  return exports;
}

NODE_API_MODULE(tree_sitter_practical_gcode_binding, Init)

