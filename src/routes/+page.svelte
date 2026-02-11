<script>
    import {
        CurrencySelector,
        LanguageSelector,
        ThemeSelector,
    } from "./src/lib/features/mod.ts";

    import * as m from "$lib/paraglide/messages.js";
</script>

<ThemeSelector />
<CurrencySelector />
<LanguageSelector />

{m.hello_world({ name: "Yusepe" })}
