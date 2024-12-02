<script lang="ts">
    import type { Color } from "./lib/Color";
    import DemoArea from "./lib/DemoArea.svelte";

    let colors: Color[] = $state([]);
    let input: Color = $state({
        l: 0.5,
        c: 0.2,
        h: 0,
    });
    let edit = $state<number>();

    function handleAddColor(
        e: SubmitEvent & { currentTarget: HTMLFormElement }
    ) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const color = {
            l: Number(formData.get("lightness")!),
            c: Number(formData.get("chroma")!),
            h: Number(formData.get("hue"))!,
        };
        colors.push(color);
    }

    function handleRemoveColor(index: number) {
        colors = colors.filter((_, i) => i !== index);
    }

    function handleEditColor(index: number) {
        edit = index;
        input = colors[index];
    }

    function handleConfirmColor(
        e: SubmitEvent & { currentTarget: HTMLFormElement }
    ) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const color = {
            l: Number(formData.get("lightness")!),
            c: Number(formData.get("chroma")!),
            h: Number(formData.get("hue"))!,
        };
        colors = colors.map((c, i) => (i === edit ? color : c));
        edit = undefined;
    }
</script>

<h1 style="text-align: center;">OKLCH</h1>

<form
    onsubmit={edit !== undefined ? handleConfirmColor : handleAddColor}
    style:accent-color="oklch({input.l}
    {input.c}
    {input.h})"
>
    <div class="slider-grid">
        <label for="lightness">L</label>
        <input
            id="lightness"
            name="lightness"
            type="range"
            min="0.3"
            max="0.7"
            step="0.01"
            bind:value={input.l}
        />
        <input
            type="number"
            min="0.3"
            max="0.7"
            step="0.01"
            bind:value={input.l}
        />
        <label for="chroma">C</label>
        <input
            id="chroma"
            name="chroma"
            type="range"
            min="0.1"
            max="0.3"
            step="0.01"
            bind:value={input.c}
        />
        <input
            type="number"
            min="0.1"
            max="0.3"
            step="0.01"
            bind:value={input.c}
        />
        <label for="hue">H</label>
        <input
            id="hue"
            name="hue"
            type="range"
            min="0"
            max="360"
            step="1"
            bind:value={input.h}
        />
        <input type="number" min="0" max="360" step="1" bind:value={input.h} />
    </div>
    <button type="submit" style="width: 8ch;">
        {edit !== undefined ? "Confirm" : "+ Add"}
    </button>
</form>

{#each colors as color, i}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="demo">
        <div class="demo-actions">
            <span onclick={() => handleEditColor(i)}>Edit</span>
            <span onclick={() => handleRemoveColor(i)}>Remove</span>
        </div>
        <div class="demo-areas">
            <DemoArea {color} />
            <DemoArea {color} dark />
        </div>
    </div>
{/each}

<style lang="scss">
    form {
        margin-block: 2rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }

    input[type="number"] {
        width: 7ch;
    }

    label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-basis: 40ch;
        flex-grow: 1;
    }

    .slider-grid {
        display: grid;
        grid-template-columns: auto 1fr auto;
        column-gap: 1rem;
        row-gap: 0.5rem;
    }

    .demo {
        margin-block: 3rem;
        max-width: 80ch;
        margin-inline: auto;
    }

    .demo-actions {
        margin-bottom: 0.5rem;

        span {
            user-select: none;
            cursor: pointer;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .demo-areas {
        display: flex;
        flex-wrap: wrap;
        column-gap: 2rem;
        row-gap: 1rem;
    }
</style>
