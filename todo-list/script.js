/**
 * @typedef {object} Task
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 */

var ui = {
    id() {
        return "i" + Math.random().toString(36).slice(2);
    },
};

document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
        /** @type {Task[]} */
        list: Alpine.$persist([]).as("tasks"),
        classes: {
            task() {
                const id = this.$el.dataset.taskId;
                const task = this.list.find((t) => t.id === id);
                return task.completed ? { completed: true } : null;
            },
        },
        end(e) {
            let newList = JSON.parse(localStorage.getItem("tasks")).toSpliced(
                e.oldIndex,
                1
            );
            newList.splice(e.newIndex, 0, { ...this.list[e.oldIndex] });
            localStorage.setItem("tasks", JSON.stringify(newList));
        },
        add(e) {
            const formData = new FormData(e.target);
            const title = formData.get("title").trim();
            if (title === "") {
                return;
            }
            const task = {
                id: ui.id(),
                title,
                completed: false,
            };
            this.list.push(task);
            e.target.querySelector("input[name=title]").value = "";
        },
        remove(e) {
            const id = e.target.closest("[data-task-id]").dataset.taskId;
            this.list = this.list.filter((t) => t.id != id);
        },
        update(e) {
            const id = e.target.closest("[data-task-id]").dataset.taskId;
            const task = this.list.find((t) => t.id === id);

            const title = e.target.value.trim();

            if (title === "") {
                e.target.value = task.title.trim();
                return;
            }

            this.list = this.list.map((t) =>
                t.id === task.id ? { ...t, title } : t
            );
        },
        toggle(e) {
            const id = e.target.closest("[data-task-id]").dataset.taskId;

            this.list = this.list.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            );
        },
    }));
});
