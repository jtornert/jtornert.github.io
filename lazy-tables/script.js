import {
    attribute,
    getPath,
    mergePatch,
} from "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.6/bundles/datastar.js";
import { mock, datastarFetch } from "/datastar/mock.js";

(function beginMock() {
    mock("GET", "/table-data-<id>.html", async () => {
        const $offset = getPath("offset");
        if ($offset === 9) {
            mergePatch({
                end: true,
            });
        }
        const $end = getPath("end");
        setTimeout(() => {
            datastarFetch("datastar-patch-elements", {
                selector: ".loading",
                mode: "remove",
            });
            let data = `<tr>
    <td>Row</td>
    <td>${$offset * 10 + 1}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 2}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 3}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 4}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 5}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 6}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 7}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 8}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 9}</td>
</tr>
<tr>
    <td>Row</td>
    <td>${$offset * 10 + 10}</td>
</tr>`;
            if (!$end) {
                data =
                    data +
                    `<tr class="loading">
                <td>Loading...</td>
            </tr>`;
            }
            datastarFetch("datastar-patch-elements", {
                selector: "tbody",
                mode: "append",
                elements: data,
            });
        }, 400);
    });
})();

function throttle(fn, duration = 200) {
    let timeout = null;
    return function () {
        if (!timeout) {
            timeout = setTimeout(() => {
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
