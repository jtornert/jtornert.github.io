htmx.defineExtension("scroll-near-bottom", {
    onEvent: function (name, e) {
        if (
            name === "htmx:beforeProcessNode" &&
            e.target.getAttribute("hx-ext")?.includes("scroll-near-bottom")
        ) {
            /** @type {HTMLElement} */
            const target = e.target;
            const threshold = Number(target.dataset.scrollThreshold) || 100;

            target.addEventListener("scroll", function () {
                const availableScrollHeight =
                    target.scrollHeight - target.getBoundingClientRect().height;
                const scrolledHeight = target.scrollTop;

                if (scrolledHeight > availableScrollHeight - threshold) {
                    target.dispatchEvent(new CustomEvent("near-bottom"));
                }
            });
        }
        return true;
    },
});
