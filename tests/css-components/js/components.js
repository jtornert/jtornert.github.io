/** @type {import("alpinejs").Alpine} */
var Alpine;

function init() {
    Alpine.data("ui:trigger", () => ({
        init() {
            const panel = document.getElementById(
                this.$el.getAttribute("aria-controls")
            );

            if (!panel) {
                console.warn("ui:trigger panel missing, is the id correct?");
                return;
            }

            this.$el.addEventListener("click", () => {
                panel.dispatchEvent(
                    new CustomEvent("ui:trigger", {
                        detail: {
                            value: this.$el.dataset.triggerValue || "toggle",
                        },
                    })
                );
            });

            // TODO handle removing event listeners on destroy
        },
    }));

    Alpine.data("el:show", () => ({
        init() {
            if (this.$el.getAttribute("aria-hidden") === "false") {
                const controls = document.querySelectorAll(
                    `[aria-controls*=${this.$el.id}]`
                );

                for (const control of controls) {
                    control.setAttribute("aria-expanded", "true");
                }
            }

            this.$el.addEventListener("ui:trigger", (e) => {
                const shouldShow =
                    (e.detail.value === "toggle" &&
                        this.$el.getAttribute("aria-hidden") === "true") ||
                    e.detail.value === "show";

                this.$el.setAttribute(
                    "aria-hidden",
                    shouldShow ? "false" : "true"
                );

                const controls = document.querySelectorAll(
                    `[aria-controls*=${this.$el.id}]`
                );

                for (const control of controls) {
                    control.setAttribute(
                        "aria-expanded",
                        shouldShow ? "true" : "false"
                    );
                }
            });
        },
    }));
}

document.addEventListener("alpine:init", init);
