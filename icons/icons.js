const baseURL = "/svg";
const icons = {};

async function create(name) {
    if (icons[name] !== undefined) {
        return icons[name].cloneNode(true);
    }

    const url = `${baseURL}/${name}.svg`;
    const text = await fetch(url).then((res) => res.text());
    const svg = new DOMParser().parseFromString(text, "image/svg+xml");
    svg.querySelector("script")?.remove();
    const g = svg.querySelector("g");
    g.removeAttribute("stroke");
    g.removeAttribute("stroke-width");
    icons[name] = svg.firstElementChild;

    console.debug(svg.firstElementChild);

    return svg.firstElementChild.cloneNode(true);
}

window.addEventListener("load", async () => {
    for (const element of document.querySelectorAll("i[data-icon]")) {
        const svg = await create(element.dataset.icon);
        svg.dataset.icon = element.dataset.icon;
        svg.setAttribute("style", element.style.cssText);
        element.replaceWith(svg);
    }
});
