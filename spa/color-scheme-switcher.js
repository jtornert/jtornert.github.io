/**
 * @param {"auto" | "light" | "dark"} preference
 */
function setColorSchemePreference(preference) {
    if (preference === "auto") {
        localStorage.removeItem("colorScheme");
        if (matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.dataset.colorScheme = "dark";
        } else {
            document.documentElement.dataset.colorScheme = "light";
        }
    } else {
        localStorage.setItem("colorScheme", preference);
        document.documentElement.dataset.colorScheme = preference;
    }
}

function handleColorSchemeChange(e) {
    setColorSchemePreference(e.target.value);
}

function colorSchemeSwitcher(element) {
    element.value = localStorage.getItem("colorScheme") ?? "auto";
    element.addEventListener("change", handleColorSchemeChange);
}
