/**
 * @typedef {object} Color
 * @property {number} l
 * @property {number} c
 * @property {number} h
 * @property {string} id
 */

var ui = {
    id() {
        return "i" + Math.random().toString(36).slice(2);
    },
};

window.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
        /** @type {Color[]} */
        colors: [],
        themes: ["light", "dark"],
        inputs: { l: 0.5, c: 0.2, h: 0 },
        /** @type {{color: Color, element: HTMLElement} | undefined} */
        selected: undefined,
        get submitText() {
            return this.selected ? "Confirm" : "+ Add";
        },
        get data() {
            return this.selected?.color ?? this.inputs;
        },
        watch() {
            this.$watch("data", (data) => {
                this.setAccentColor(data);
            });
        },
        setAccentColor(data) {
            const { l, c, h } = data;
            document.documentElement.style.accentColor = `oklch(${l} ${c} ${h})`;
            if (this.selected) {
                for (const theme of this.selected.element.querySelectorAll(
                    "[data-color-scheme]"
                )) {
                    this.colorStyle(theme);
                }
            }
        },
        colorStyle(el) {
            const element = el ?? this.$el;
            for (const [key, value] of Object.entries({
                "--l": this.data.l,
                "--c": this.data.c,
                "--h": this.data.h,
                "--z": this.data.l > 0.7 ? 0.3 : 0.95,
            })) {
                element.style.setProperty(key, value);
            }
        },
        handleUpdateLightness(e) {
            this.data.l = e.target.value;
        },
        handleUpdateChroma(e) {
            this.data.c = e.target.value;
        },
        handleUpdateHue(e) {
            this.data.h = e.target.value;
        },
        handleFormSubmit() {
            if (this.selected) {
                this.selected = undefined;
                this.setAccentColor(this.data);
            } else {
                const id = ui.id();
                this.colors.push({
                    l: this.inputs.l,
                    c: this.inputs.c,
                    h: this.inputs.h,
                    id,
                });
            }
        },
        handleRemoveColor(e) {
            const id = e.target.closest("[data-color-id]").dataset.colorId;
            this.colors = this.colors.filter((c) => c.id !== id);
        },
        handleEditColor(e) {
            const element = e.target.closest("[data-color-id]");
            const id = element.dataset.colorId;
            const color = this.colors.find((c) => c.id === id);
            this.selected = {
                element,
                color,
            };
            this.setAccentColor(this.data);
        },
    }));
});
