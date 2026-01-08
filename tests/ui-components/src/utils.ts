export function idFrom(element: Element) {
    return element.id ? element.id : "i" + Math.random().toString(36).slice(2);
}
