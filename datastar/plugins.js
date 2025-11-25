import {
    action,
    actions,
    attribute,
    effect,
    getPath,
    mergePatch,
    beginBatch,
    endBatch,
} from "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.6/bundles/datastar.js";
import { template, datastarFetch, mock, sleep } from "./mock.js";

(function beginMock() {
    mock("GET", "/messages", async () => {
        datastarFetch("datastar-patch-elements", {
            elements: template("messages", {
                index: 1,
                hash: Math.random().toString(36).slice(2),
            }),
        });
        for (let i = 2; i <= 100; ++i) {
            await sleep(10);
            datastarFetch("datastar-patch-elements", {
                elements: template("messages", {
                    index: i,
                    hash: Math.random().toString(36).slice(2),
                }),
            });
        }
    });
    mock("GET", "/timestamp", () => {
        datastarFetch("datastar-patch-elements", {
            elements: template("timestamp", { timestamp: new Date().toISOString() }),
            selector: "#timestamps",
            mode: "append",
        });
    });
    mock("GET", location.pathname, () => {
        requestIdleCallback(() => {
            effect(() => {
                datastarFetch("datastar-patch-elements", {
                    selector: "#tasklist",
                    mode: "inner",
                    elements: getPath("tasks")
                        .map((task) => template("task", task))
                        .join(""),
                });
                mergePatch({
                    _length: getPath("tasks").length,
                });
            });
        });
    });
    mock("POST", "/todo", ({ body: { title } }) => {
        getPath("addTask")(title);
    });
    mock("PUT", "/todo/<id>", ({ body }) => {
        beginBatch();
        for (const task of body.tasksUpdates) {
            getPath("updateTask")(task);
        }
        endBatch();
    });

    mock("DELETE", "/todo/<id>", ({ params }) => {
        getPath("deleteTask")(params.id);
    });

    beginBatch();
    mergePatch({
        id() {
            return "i" + Math.random().toString(36).slice(2);
        },
    });
    const MOCK_TASKS_STORAGE_KEY = "__mock_tasks";
    let stored = localStorage.getItem(MOCK_TASKS_STORAGE_KEY);
    if (stored) {
        stored = JSON.parse(stored);
        outer: for (const task of stored) {
            for (const key of ["id", "title", "completed"]) {
                if (!(key in task)) {
                    stored = null;
                    localStorage.removeItem(MOCK_TASKS_STORAGE_KEY);
                    break outer;
                }
            }
        }
    }
    mergePatch({
        tasks: stored ?? [
            { id: getPath("id")(), completed: true, title: "take out white trash" },
            { id: getPath("id")(), completed: false, title: "make fat bank" },
        ],
        addTask(title) {
            mergePatch({
                tasks: [
                    ...getPath("tasks"),
                    {
                        id: getPath("id")(),
                        title: title.trim(),
                    },
                ],
                title: "",
            });
        },
        updateTask(update) {
            mergePatch({
                tasks: getPath("tasks").map((task) => (task.id === update.id ? { ...task, ...update } : task)),
            });
        },
        deleteTask(id) {
            mergePatch({
                tasks: getPath("tasks").filter((task) => task.id !== id),
            });
        },
    });
    endBatch();
    effect(() => {
        localStorage.setItem(MOCK_TASKS_STORAGE_KEY, JSON.stringify(getPath("tasks")));
    });
})();

action({
    name: "handleClick",
    apply(ctx) {
        const { evt } = ctx;
        switch (evt.target.closest("[data-action]")?.dataset.action) {
            case "delete":
                actions.delete(ctx, `/todo/${evt.target.closest("li").id}`);
                break;

            default:
                break;
        }
    },
});

action({
    name: "handleChange",
    apply(ctx) {
        const { evt } = ctx;
        const id = evt.target.closest("li").id;
        if (!id) return;
        switch (evt.target.name) {
            case "title": {
                const title = evt.target.value;
                mergePatch({
                    tasksUpdates: [
                        {
                            id,
                            title,
                        },
                    ],
                });
                actions.put(ctx, `/todo/${id}`).then(() => {
                    mergePatch({ tasksUpdates: null });
                });
                break;
            }

            case "completed": {
                const completed = evt.target.checked;
                mergePatch({
                    tasksUpdates: [
                        {
                            id,
                            completed,
                        },
                    ],
                });
                actions.put(ctx, `/todo/${id}`).then(() => {
                    mergePatch({ tasksUpdates: null });
                });
                break;
            }

            default:
                break;
        }
    },
});

let interval = null;
let effects = [];
attribute({
    name: "time",
    valReq: "must",
    shouldEvaluate: false,
    apply({ el, mods, value }) {
        const datetime = value;
        const date = new Date(datetime);
        if (mods.has("relative")) {
            const update = () => {
                const now = new Date();
                el.innerText = formatRelativeTime(date, now);
            };
            effects.push({ el, update });
            for (const e of effects) {
                e.update();
            }
            if (!interval) {
                interval = setInterval(() => {
                    for (const e of effects) {
                        e.update();
                    }
                }, 15 * 1000);
            }
        } else {
            const dateStyle = mods.get("date")?.values().next().value ?? "short";
            const timeStyle = mods.get("time")?.values().next().value ?? "short";
            const formatter = new Intl.DateTimeFormat(undefined, {
                dateStyle,
                timeStyle,
            });
            el.innerText = formatter.format(date);
        }
        el.setAttribute("datetime", datetime);
        return () => {
            effects = effects.filter((e) => e.el !== el);
            if (effects.length === 0) {
                clearInterval(interval);
                interval = null;
            }
        };
    },
});

const units = ["milliseconds", "seconds", "minutes", "hours", "days", "months", "years"];

function wrappingSubtract(lhs, rhs, modulo) {
    return lhs - (lhs > rhs ? rhs + modulo : rhs);
}

function formatRelativeTime(date, now) {
    // find unit of time
    const longerSinceUnits = [];
    let compare = new Date(now);
    compare.setUTCSeconds(compare.getUTCSeconds() - 1);
    longerSinceUnits.push(date <= compare);
    compare = new Date(now);
    compare.setUTCMinutes(compare.getUTCMinutes() - 1);
    longerSinceUnits.push(date <= compare);
    compare = new Date(now);
    compare.setUTCHours(compare.getUTCHours() - 1);
    longerSinceUnits.push(date <= compare);
    compare = new Date(now);
    compare.setUTCDate(compare.getUTCDate() - 1);
    longerSinceUnits.push(date <= compare);
    compare = new Date(now);
    compare.setUTCMonth(compare.getUTCMonth() - 1);
    longerSinceUnits.push(date <= compare);
    compare = new Date(now);
    compare.setUTCFullYear(compare.getUTCFullYear() - 1);
    longerSinceUnits.push(date <= compare);
    longerSinceUnits.push(false);
    const unitIndex = longerSinceUnits.findIndex((unit) => !unit);
    let unit = units[unitIndex];
    // find time difference (duration) for each unit of time
    const diffUnits = [];
    compare = new Date(now);
    compare.setUTCDate(0); // check number of days in previous month to render same date as "1 month ago"
    const moduloUnits = [1000, 60, 60, 24, compare.getUTCDate(), 12];
    diffUnits.push(wrappingSubtract(date.getUTCMilliseconds(), now.getUTCMilliseconds(), moduloUnits[0]));
    diffUnits.push(wrappingSubtract(date.getUTCSeconds(), now.getUTCSeconds(), moduloUnits[1]));
    diffUnits.push(wrappingSubtract(date.getUTCMinutes(), now.getUTCMinutes(), moduloUnits[2]));
    diffUnits.push(wrappingSubtract(date.getUTCHours(), now.getUTCHours(), moduloUnits[3]));
    diffUnits.push(wrappingSubtract(date.getUTCDate(), now.getUTCDate(), moduloUnits[4]));
    diffUnits.push(wrappingSubtract(date.getUTCMonth(), now.getUTCMonth(), moduloUnits[5]));
    diffUnits.push(date.getUTCFullYear() - now.getUTCFullYear());
    let duration = diffUnits[unitIndex];
    // correct time difference calculation for entire duration
    compare = new Date(now);
    let wrappingUnit = false;
    if (unit !== "year") wrappingUnit = true;
    switch (unit) {
        case "milliseconds":
            compare.setUTCMilliseconds(compare.getUTCMilliseconds() + duration);
            break;
        case "seconds":
            compare.setUTCSeconds(compare.getUTCSeconds() + duration);
            break;
        case "minutes":
            compare.setUTCMinutes(compare.getUTCMinutes() + duration);
            break;
        case "hours":
            compare.setUTCHours(compare.getUTCHours() + duration);
            break;
        case "days":
            compare.setUTCDate(compare.getUTCDate() + duration);
            break;
        case "months":
            compare.setUTCMonth(compare.getUTCMonth() + duration);
            break;
        default:
            break;
    }
    if (unit === "milliseconds") {
        duration = Math.ceil(duration / 1000);
        unit = "seconds"; // seconds is smallest unit allowed in formatter
    }
    if (wrappingUnit && date < compare && duration === 0) duration = -moduloUnits[unitIndex] + 1;
    // finally format duration
    const formatter = new Intl.RelativeTimeFormat(undefined, {
        numeric: unit === "seconds" ? "auto" : "always",
        style: "long",
    });
    return formatter.format(duration, unit);
}
