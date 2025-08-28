import { computePosition, flip, shift } from "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.2/+esm";

function id(el) {
    if (!el.id) {
        el.id = "i" + Math.random().toString(36).slice(2);
    }
}

const baseURL = "/svg";
const icons = {};
const debounceDurationIn = 250;
const debounceDurationOut = 100;
let debounceTimer = null;

class Popover extends HTMLElement {
    static get observedAttributes() {
        return ["visible", "anchor", "placement"];
    }

    connectedCallback() {
        this.invariant();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.invariant();
    }

    invariant() {
        const anchorId = this.getAttribute("anchor");
        const popoverEl = this;
        const anchorEl = anchorId ? document.getElementById(anchorId) : this.previousElementSibling;
        const isVisible = this.getAttribute("visible") === "";
        const preferredPlacement = this.getAttribute("placement");

        anchorEl.setAttribute("aria-haspopover", "true");
        anchorEl.setAttribute("aria-expanded", isVisible);
        anchorEl.id && popoverEl.setAttribute("aria-labelledby", anchorEl.id);

        if (isVisible) {
            computePosition(anchorEl, popoverEl, {
                placement: preferredPlacement ?? "bottom",
                middleware: [flip(), shift({ padding: 12 })],
            }).then(({ x, y }) => {
                Object.assign(popoverEl.style, {
                    top: `${y}px`,
                    left: `${x}px`,
                });
            });
        }
    }
}

customElements.define("ui-popover", Popover);

class Icon extends HTMLElement {
    static get observedAttributes() {
        return ["icon"];
    }

    connectedCallback() {
        this.setAttribute("aria-hidden", "true");
        this.invariant();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.invariant();
    }

    async invariant() {
        const name = this.getAttribute("icon");

        if (!icons[name]) {
            icons[name] = fetch(`${baseURL}/${name}.svg`)
                .then((res) => res.text())
                .then((text) => {
                    const svg = new DOMParser().parseFromString(text, "image/svg+xml");

                    svg.querySelector("script")?.remove();

                    const g = svg.querySelector("g");

                    g.removeAttribute("stroke");
                    g.removeAttribute("stroke-width");

                    return svg.firstElementChild;
                });
        }

        const svg = (await icons[name]).cloneNode(true);

        this.replaceChildren(svg);
    }
}

customElements.define("ui-icon", Icon);

class Menu extends HTMLElement {
    static get observedAttributes() {
        return ["aria-activedescendant"];
    }

    connectedCallback() {
        this.setAttribute("aria-activedescendant", "");

        const trigger = this.querySelector("[data-ui='menu.trigger'");

        id(trigger);

        const popovers = this.querySelectorAll("[data-ui='menu.popover']");
        const items = this.querySelectorAll("[data-ui='menu.item']");

        for (const item of items) {
            item.tabIndex = -1;
            id(item);
        }

        const submenus = this.querySelectorAll("[data-ui='menu.submenu']");

        for (const submenu of submenus) {
            submenu.tabIndex = -1;
            id(submenu);
        }

        for (let i = 0; i < popovers.length; ++i) {
            const popover = popovers[i];
            popover.setAttribute("anchor", popover.previousElementSibling.id);

            if (i === 0) {
                popover.setAttribute("placement", "bottom-start");
            } else {
                popover.setAttribute("placement", "right-start");
            }
        }

        this.invariant();
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.addEventListener("focusin", this.handleFocusIn.bind(this));
        this.addEventListener("focusout", this.handleFocusOut.bind(this));
        this.addEventListener("mouseover", this.handleMouseOver.bind(this));
        this.addEventListener("touchstart", this.handleMouseOver.bind(this));
        this.addEventListener("click", this.handleClick.bind(this));
        this.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.invariant();
    }

    invariant() {
        const activeItemId = this.getAttribute("aria-activedescendant");

        if (activeItemId) {
            const activeItem = document.getElementById(activeItemId);
            const visited = [];

            for (
                let popover = activeItem.closest("[data-ui='menu.popover']");
                popover;
                popover = popover.parentElement.closest("[data-ui='menu.popover']")
            ) {
                popover.setAttribute("visible", "");
                visited.push(popover);
            }

            for (const popover of this.querySelectorAll("[data-ui='menu.popover']")) {
                if (visited.indexOf(popover) === -1 && activeItem.nextElementSibling !== popover) {
                    popover.removeAttribute("visible");
                }
            }

            activeItem.focus();
        } else {
            for (const popover of this.querySelectorAll("[data-ui='menu.popover']")) {
                popover.removeAttribute("visible");
            }
        }

        if (activeItemId === "") {
            this.querySelector("[data-ui='menu.trigger']").tabIndex = null;
            window.removeEventListener("click", this.handleOutsideClick, { capture: true });
        } else {
            this.querySelector("[data-ui='menu.trigger']").tabIndex = -1;
            window.addEventListener("click", this.handleOutsideClick, { capture: true });
        }
    }

    handleFocusIn(e) {
        const actionable = e.target.closest(":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)");

        if (!actionable) return;

        this.setAttribute("aria-activedescendant", e.target.id);
    }

    handleFocusOut(e) {
        if (this.contains(e.target) && !this.contains(e.relatedTarget)) {
            this.setAttribute("aria-activedescendant", "");
        }
    }

    handleMouseOver(e) {
        const actionable = e.target.closest(":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)");

        if (!actionable) return;

        clearTimeout(debounceTimer);

        this.setAttribute("aria-activedescendant", actionable.id);

        if (actionable.dataset.ui === "menu.submenu") {
            debounceTimer = setTimeout(() => {
                const firstItem = actionable.nextElementSibling.querySelector(
                    ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                );
                this.setAttribute("aria-activedescendant", firstItem.id);
                actionable.focus();
            }, debounceDurationIn);
        }
    }

    handleClick(e) {
        const el = e.target.closest(":is([data-ui])");

        switch (el.dataset.ui) {
            case "menu.trigger": {
                const popover = el.nextElementSibling;

                if (popover.getAttribute("visible") === "") {
                    this.setAttribute("aria-activedescendant", "");
                } else {
                    const firstItem = popover.querySelector(
                        ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                    );
                    this.setAttribute("aria-activedescendant", firstItem.id);
                }

                break;
            }

            case "menu.item": {
                if (this.getAttribute("persistent") !== "" && !e.shiftKey) {
                    this.setAttribute("aria-activedescendant", "");
                    this.querySelector("[data-ui='menu.trigger']").focus();
                }

                el.dispatchEvent(new CustomEvent("ui:itemselect", { bubbles: true, cancelable: true }));

                break;
            }

            default:
                break;
        }
    }

    handleKeyDown(e) {
        switch (e.key) {
            case "Escape": {
                this.setAttribute("aria-activedescendant", "");
                this.querySelector("[data-ui='menu.trigger']").focus();

                break;
            }

            case "ArrowUp": {
                switch (e.target.dataset.ui) {
                    case "menu.item":
                    case "menu.submenu": {
                        e.preventDefault();

                        const actionables = this.querySelectorAll(
                            ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                        );
                        const index = Array.prototype.indexOf.call(actionables, e.target);
                        const nextActionable = actionables[index - 1];

                        if (
                            nextActionable &&
                            nextActionable.closest("[data-ui='menu.popover']") ===
                                e.target.closest("[data-ui='menu.popover']")
                        ) {
                            this.setAttribute("aria-activedescendant", nextActionable.id);
                        }

                        break;
                    }

                    case "menu.trigger":
                        e.preventDefault();

                        const firstItem = this.querySelector(
                            ":is([data-ui='menu.item']:last-of-kind, [data-ui='menu.submenu']):not(:disabled)"
                        );
                        this.setAttribute("aria-activedescendant", firstItem.id);

                        break;

                    default:
                        break;
                }

                break;
            }

            case "ArrowDown": {
                switch (e.target.dataset.ui) {
                    case "menu.trigger":
                        e.preventDefault();

                        const firstItem = this.querySelector(
                            ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                        );
                        this.setAttribute("aria-activedescendant", firstItem.id);

                        break;

                    case "menu.item":
                    case "menu.submenu": {
                        e.preventDefault();

                        const actionables = this.querySelectorAll(
                            ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                        );
                        const index = Array.prototype.indexOf.call(actionables, e.target);
                        const nextActionable = actionables[index + 1];

                        if (
                            nextActionable &&
                            nextActionable.closest("[data-ui='menu.popover']") ===
                                e.target.closest("[data-ui='menu.popover']")
                        ) {
                            this.setAttribute("aria-activedescendant", nextActionable.id);
                        }

                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            case "ArrowLeft": {
                const popover = e.target.closest("[data-ui='menu.submenu'] + [data-ui='menu.popover']");

                if (popover) {
                    this.setAttribute("aria-activedescendant", popover.previousElementSibling.id);
                    popover.removeAttribute("visible");
                }

                break;
            }

            case "ArrowRight": {
                if (e.target.dataset.ui === "menu.submenu") {
                    const firstItem = e.target.nextElementSibling.querySelector(
                        ":is([data-ui='menu.item'], [data-ui='menu.submenu']):not(:disabled)"
                    );
                    this.setAttribute("aria-activedescendant", firstItem.id);
                }
            }

            default:
                break;
        }
    }

    handleOutsideClick(e) {
        if (!this.contains(e.target)) {
            this.setAttribute("aria-activedescendant", "");
        }
    }
}

customElements.define("ui-menu", Menu);
