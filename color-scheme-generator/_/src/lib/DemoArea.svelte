<script lang="ts">
    import type { Color } from "./Color";

    type Props = {
        dark?: boolean;
        color: Color;
    };

    let { dark, color }: Props = $props();
</script>

<div
    class="demo-area"
    data-color-scheme={dark ? "dark" : "light"}
    style:--l={color.l}
    style:--c={color.c}
    style:--h={color.h}
    style:--z={color.l > 0.7 ? 0.3 : 0.95}
>
    <header>
        <h2>Heading</h2>
        <button data-variant="accent">Button</button>
    </header>
    <aside>
        <h2>Sidebar</h2>
        <small>v1.0</small>
    </aside>
    <div>
        <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
            Consequatur mollitia voluptatem quo quia necessitatibus hic in at
            minus sapiente tempore.
        </p>
        <fieldset>
            <input type="text" placeholder="Type something..." />
            <button>Button</button>
        </fieldset>
    </div>
</div>

<style lang="scss">
    ::selection {
        background: var(--selection);
        color: var(--strong-text);
    }

    :focus-visible {
        outline: 3px solid var(--strong-text);
        outline-offset: 1px;
    }

    [data-color-scheme="light"] {
        --surface-1: oklch(1 0.004 var(--h));
        --surface-2: oklch(0.94 0.004 var(--h));
        --surface-3: oklch(0.85 0.004 var(--h));
        --weak-text: oklch(0.6 0.004 var(--h));
        --body-text: oklch(0.4 0.01 var(--h));
        --strong-text: oklch(0.25 0.01 var(--h));
        --accent: oklch(var(--l) var(--c) var(--h));
        --accent-hover: color-mix(in oklab, var(--accent), white 15%);
        --accent-active: color-mix(in oklab, var(--accent), black 15%);
        --accent-contrast: oklch(var(--z) 0.004 var(--h));
        --accent-border: color-mix(in oklab, var(--accent), black 10%);
        --neutral: oklch(0.85 0.02 var(--h));
        --neutral-hover: color-mix(in oklab, var(--neutral), black 10%);
        --neutral-active: color-mix(in oklab, var(--neutral), black 20%);
        --neutral-border: color-mix(in oklab, var(--neutral), black 10%);
        --neutral-shadow: oklch(
            from color-mix(in oklab, var(--neutral), black 50%) l c h / 0.5
        );
        --selection: oklch(
            from color-mix(in oklab, var(--accent), white 30%) l c h / 0.5
        );
    }

    [data-color-scheme="dark"] {
        --surface-1: oklch(0.2 0.004 var(--h));
        --surface-2: oklch(0.28 0.004 var(--h));
        --surface-3: oklch(0.37 0.004 var(--h));
        --weak-text: oklch(0.6 0.004 var(--h));
        --body-text: oklch(0.85 0.01 var(--h));
        --strong-text: oklch(0.95 0.01 var(--h));
        --accent: color-mix(in oklab, var(--accent-border), black 10%);
        --accent-hover: color-mix(in oklab, var(--accent), white 15%);
        --accent-active: color-mix(in oklab, var(--accent), black 15%);
        --accent-contrast: oklch(var(--z) 0.004 var(--h));
        --accent-border: oklch(var(--l) var(--c) var(--h));
        --neutral: oklch(0.4 0.02 var(--h));
        --neutral-hover: color-mix(in oklab, var(--neutral), white 15%);
        --neutral-active: color-mix(in oklab, var(--neutral), black 15%);
        --neutral-border: color-mix(in oklab, var(--neutral), white 10%);
        --neutral-shadow: oklch(
            from color-mix(in oklab, var(--neutral), black 50%) l c h / 0.5
        );
        --selection: oklch(
            from color-mix(in oklab, var(--accent), white 30%) l c h / 0.5
        );
    }

    .demo-area {
        background: var(--surface-1);
        color: var(--body-text);
        border: 1px solid var(--neutral-border);
        border-radius: 5px;
        overflow: hidden;
        display: grid;
        grid-template-areas:
            "header header"
            "sidebar main";
        flex-basis: 30ch;
        flex-grow: 1;
        box-shadow: 0 0.25rem 2rem -0.25rem var(--neutral-shadow);

        > * {
            padding-inline: 0.5rem;
        }
    }

    header {
        background: var(--surface-3);
        border-bottom: 1px solid var(--neutral-border);
        grid-area: header;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    aside {
        grid-area: sidebar;
        background: var(--surface-2);
        border-right: 1px solid var(--neutral-border);
    }

    h2 {
        color: var(--strong-text);
        font-size: 1rem;
    }

    small {
        color: var(--weak-text);
    }

    fieldset {
        margin-block: 1rem;
        padding: 0;
        border: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    button,
    input {
        height: 2rem;
        box-sizing: border-box;
        padding-inline: 0.5rem;
        border: 1px solid var(--neutral-border);
        border-radius: 3px;
        color: var(--strong-text);
    }

    button {
        background: var(--neutral);

        &:not(:disabled) {
            &:hover {
                background: var(--neutral-hover);
            }

            &:active {
                background: var(--neutral-active);
            }
        }

        &[data-variant="accent"] {
            background: var(--accent);
            border-color: var(--accent-border);
            color: var(--accent-contrast);

            &:not(:disabled) {
                &:hover {
                    background: var(--accent-hover);
                }

                &:active {
                    background: var(--accent-active);
                }
            }
        }
    }

    ::placeholder {
        color: var(--weak-text);
    }

    input {
        background: var(--surface-2);
        color: var(--strong-text);
        width: 20ch;

        &:not(:disabled) {
            &:hover {
                background: var(--surface-3);
            }
        }
    }
</style>
