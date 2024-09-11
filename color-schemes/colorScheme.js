function setAutoDocumentColorScheme(isDarkMode) {
    if (isDarkMode) {
        document.documentElement.dataset.colorScheme = "dark";
    } else {
        document.documentElement.dataset.colorScheme = "light";
    }
}

const systemColorScheme = matchMedia("(prefers-color-scheme: dark)");
const preference = localStorage.getItem("colorScheme");

if (preference === null) {
    setAutoDocumentColorScheme(systemColorScheme.matches);
} else {
    document.documentElement.dataset.colorScheme = preference;
}

systemColorScheme.addEventListener("change", (e) => {
    const preference = localStorage.getItem("colorScheme");

    if (preference === null) {
        setAutoDocumentColorScheme(e.matches);
    }
});

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

/**
 * @param {HTMLSelectElement} element
 */
function colorSchemeSwitcher(element) {
    element.value = localStorage.getItem("colorScheme") || "auto";

    element.addEventListener("change", (e) =>
        setColorSchemePreference(e.currentTarget.value)
    );
}
