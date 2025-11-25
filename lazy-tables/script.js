import { attribute } from "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.6/bundles/datastar.js";
import { mock, datastarFetch } from "/datastar/mock.js";

(function beginMock() {
    mock("GET", "/table-data-<id>.html", async ({ params, url }) => {
        const offset = Number(params.id) * 10;
        datastarFetch("datastar-patch-elements", {
            selector: "tbody",
            mode: "append",
            elements: `<tr>
    <td>Row</td>
    <td>${offset + 1}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 2}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 3}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 4}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 5}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 6}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 7}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 8}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 9}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${offset + 10}</td>
</tr>`,
        });
    });
})();

function throttle(fn, duration = 200) {
    let timeout = null;
    return function () {
        if (!timeout) {
            timeout = setTimeout(() => {
                fn.apply(this, arguments);
                timeout = null;
            }, duration);
            fn.apply(this, arguments);
        }
    };
}

attribute({
    name: "scroll-handler",
    apply({ el, mods }) {
        let offset = mods.has("offset") ? [...mods.get("offset")][0] : "0px";
        if (!offset.endsWith("px")) return;
        offset = Number(offset.slice(0, -2));
        const end = throttle(() => {
            el.dispatchEvent(new CustomEvent("scrollnearend"));
        });
        function handleScrollNearEnd(evt) {
            if (evt.target.scrollTop + evt.target.clientHeight + offset >= evt.target.scrollHeight) {
                end();
            }
        }
        el.addEventListener("scroll", handleScrollNearEnd, { passive: true });
    },
});
