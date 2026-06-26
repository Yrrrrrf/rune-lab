// @ts-ignore: paraglide-js generated files are hidden by .gitignore and missing declarations during type-check
import * as m from "./paraglide/messages.js";

// re-export all the messages as m
export { m };

// * Note: This is a re-export of the messages from the paraglide-js package.
// * This is to reduce the `Could not find a declaration file for module` error.
// This error always happens because the generated `paraglide` directory contains it's own `.gitignore` file, so, the typecheck doesn't see the generated files and throws an error, but the build still works. :)
