function id() {
    return "i" + Math.random().toString(36).slice(2);
}

document.addEventListener("alpine:init", () => {
    for (const element of document.querySelectorAll(".removeme")) {
        element.remove();
    }

    new Sortable(document.querySelector(".tasklist"), {
        handle: "span.icon",
        scroll: true,
    });

    Alpine.store("tasks", {
        list: [],
        init() {
            const tasks = localStorage.getItem("tasks");
            if (tasks) {
                this.list = JSON.parse(tasks);
            }
        },
        add(input) {
            if (input.value.trim() === "") {
                return;
            }
            const task = {
                id: id(),
                title: input.value,
                completed: false,
            };
            this.list.push(task);
            this.save();
            input.value = "";
            return task;
        },
        remove(id) {
            this.list = this.list.filter((t) => t.id != id);
            this.save();
        },
        update(task, update, input) {
            if (update.title.trim() === "") {
                input.value = task.title.trim();
                return;
            }
            this.list = this.list.map((t) =>
                t.id === task.id ? { ...t, ...update } : t
            );
            this.save();
        },
        toggle(id) {
            this.list = this.list.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            );
            this.save();
        },
        save() {
            localStorage.setItem("tasks", JSON.stringify(this.list));
        },
    });
});
