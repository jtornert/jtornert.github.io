htmx.defineExtension("table-copy-cells", {
    onEvent: function (name, e) {
        if (
            name === "htmx:beforeProcessNode" &&
            e.target.nodeName === "TBODY"
        ) {
            /** @type {HTMLTableElement} */
            const tbody = e.target;
            tbody.title = "Copy";
            tbody.addEventListener("click", (evt) => {
                /** @type {HTMLTableCellElement} */
                const td = evt.target;
                navigator.clipboard.writeText(td.textContent);
                td.animate(
                    {
                        background: ["#444", "transparent"],
                    },
                    {
                        delay: 200,
                        duration: 1000,
                        easing: "ease-in",
                        fill: "backwards",
                    }
                );
            });
        }

        return true;
    },
});
