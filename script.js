let maxCharacters = 20;

function sanitize(target) {
    if (target.value.length > maxCharacters) {
        target.value = target.value.slice(0, maxCharacters);
        alert("Nope");
        throw new Error("Max characters reached.");
    }
}

const answer = document.getElementById("answer");
const characters = document.getElementById("characters");
const selected = document.getElementById("selected");
const remaining = document.getElementById("remaining");

selected.innerText = characters.value;
remaining.innerText = characters.value - answer.value.length;

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
    let cache = maxCharacters;
    maxCharacters = e.currentTarget.value;
    const newAnswer = document.getElementById("answer");
    console.debug(answer.value, newAnswer.value);
    try {
        sanitize(newAnswer);
    } catch (e) {
        maxCharacters = cache;
    }
    remaining.innerText = maxCharacters - newAnswer.value.length;
});
