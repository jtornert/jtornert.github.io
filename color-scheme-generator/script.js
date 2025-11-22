import {
    action,
    attribute,
    effect,
    getPath,
    mergePatch,
    beginBatch,
    endBatch,
} from "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.6/bundles/datastar.js";
import chroma from "https://unpkg.com/chroma-js@3.1.2/index.js";

const __fetch = window.fetch;
window.fetch = __fetch_with_mocks;
const router = {
    GET: [],
    POST: [],
    PUT: [],
};

function matchRoute(input, init) {
    const url = new URL(input);
    const urlFragments = url.pathname.split("/").filter((str) => str.length);
    for (const route of router[init.method]) {
        if (route.fragments.length !== urlFragments.length) continue;
        const params = {};
        for (let i = 0; i < urlFragments.length; ++i) {
            const match = route.fragments[i].match(/<([\w]+)>/);
            if (match) {
                params[match[1]] = urlFragments[i];
            } else if (route.fragments[i] !== urlFragments[i]) {
                break;
            }
            if (i === urlFragments.length - 1) {
                return { handler: route.handler?.bind(undefined, { params, init, url }) };
            }
        }
    }
}

function __fetch_with_mocks(input, init) {
    const route = matchRoute(input, init);
    if (route) {
        let body = route.handler?.();
        if (!route.handler || !body) {
            return new Promise((res) => res(new Response("")));
        }
        return new Promise((res) => {
            let contentType = "text/html";
            if (typeof body !== "string") {
                contentType = "application/json";
                body = JSON.stringify(body);
            }
            res(new Response(body, { headers: { "content-type": contentType } }));
        });
    }
    return __fetch(input, init);
}

function mock(method, path, handler) {
    router[method].push({
        fragments: path.split("/").filter((str) => str.length),
        handler,
    });
}

/**
 * @param {"datastar-patch-elements" | "datastar-patch-signals"} name
 * @param {object} args
 */
function datastar(name, args) {
    document.dispatchEvent(new CustomEvent("datastar-fetch", { detail: { type: name, argsRaw: args } }));
}

function memo(fn, maxEntries = -1) {
    const cache = {};
    return function () {
        const key = Array.prototype.join.call(arguments, ":");
        if (cache[key]) {
            return cache[key];
        }
        const result = fn.apply(undefined, arguments);
        if ((maxEntries > 0 && Object.keys(cache).length < maxEntries) || maxEntries === -1) {
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

mock("GET", location.pathname, () => {
    requestAnimationFrame(() => {
        effect(() => {
            const [l, c, h] = [getPath("accentL"), getPath("accentC"), getPath("accentH")];
            document.documentElement.style.accentColor = `oklch(${l} ${c} ${h})`;
            const $accents = getPath("accents");
            const $current = getPath("current");
            if ($current) {
                const index = $accents.findIndex((accent) => accent.id === $current.id);
                $accents[index].color = chroma.oklch(l, c, h);
            }
            datastar("datastar-patch-elements", {
                mode: "inner",
                selector: "#colors",
                elements: $accents
                    .map((accent) =>
                        template("color", {
                            id: accent.id,
                            content: template("content"),
                        })
                    )
                    .join(""),
            });
            const colors = document.getElementById("colors").children;
            const $lightBackgroundChromaScale = getPath("lightBackgroundChromaScale");
            const $darkBackgroundChromaScale = getPath("darkBackgroundChromaScale");
            const $lightTextChromaScale = getPath("lightTextChromaScale");
            const $darkTextChromaScale = getPath("darkTextChromaScale");
            const $lightBackgroundLightness = getPath("lightBackgroundLightness");
            const $darkBackgroundLightness = getPath("darkBackgroundLightness");
            const $lightBackgroundSpread = getPath("lightBackgroundSpread");
            const $darkBackgroundSpread = getPath("darkBackgroundSpread");
            const $lightTextStrong = getPath("lightTextStrong");
            const $darkTextStrong = getPath("darkTextStrong");
            for (let i = 0; i < $accents.length; ++i) {
                const accent = $accents[i].color;
                const color = colors[i];
                const accentL = accent.get("oklch.l");
                const accentH = accent.get("oklch.h");
                color.style.setProperty("--accent", accent);
                color.style.setProperty(
                    "--light-surface-1",
                    table($lightBackgroundLightness, accentH).set("oklch.c", `*${$lightBackgroundChromaScale}`)
                );
                color.style.setProperty(
                    "--light-surface-2",
                    table($lightBackgroundLightness - $lightBackgroundSpread * 0.5, accentH).set(
                        "oklch.c",
                        `*${$lightBackgroundChromaScale}`
                    )
                );
                color.style.setProperty(
                    "--light-surface-3",
                    table($lightBackgroundLightness - $lightBackgroundSpread, accentH).set(
                        "oklch.c",
                        `*${$lightBackgroundChromaScale}`
                    )
                );
                color.style.setProperty("--light-accent-contrast", table(accentL >= 0.6 ? 0.2 : 0.95, accentH));
                color.style.setProperty(
                    "--light-accent-hover",
                    accentL >= 0.6 ? accent.mix("black", 0.15, "oklab") : accent.mix("white", 0.1, "oklab")
                );
                color.style.setProperty(
                    "--light-accent-active",
                    accentL >= 0.6 ? accent.mix("black", 0.3, "oklab") : accent.mix("black", 0.1, "oklab")
                );
                color.style.setProperty("--light-accent-outline", accent.mix("black", 0.1, "oklab"));
                color.style.setProperty(
                    "--light-strong-text",
                    table($lightTextStrong, accentH).set("oklch.c", `*${$lightTextChromaScale}`)
                );
                color.style.setProperty(
                    "--light-body-text",
                    table(0.4, accentH).set("oklch.c", `*${$lightTextChromaScale}`)
                );
                color.style.setProperty(
                    "--light-weak-text",
                    table(0.6, accentH).set("oklch.c", `*${$lightTextChromaScale}`)
                );
                color.style.setProperty(
                    "--dark-surface-1",
                    table($darkBackgroundLightness, accentH).set("oklch.c", `*${$darkBackgroundChromaScale}`)
                );
                color.style.setProperty(
                    "--dark-surface-2",
                    table($darkBackgroundLightness + $darkBackgroundSpread * 0.5, accentH).set(
                        "oklch.c",
                        `*${$darkBackgroundChromaScale}`
                    )
                );
                color.style.setProperty(
                    "--dark-surface-3",
                    table($darkBackgroundLightness + $darkBackgroundSpread, accentH).set(
                        "oklch.c",
                        `*${$darkBackgroundChromaScale}`
                    )
                );
                color.style.setProperty("--dark-accent-contrast", table(accentL >= 0.6 ? 0.2 : 0.95, accentH));
                color.style.setProperty(
                    "--dark-accent-hover",
                    accentL >= 0.6 ? accent.mix("black", 0.15, "oklab") : accent.mix("white", 0.1, "oklab")
                );
                color.style.setProperty(
                    "--dark-accent-active",
                    accentL >= 0.6 ? accent.mix("black", 0.3, "oklab") : accent.mix("black", 0.1, "oklab")
                );
                color.style.setProperty("--dark-accent-outline", accent.mix("white", 0.35, "oklab"));
                color.style.setProperty(
                    "--dark-strong-text",
                    table($darkTextStrong, accentH).set("oklch.c", `*${$darkTextChromaScale}`)
                );
                color.style.setProperty(
                    "--dark-body-text",
                    table(0.8, accentH).set("oklch.c", `*${$darkTextChromaScale}`)
                );
                color.style.setProperty(
                    "--dark-weak-text",
                    table(0.6, accentH).set("oklch.c", `*${$darkTextChromaScale}`)
                );
            }
        });
    });
});

mock("POST", "/accent", () => {
    const color = chroma.oklch(getPath("accentL"), getPath("accentC"), getPath("accentH"));
    const $accents = getPath("accents");
    $accents.push({ id: id(), color });
    mergePatch({
        accents: $accents,
    });
});

mock("PUT", "/accent/<id>", ({ params }) => {
    const $accents = getPath("accents");
    const index = $accents.findIndex((accent) => accent.id === params.id);
    const accent = $accents[index];
    accent.color = chroma.oklch(getPath("accentL"), getPath("accentC"), getPath("accentH"));
    mergePatch({
        accents: $accents,
        current: false,
    });
});

mergePatch({
    lightBackgroundChromaScale: 0.1,
    darkBackgroundChromaScale: 0.2,
    lightTextChromaScale: 0.1,
    darkTextChromaScale: 0.2,
    lightBackgroundLightness: 0.95,
    darkBackgroundLightness: 0.25,
    lightBackgroundSpread: 0.1,
    darkBackgroundSpread: 0.1,
    lightTextStrong: 0.2,
    darkTextStrong: 0.95,
    accentL: 0.55,
    accentC: 0.2,
    accentH: 260,
    accents: false,
    current: false,
});

mergePatch({
    accents: [
        {
            id: id(),
            color: chroma.oklch(getPath("accentL"), getPath("accentC"), getPath("accentH")),
        },
        {
            id: id(),
            color: chroma.oklch(getPath("accentL"), getPath("accentC"), 20),
        },
    ],
});

mergePatch({
    current: getPath("accents")[0],
});

function template(id, params = {}) {
    const fragment = document.getElementById(id).content.cloneNode(true);
    let outerHTML = Array.prototype.map
        .call(fragment.childNodes, (node) => node.outerHTML)
        .filter((node) => node)
        .join("");
    for (const key in params) {
        outerHTML = outerHTML.replaceAll(`{{${key}}}`, params[key]);
    }
    return outerHTML;
}

function id() {
    return "i" + Math.random().toString(36).slice(2);
}

action({
    name: "updateMaxC",
    apply({ el }) {
        const maxC = table(getPath("accentL"), getPath("accentH")).get("oklch.c");
        const accentCInput = el.querySelector("input[data-bind=accentC]");
        accentCInput.max = Math.round(maxC * 1000) / 1000;
        if (accentCInput.value > maxC) {
            mergePatch({
                accentC: Number(maxC.toFixed(3)),
            });
        }
    },
});

action({
    name: "edit",
    apply({ el }) {
        const id = el.closest("li").id;
        const current = getPath("accents").find((accent) => accent.id === id);
        mergePatch({
            accentL: current.color.get("oklch.l"),
            accentC: current.color.get("oklch.c"),
            accentH: current.color.get("oklch.h"),
            current,
        });
    },
});

action({
    name: "remove",
    apply({ el }) {
        const id = el.closest("li").id;
        const $current = getPath("current");
        beginBatch();
        if ($current.id === id) {
            mergePatch({
                current: false,
            });
        }
        mergePatch({
            accents: getPath("accents").filter((accent) => accent.id !== id),
        });
        endBatch();
    },
});

let copiedTimeout = null;

action({
    name: "copyToClipboard",
    apply({ el }, value) {
        navigator.clipboard.writeText(value);
        const update = () => {
            el.classList.add("copied");
            copiedTimeout = setTimeout(() => {
                el.classList.remove("copied");
            }, 3000);
        };
        if (el.classList.contains("copied")) {
            clearTimeout(copiedTimeout);
            el.classList.remove("copied");
            setTimeout(update);
        } else {
            update();
        }
    },
});

attribute({
    name: "cloak",
    apply({ el }) {
        el.removeAttribute("data-cloak");
    },
});

attribute({
    name: "remove",
    apply({ el }) {
        el.remove();
    },
});
