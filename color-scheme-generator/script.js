"use strict";

/**
 * @typedef {object} ColorThemeBackground
 * @property {number} l
 * @property {number} c
 * @property {number} d
 *
 * @typedef {object} ColorTheme
 * @property {ColorThemeBackground} background
 *
 * @typedef {object} Color
 * @property {number} l
 * @property {number} c
 * @property {number} h
 * @property {string} id
 * @property {ColorTheme} dark
 * @property {ColorTheme} light
 */

/** @type {import("alpinejs").Alpine} */
var Alpine;

/** @type {import("chroma-js").default} */
var chroma;

function generateId() {
    return "i" + Math.random().toString(36).slice(2);
}

function memo(fn, maxEntries = -1) {
    const cache = {};
    return function () {
        const key = Array.prototype.join.call(arguments, ":");
        if (cache[key]) {
            return cache[key];
        }
        const result = fn.apply(undefined, arguments);
        if (
            (maxEntries >= 0 && Object.keys(cache).length < maxEntries) ||
            maxEntries === -1
        ) {
            cache[key] = result;
        }
        return result;
    };
}

/**
 * @callback BinarySearchChromaFn
 * @param {number} l
 * @param {number} h
 * @returns {import("chroma-js").Color}
 * @type {BinarySearchChromaFn}
 */
const table = memo(binarySearchChroma);

function binarySearchChroma(l, h, c = 0.4, min = 0) {
    const color = chroma.oklch(l, c, h);

    if (Math.abs(c - min) < 0.001) {
        return color;
    }

    if (color.clipped()) {
        return binarySearchChroma(l, h, c - (c - min) * 0.5, min);
    } else {
        return binarySearchChroma(l, h, c + (c - min) * 1.5, c);
    }
}

window.addEventListener("alpine:init", () => {
    const id = generateId();
    /** @type {Omit<Color, "id">} */
    const initColor = {
        l: 0.5,
        c: 0.2,
        h: 0,
        dark: {
            background: { l: 0.2, c: 0.2, d: 0.1 },
        },
        light: {
            background: { l: 1, c: 0.2, d: 0.1 },
        },
    };
    const firstColor = { ...initColor, id };

    Alpine.data("app", () => ({
        /** @type {Color[]} */
        colors: [firstColor],
        /** @type {Omit<Color, "id">} */
        inputs: { ...initColor },
        /** @type {{color: Color, element: HTMLElement} | undefined} */
        selected: {
            color: firstColor,
            element: undefined,
        },
        get maxC() {
            return Number(
                table(this.data.l, this.data.h).get("oklch.c").toFixed(2)
            );
        },
        get clippedC() {
            const maxC = this.maxC;

            return this.data.c > maxC ? maxC : this.data.c;
        },
        get themes() {
            return ["light", "dark"];
        },
        get submitText() {
            return this.selected ? "Confirm" : "+ Add";
        },
        get data() {
            return this.selected?.color ?? this.inputs;
        },
        init() {
            this.$watch("data", (data) => {
                this.setAccentColor(data);
            });
            requestAnimationFrame(() => {
                this.selected.element =
                    document.querySelector("[data-color-id]");
            });
        },
        setAccentColor(data) {
            const { l, h } = data;
            document.documentElement.style.accentColor = `oklch(${l} ${this.clippedC} ${h})`;
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
                "--accent": `oklch(${this.data.l} ${this.data.c} ${this.data.h})`,
                "--accent-contrast": table(
                    this.data.l > 0.7 ? 0.3 : 0.95,
                    this.data.h
                ),
                "--surface-dark-1": table(
                    this.data.dark.background.l,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.dark.background.c}`)
                    .css("oklch"),
                "--surface-dark-2": table(
                    this.data.dark.background.l +
                        0.5 * this.data.dark.background.d,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.dark.background.c}`)
                    .css("oklch"),
                "--surface-dark-3": table(
                    this.data.dark.background.l + this.data.dark.background.d,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.dark.background.c}`)
                    .css("oklch"),
                "--surface-light-1": table(
                    this.data.light.background.l,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.dark.background.c}`)
                    .css("oklch"),
                "--surface-light-2": table(
                    this.data.light.background.l -
                        0.5 * this.data.light.background.d,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.light.background.c}`)
                    .css("oklch"),
                "--surface-light-3": table(
                    this.data.light.background.l - this.data.light.background.d,
                    this.data.h
                )
                    .set("oklch.c", `*${this.data.light.background.c}`)
                    .css("oklch"),
            })) {
                element.style.setProperty(key, value);
            }
        },
        handleUpdateLightness(e) {
            this.data.l = Number(e.target.value);
        },
        handleUpdateChroma(e) {
            this.data.c = Number(e.target.value);
        },
        handleUpdateHue(e) {
            this.data.h = Number(e.target.value);
        },
        handleUpdateLightBackgroundLightness(e) {
            this.data.light.background.l = Number(e.target.value);
        },
        handleUpdateLightBackgroundChroma(e) {
            this.data.light.background.c = Number(e.target.value);
        },
        handleUpdateLightBackgroundSpread(e) {
            this.data.light.background.d = Number(e.target.value);
        },
        handleUpdateDarkBackgroundLightness(e) {
            this.data.dark.background.l = Number(e.target.value);
        },
        handleUpdateDarkBackgroundChroma(e) {
            this.data.dark.background.c = Number(e.target.value);
        },
        handleUpdateDarkBackgroundSpread(e) {
            this.data.dark.background.d = Number(e.target.value);
        },
        handleFormSubmit() {
            if (this.selected) {
                this.selected = undefined;
                this.setAccentColor(this.data);
            } else {
                this.colors.push({
                    ...this.inputs,
                    id: generateId(),
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
