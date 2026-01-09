import { signal, effect } from "datastar";
import { Effect, Signal } from "@types";
import { idFrom } from "../utils";

import "./style.css";

window.customElements.define(
    "ui-accordion",
    class extends HTMLElement {
        static observedAttributes = ["persistent"];

        current: Signal<number | null>;
        cleanup: Effect;
        persistent: Signal<boolean>;

        constructor() {
            super();
            this.current = signal<number | null>(null);
            const buttons = this.querySelectorAll(":scope > :is(h2,h3,h4,h5,h6) > button");
            const panels = this.querySelectorAll(":scope > div");
            for (let i = 0; i < buttons.length; ++i) {
                const button = buttons[i];
                const panel = panels[i];
                button.id = idFrom(button);
                panel.setAttribute("aria-labelledby", button.id);
            }
            this.persistent = signal(this.getAttribute("persistent") === "");
            this.cleanup = effect(() => {
                const current = this.current();
                const persistent = this.persistent();
                const expandedButtons = this.querySelectorAll(
                    ":scope > :is(h2,h3,h4,h5,h6) > button[aria-expanded=true]"
                );
                if (expandedButtons.length > 1) throw new Error("cannot have several panels open at once");
                const expandedButton = expandedButtons[0];
                expandedButton?.removeAttribute("aria-expanded");
                if (current === null) {
                    if (persistent) {
                        this.querySelector(":scope > :is(h2,h3,h4,h5,h6) > button")?.setAttribute(
                            "aria-expanded",
                            "true"
                        );
                    }
                    return;
                }
                this.querySelector(`:scope > :nth-child(${current + 1}) > button`)?.setAttribute(
                    "aria-expanded",
                    "true"
                );
            });
            this.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                if (target.tagName !== "BUTTON") return;
                const parentElement = target.parentElement;
                const index = Array.prototype.findIndex.call(this.children, (child) => child === parentElement);
                const current = this.current();
                if (!this.persistent() && (index === current || index === -1)) {
                    this.current(null);
                } else {
                    this.current(index);
                }
            });
        }

        disconnectedCallback() {
            this.cleanup();
        }

        attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
            if (name === "persistent") {
                this.persistent(newValue === "");
            }
        }
    }
);
