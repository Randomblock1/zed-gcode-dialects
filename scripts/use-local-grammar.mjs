import { pathToFileURL } from "node:url";
import { setGrammarSource } from "./grammar-source.mjs";
import { root } from "./paths.mjs";

setGrammarSource(pathToFileURL(root).href);
