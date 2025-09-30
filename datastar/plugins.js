import { load } from "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.5/bundles/datastar.js";

load({
    type: "attribute",
    name: "time",
    valReq: "must",
    returnsValue: true,
    interval: null,
    effects: [],
    onLoad({ el, mods, rx, plugin }) {
        const datetime = rx();
        const date = new Date(datetime);
        if (mods.has("relative")) {
            const update = () => {
                const now = new Date();
                el.innerText = formatRelativeTime(date, now);
            };
            plugin.effects.push({ el, update });
            for (const e of plugin.effects) {
                e.update();
            }
            if (!plugin.interval) {
                plugin.interval = setInterval(() => {
                    for (const e of plugin.effects) {
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
            plugin.effects = plugin.effects.filter((e) => e.el !== el);
            if (plugin.effects.length === 0) {
                clearInterval(plugin.interval);
                plugin.interval = null;
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
