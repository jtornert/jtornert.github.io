const __fetch = window.fetch;
window.fetch = __fetch_with_mocks;
const router = {
    GET: [],
    POST: [],
    PUT: [],
    PATCH: [],
    DELETE: [],
};

function matchRoute(input, init) {
    const url = new URL(input, input.includes("://") ? undefined : location.origin);
    const urlFragments = url.pathname.split("/").filter((str) => str.length);
    for (const route of router[init.method ?? "GET"]) {
        if (route.fragments.length !== urlFragments.length) continue;
        const params = {};
        for (let i = 0; i < urlFragments.length; ++i) {
            const match = route.fragments[i].match(/<([\w]+)>/);
            if (match) {
                params[match[1]] = urlFragments[i]
                    .slice(match.index)
                    .replace(route.fragments[i].slice(match.index + match.length + 2), "");
            } else if (route.fragments[i] !== urlFragments[i]) {
                break;
            }
            if (i === urlFragments.length - 1) {
                init.headers = new Headers(init.headers);
                if (init.headers.get("content-type") === "application/json" && init.body) {
                    init.body = JSON.parse(init.body);
                }
                return { handler: route.handler?.bind(undefined, { params, url, ...init }) };
            }
        }
    }
}

function __fetch_with_mocks(input, init = {}) {
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

export function sleep(duration) {
    return new Promise((res) =>
        setTimeout(() => {
            res();
        }, duration)
    );
}

export function mock(method, path, handler) {
    router[method].push({
        fragments: path.split("/").filter((str) => str.length),
        handler,
    });
}

/**
 * @param {"datastar-patch-elements" | "datastar-patch-signals"} name
 * @param {object} args
 */
export function datastarFetch(name, args) {
    document.dispatchEvent(new CustomEvent("datastar-fetch", { detail: { type: name, argsRaw: args } }));
}

export function template(id, params = {}) {
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
