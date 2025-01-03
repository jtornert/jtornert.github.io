var ui = {
    id() {
        return "i" + Math.random().toString(36).slice(2);
    },
};

class Collapse extends HTMLElement {
    connectedCallback() {
        this.panel = this.querySelector("#" + this.dataset.panel);
        this.cache = this.dataset.cache === "";
        this.controls = this.querySelectorAll(
            `[aria-controls=${this.dataset.panel}]`
        );

        if ((this.cache && this.readCache() === "true") || this.isVisible()) {
            this.show();
        } else {
            this.hide();
        }

        for (const control of this.controls) {
            control.addEventListener("click", this.toggle.bind(this));
        }
    }

    isVisible() {
        return this.panel.ariaHidden === "false";
    }

    show() {
        this.panel.ariaHidden = "false";
        this.panel.inert = null;
        for (const control of this.controls) {
            control.ariaExpanded = "true";
        }
        if (this.cache) {
            this.storeCache(true);
        }
    }

    hide() {
        this.panel.ariaHidden = "true";
        this.panel.inert = "true";
        for (const control of this.controls) {
            control.ariaExpanded = "false";
        }
        if (this.cache) {
            this.storeCache(false);
        }
    }

    readCache() {
        return localStorage.getItem("collapse-" + this.dataset.panel);
    }

    storeCache(value) {
        localStorage.setItem("collapse-" + this.dataset.panel, value);
    }

    toggle() {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }
}

class Accordion extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const panels = Array.from(this.children).filter(
            (e) => e.tagName === "ARTICLE"
        );
        this.openPanel = null;
        this.multiple = this.dataset.multiple !== undefined;
        this.persistent = this.dataset.persistent !== undefined;

        for (const panel of panels) {
            const button = panel.previousElementSibling.firstElementChild;

            panel.id = ui.id();
            button.id = ui.id();
            button.setAttribute("aria-controls", panel.id);
            panel.setAttribute("aria-labelledby", button.id);

            if (button.ariaExpanded === "true") {
                this.openPanel = button;
            }

            button.addEventListener("click", (e) => {
                if (button.ariaExpanded === "true" && !this.persistent) {
                    button.ariaExpanded = "false";
                    this.openPanel = null;
                } else {
                    button.ariaExpanded = "true";
                    if (!this.multiple && this.openPanel !== button) {
                        if (this.openPanel) {
                            this.openPanel.ariaExpanded = "false";
                        }
                        this.openPanel = e.currentTarget;
                    }
                }
            });
        }
    }
}

var topLevelMenu = undefined;

class Menu extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.button = this.querySelector("button");
        this.menu = this.querySelector("menu");
        this.items = Array.from(this.menu.children).map((c) =>
            ["a", "button"].map((tag) => tag.toUpperCase()).includes(c.tagName)
                ? c
                : c.querySelector("button")
        );
        this.wrapping = this.dataset.wrapping !== undefined;
        this.autoExpand = this.dataset.autoExpand !== undefined;

        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleMenuMouseOver = this.handleMenuMouseOver.bind(this);
        this.handleOutsideMouseOver = this.handleOutsideMouseOver.bind(this);

        this.button.id = ui.id();
        this.menu.id = ui.id();
        this.button.setAttribute("aria-controls", this.menu.id);
        this.menu.setAttribute("aria-labelledby", this.button.id);
        for (const item of this.items) {
            item.id = ui.id();
        }

        if (this.autoExpand) {
            this.button.addEventListener(
                "mouseenter",
                this.handleMouseEnter.bind(this)
            );
            this.button.addEventListener(
                "mouseleave",
                this.handleMouseLeave.bind(this)
            );
        }

        this.button.addEventListener("click", this.toggle.bind(this));

        if (this.button.getAttribute("aria-expanded") === "true") {
            this.open();
        }
    }

    computeMenuPosition() {
        const { computePosition, flip } = FloatingUIDOM;
        const isTopLevelMenu = this.parentElement.closest("ui-menu") === null;

        computePosition(this, this.menu, {
            placement: isTopLevelMenu ? "bottom-start" : "right-start",
            middleware: [
                flip({
                    fallbackAxisSideDirection: "end",
                }),
            ],
        }).then(({ x, y }) => {
            Object.assign(this.menu.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
        });
    }

    open() {
        const { autoUpdate } = window.FloatingUIDOM ?? {};

        this.button.setAttribute("aria-expanded", "true");
        this.menu.addEventListener("keydown", this.handleKeyDown);
        this.menu.addEventListener("mouseover", this.handleMenuMouseOver);
        window.addEventListener("click", this.handleOutsideClick, {
            capture: true,
        });
        if (window.FloatingUIDOM) {
            this.cleanup = autoUpdate(
                this.button,
                this.menu,
                this.computeMenuPosition.bind(this)
            );
        }
        if (this.autoExpand) {
            window.addEventListener("mouseover", this.handleOutsideMouseOver);
        }
        this.focusItem(this.items[0]);
    }

    close() {
        this.button.setAttribute("aria-expanded", "false");
        this.menu.removeEventListener("keydown", this.handleKeyDown);
        this.menu.removeEventListener("mouseover", this.handleMenuMouseOver);
        window.removeEventListener("click", this.handleOutsideClick, {
            capture: true,
        });
        if (window.FloatingUIDOM) {
            this.cleanup();
        }
        if (this.autoExpand) {
            window.removeEventListener(
                "mouseover",
                this.handleOutsideMouseOver
            );
        }
        this.menu.removeAttribute("aria-activedescendant");
        const parent = this.parentElement.closest("ui-menu");
        if (parent) {
            parent.focusItem(this.button);
        } else {
            this.button.focus();
        }
    }

    toggle() {
        if (this.button.getAttribute("aria-expanded") === "true") {
            this.close();
        } else {
            this.open();
        }
    }

    focusItem(item) {
        item.focus();
        this.menu.setAttribute("aria-activedescendant", item.id);
    }

    handleOutsideClick(e) {
        if (!this.contains(e.target)) {
            this.close();
        }
    }

    get focusedItem() {
        return this.menu.querySelector(
            "#" + this.menu.getAttribute("aria-activedescendant")
        );
    }

    handleKeyDown(e) {
        if (this.menu !== e.target.closest("menu")) {
            return;
        }

        switch (e.key) {
            case "ArrowLeft":
            case "Escape":
                e.preventDefault();
                this.handleClose(e);
                break;

            case "ArrowDown":
                e.preventDefault();
                this.handleFocusNext(e);
                break;

            case "ArrowUp":
                e.preventDefault();
                this.handleFocusPrevious(e);
                break;

            case "ArrowRight":
                e.preventDefault();
                this.handleOpenSubMenu(e);
                break;

            case "Tab":
                e.preventDefault();
                if (e.shiftKey) {
                    this.handleFocusPrevious(e);
                } else {
                    this.handleFocusNext(e);
                }
                break;

            default:
                break;
        }
    }

    handleClose(e) {
        const menuitem = e.target.closest("li");
        if (Array.from(this.menu.children).find((n) => n === menuitem)) {
            this.close();
        }
    }

    handleFocusPrevious(e) {
        if (this.menu !== e.target.closest("menu")) {
            return;
        }

        const index = Array.from(this.items).indexOf(this.focusedItem);

        if (index > 0) {
            this.focusItem(this.items[index - 1]);
        } else if (this.wrapping) {
            this.focusItem(this.items[this.items.length - 1]);
        }
    }

    handleFocusNext(e) {
        if (this.menu !== e.target.closest("menu")) {
            return;
        }

        const index = this.items.indexOf(this.focusedItem);

        if (index < this.items.length - 1) {
            this.focusItem(this.items[index + 1]);
        } else if (this.wrapping) {
            this.focusItem(this.items[0]);
        }
    }

    handleOpenSubMenu(_) {
        const focused = this.focusedItem;
        if (focused?.parentElement.tagName === "UI-MENU") {
            this.menu.removeAttribute("aria-activedescendant");
            focused.parentElement.open();
        }
    }

    handleMouseEnter(_) {
        if (this.button.getAttribute("aria-expanded") === "true") {
            return;
        }

        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            this.open();
        }, 100);
    }

    handleMouseLeave(_) {
        clearTimeout(this.timeout);
    }

    handleMenuMouseOver(e) {
        for (const item of this.items) {
            if (item.contains(e.target)) {
                this.focusItem(item);
                break;
            }
        }
    }

    handleOutsideMouseOver(e) {
        if (this.contains(e.target)) {
            clearTimeout(this.timeout);
            this.timeout = null;
            return;
        }

        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.close();
            }, 100);
        }
    }
}

class Tabs extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.tablist = this.querySelector("[role=tablist]");
        this.selectOnFocus = this.dataset.selectOnFocus !== undefined;
        this.cache = this.dataset.cache !== undefined;

        this.handleKeyDown = this.handleKeyDown.bind(this);

        const tabs = this.tablist.querySelectorAll("button[role=tab]");
        const tabpanels = this.querySelectorAll("[role=tabpanel]");
        const cache = this.readCache();

        for (let i = 0; i < tabpanels.length; ++i) {
            const tab = tabs[i];
            const tabpanel = tabpanels[i];

            tab.id = ui.id();
            tabpanel.id = ui.id();
            tab.setAttribute("aria-controls", tabpanel.id);
            tabpanel.setAttribute("aria-labelledby", tab.id);

            if (
                (!cache && tabpanel.getAttribute("aria-hidden") === "false") ||
                (cache && i === Number(cache))
            ) {
                tab.setAttribute("aria-selected", "true");
                tab.tabIndex = "0";
                tabpanel.tabIndex = "0";
                tabpanel.setAttribute("aria-hidden", "false");
            } else {
                tab.setAttribute("aria-selected", "false");
                tab.tabIndex = "-1";
                tabpanel.tabIndex = "-1";
                tabpanel.setAttribute("aria-hidden", "true");
            }

            tab.addEventListener("click", this.handleTabClick.bind(this));
            tab.addEventListener("focus", () =>
                tab.addEventListener("keydown", this.handleKeyDown)
            );
            tab.addEventListener("blur", () =>
                tab.removeEventListener("keydown", this.handleKeyDown)
            );
        }
    }

    handleKeyDown(e) {
        switch (e.key) {
            case "ArrowLeft":
            case "ArrowUp":
                e.preventDefault();
                this.handleFocusPrevious(e);
                break;

            case "ArrowDown":
            case "ArrowRight":
                e.preventDefault();
                this.handleFocusNext(e);
                break;

            default:
                break;
        }
    }

    focusTab(tab) {
        tab.focus();

        if (this.selectOnFocus) {
            tab.click();
        }
    }

    handleFocusPrevious(e) {
        const current = e.target.closest("button[role=tab]");
        const index = Array.from(this.tablist.children).indexOf(current);

        if (index === 0) {
            this.focusTab(
                this.tablist.children[this.tablist.children.length - 1]
            );
            return;
        }

        const previous = this.tablist.children[index - 1];

        this.focusTab(previous);
    }

    handleFocusNext(e) {
        const current = e.target.closest("button[role=tab]");
        const index = Array.from(this.tablist.children).indexOf(current);

        if (index === this.tablist.children.length - 1) {
            this.focusTab(this.tablist.children[0]);
            return;
        }

        const next = this.tablist.children[index + 1];

        this.focusTab(next);
    }

    handleTabClick(e) {
        const tab = e.target;

        if (tab.getAttribute("aria-selected") === "true") {
            return;
        }

        const selectedTab = this.tablist.querySelector("[aria-selected=true]");
        if (selectedTab) {
            selectedTab.tabIndex = "-1";
            selectedTab.setAttribute("aria-selected", "false");

            const selectedTabPanel = this.querySelector(
                "#" + selectedTab.getAttribute("aria-controls")
            );
            selectedTabPanel.setAttribute("aria-hidden", "true");
            selectedTabPanel.tabIndex = null;
        }

        tab.tabIndex = "0";
        tab.setAttribute("aria-selected", "true");

        const tabpanel = this.querySelector(
            "#" + tab.getAttribute("aria-controls")
        );
        tabpanel.setAttribute("aria-hidden", "false");
        tabpanel.tabIndex = "0";

        if (this.cache && this.id) {
            const index = Array.from(this.tablist.children).indexOf(tab);
            this.storeCache(index);
        }
    }

    readCache() {
        return localStorage.getItem("tabs-" + this.id);
    }

    storeCache(index) {
        localStorage.setItem("tabs-" + this.id, index);
    }
}

customElements.define("ui-collapse", Collapse);
customElements.define("ui-accordion", Accordion);
customElements.define("ui-menu", Menu);
customElements.define("ui-tabs", Tabs);
