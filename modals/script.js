/** @type {import("alpinejs").Alpine} */
var Alpine;

document.addEventListener("alpine:init", () => {
    Alpine.store("form-actions", {
        /** @param {SubmitEvent} e  */
        "save-form"(e) {
            const target = /** @type {HTMLFormElement} */ (e.target);
            const formData = new FormData(target);
            const woot = formData.get("woot");

            if (woot) {
                const input = target.querySelector("input");
                if (input) input.value = "";

                alert(woot);
            } else {
                e.stopPropagation();
            }
        },
    });

    Alpine.data("modal", () => ({
        open: false,
        trigger: {
            "@click"() {
                this.open = true;
            },
        },
        panel: {
            ":aria-modal"() {
                return this.open;
            },
            "@click.outside"() {
                this.open = false;
            },
            "@keydown.escape"() {
                this.open = false;
            },
            "@keydown.escape.outside"() {
                this.open = false;
            },
            "x-show"() {
                return this.open;
            },
            "x-trap.inert"() {
                return this.open;
            },
        },
        close: {
            "@click"() {
                this.open = false;
            },
        },
        form: {
            "@submit"() {
                this.open = false;
            },
        },
    }));
});
