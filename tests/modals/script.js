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
                target.dispatchEvent(
                    new CustomEvent("ui:modal-close", { bubbles: true })
                );
            }
        },
    });

    Alpine.store("ui", {
        /** @param {Event & {currentTarget: EventTarget & HTMLElement}} e */
        remove(e) {
            const target = e.currentTarget;

            if (target.getAttribute("x-transition:leave")) {
                const style = getComputedStyle(document.documentElement);
                const transitionDurationOut = Number(
                    style
                        .getPropertyValue("--transition-duration-out")
                        .replace(/[a-z]+/, "")
                );

                console.debug(target);

                setTimeout(() => {
                    console.debug(target);

                    target.remove();
                }, transitionDurationOut);
            } else {
                target.remove();
            }
        },
    });

    Alpine.data("modal", () => ({
        init() {
            this.$el.addEventListener("ui:modal-open", () => {
                this.open = true;
            });
        },
        open: false,
        trigger: {
            "@click"() {
                this.$dispatch("ui:modal-open");
            },
        },
        panel: {
            ":aria-modal"() {
                return this.open;
            },
            "@click.outside"() {
                this.$dispatch("ui:modal-close");
            },
            "@keydown.escape"() {
                this.$dispatch("ui:modal-close");
            },
            "@keydown.escape.outside"() {
                this.$dispatch("ui:modal-close");
            },
            "@ui:modal-close"() {
                this.open = false;
            },
            "x-show"() {
                return this.open;
            },
            "x-trap.inert"() {
                return this.open;
            },
        },
        "modal-open"() {
            this.$dispatch("ui:modal-open");
        },
        "modal-close"() {
            this.$dispatch("ui:modal-close");
        },
    }));
});
