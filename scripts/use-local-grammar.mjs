import { pathToFileURL } from "node:url";
import { setGrammarSource } from "./grammar-source.mjs";
import { requireGrammarDir } from "./paths.mjs";

setGrammarSource(pathToFileURL(requireGrammarDir()).href);
