let maxCharacters = 20;

const answer = document.getElementById("answer");
const characters = document.getElementById("characters");
const selected = document.getElementById("selected");
const remaining = document.getElementById("remaining");

function sanitize(target) {
    remaining.innerText = maxCharacters - target.value.length;
    if (target.value.length > maxCharacters) {
        target.value = target.value.slice(0, maxCharacters);
        remaining.innerText = maxCharacters - target.value.length;
        alert("Nope");
        throw new Error("Max characters reached.");
    }
}

selected.innerText = characters.value;
remaining.innerText = characters.value - answer.value.length;

sanitize(answer);

answer.addEventListener("paste", (e) => {
    alert("Nope");
    e.preventDefault();
});
answer.addEventListener("input", (e) => {
    sanitize(e.currentTarget);
    remaining.innerText = maxCharacters - e.currentTarget.value.length;
});
characters.addEventListener("input", (e) => {
    selected.innerText = e.currentTarget.value;
});
characters.addEventListener("change", (e) => {
    maxCharacters = e.currentTarget.value;
    sanitize(answer);
});
