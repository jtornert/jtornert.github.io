type Keys = Partial<
    Record<"ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | " ", boolean>
>;

const PLAYER_SIZE = 32;
const JUMP_ANIMATION_DURATION = 300;
const JUMP_DISTANCE = PLAYER_SIZE * 2;
const CHUNK_SIZE = 16;
const CHUNKS_PER_FRAME = 4;
const CHUNKS_PER_GAME = CHUNKS_PER_FRAME * 4;
const MOVE_ANIMATION_DURATION = 60 * CHUNK_SIZE;
const MOVE_DISTANCE = PLAYER_SIZE * CHUNK_SIZE;
const FRAME_RATE = 1000 / 100;
const BLOCK_GROUND = 0;
const BLOCK_GROUND_SPIKE = 1;
const FONT_SIZE = 16;

customElements.define(
    "canvas-2d",
    class Canvas2D extends HTMLElement {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        pos: [number, number];
        keys!: Keys;
        playState!: "menu" | "playing" | "success" | "fail";
        frameTimeout?: number;
        jumpAnimationProgress!: number;
        jumpDistance!: number;
        moveAnimationProgress!: number;
        moveDistance!: number;
        lastFrame!: Date;
        currentFrame!: Date;
        deltaTime!: number;
        tiles!: number[];
        chunks!: number;

        constructor() {
            super();
            this.canvas = document.createElement("canvas");
            const ctx = this.canvas.getContext("2d", { alpha: false });
            if (!ctx) {
                throw new Error("could not get canvas 2d context");
            }
            this.canvas.height = PLAYER_SIZE * 10;
            this.canvas.width = PLAYER_SIZE * 32;
            this.canvas.style.width = "100%";
            this.pos = [PLAYER_SIZE * 6, PLAYER_SIZE * 8];
            this.ctx = ctx;
            ctx.font = `${FONT_SIZE}px sans-serif`;
            ctx.textRendering = "optimizeSpeed";
            this.resetGame();
        }

        resetGame() {
            this.playState = "menu";
            this.keys = {};
            this.jumpAnimationProgress = 1;
            this.jumpDistance = 0;
            this.moveAnimationProgress = 0.000001;
            this.moveDistance = 0;
            this.lastFrame = new Date();
            this.currentFrame = new Date();
            this.deltaTime = 0;
            this.tiles = new Array(CHUNK_SIZE * CHUNKS_PER_FRAME).fill(0);
            this.tiles[16] = BLOCK_GROUND_SPIKE;
            this.tiles[17] = BLOCK_GROUND_SPIKE;
            this.tiles[18] = BLOCK_GROUND_SPIKE;
            this.chunks = CHUNKS_PER_FRAME;
            this.tick();
            this.drawStartGame();
        }

        connectedCallback() {
            this.append(this.canvas);
            window.addEventListener("keydown", (e) => {
                if (!e.repeat) {
                    this.keys[e.key as keyof Keys] = true;
                    if (e.key === "Escape") {
                        e.preventDefault();
                        if (this.playState === "menu") {
                            this.playState = "playing";
                            this.currentFrame = new Date();
                            this.tick();
                        }
                    } else if (e.key === "r" && this.playState !== "playing") {
                        e.preventDefault();
                        this.resetGame();
                    }
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    this.currentFrame = new Date();
                    this.currentFrame.setMilliseconds(
                        this.currentFrame.getMilliseconds() - FRAME_RATE,
                    );
                    this.tick();
                } else if (e.key === " ") {
                    e.preventDefault();
                }
                this.handleKeys();
            });
            window.addEventListener("keyup", (e) => {
                this.keys[e.key as keyof Keys] = false;
            });
            window.addEventListener("touchstart", (e) => {
                switch (this.playState) {
                    case "playing":
                        this.keys[" "] = true;
                        this.handleKeys();
                        break;

                    case "menu":
                        this.playState = "playing";
                        this.currentFrame = new Date();
                        this.tick();
                        break;

                    default:
                        this.resetGame();
                        break;
                }
            });
            window.addEventListener("touchend", (e) => {
                if (this.playState) {
                    this.keys[" "] = false;
                }
            });
        }

        handleKeys() {
            if (this.keys[" "] && this.jumpAnimationProgress === 1) {
                this.jumpAnimationProgress = 0;
            }
        }

        tick() {
            this.lastFrame = this.currentFrame;
            this.currentFrame = new Date();
            this.deltaTime =
                this.currentFrame.valueOf() - this.lastFrame.valueOf();
            const ctx = this.ctx;
            ctx.resetTransform();
            this.updateAnimations();
            this.ctx.fillStyle = "#222";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTiles();
            this.drawPlayer();
            this.detectCollisions();
            if (this.moveAnimationProgress === 0) {
                this.generateChunk();
            }
            if (this.chunks === CHUNKS_PER_GAME + CHUNKS_PER_FRAME) {
                this.playState = "success";
                this.drawCompleteGame();
            }
            if (this.playState === "playing") {
                requestAnimationFrame(() => {
                    this.tick();
                });
            }
        }

        detectCollisions() {
            const playerStartX = this.pos[0] - PLAYER_SIZE;
            const playerEndX = playerStartX + PLAYER_SIZE;
            const playerStartY = this.pos[1] - PLAYER_SIZE - this.jumpDistance;
            const playerEndY = playerStartY + PLAYER_SIZE;
            for (let i = 0; i < this.tiles.length; ++i) {
                const tile = this.tiles[i];
                if (tile === BLOCK_GROUND_SPIKE) {
                    const tileStartX =
                        this.pos[0] -
                        PLAYER_SIZE * 6 +
                        i * PLAYER_SIZE -
                        this.moveDistance;
                    const tileEndX = tileStartX + PLAYER_SIZE;
                    const tileStartY = this.pos[1] - PLAYER_SIZE;
                    const tileEndY = tileStartY + PLAYER_SIZE;
                    if (tileStartX < playerEndX && tileEndX > playerStartX) {
                        for (const [x, y] of [
                            [
                                tileStartX + PLAYER_SIZE / 4,
                                tileStartY + PLAYER_SIZE / 4,
                            ],
                            [
                                tileStartX + PLAYER_SIZE / 4,
                                tileEndY - PLAYER_SIZE / 4,
                            ],
                            [
                                tileEndX - PLAYER_SIZE / 4,
                                tileStartY + PLAYER_SIZE / 4,
                            ],
                            [
                                tileEndX - PLAYER_SIZE / 4,
                                tileEndY - PLAYER_SIZE / 4,
                            ],
                        ]) {
                            if (
                                playerStartX < x &&
                                x < playerEndX &&
                                playerStartY < y &&
                                y < playerEndY
                            ) {
                                this.playState = "fail";
                                this.drawFailGame();
                            }
                        }
                    }
                }
            }
        }

        generateChunk() {
            let i;
            for (i = 0; i < CHUNK_SIZE * (CHUNKS_PER_FRAME - 1); ++i) {
                this.tiles[i] = this.tiles[i + CHUNK_SIZE];
            }
            if (this.chunks > CHUNKS_PER_GAME - 1) {
                for (; i < CHUNK_SIZE * CHUNKS_PER_FRAME; ++i) {
                    this.tiles[i] = BLOCK_GROUND;
                }
            } else {
                for (i += 2; i < CHUNK_SIZE * CHUNKS_PER_FRAME - 2; ++i) {
                    this.tiles[i] =
                        Math.random() > 0.2 ? BLOCK_GROUND : BLOCK_GROUND_SPIKE;
                }
                for (
                    i = CHUNK_SIZE * (CHUNKS_PER_FRAME - 1);
                    i < CHUNK_SIZE * CHUNKS_PER_FRAME;
                    i += 5
                ) {
                    this.tiles[i + 3] = BLOCK_GROUND;
                    this.tiles[i + 4] = BLOCK_GROUND;
                }
            }
            ++this.chunks;
        }

        updateAnimations() {
            if (this.jumpAnimationProgress < 1) {
                const nextT =
                    this.jumpAnimationProgress +
                    this.deltaTime / JUMP_ANIMATION_DURATION;
                this.jumpAnimationProgress = Math.min(nextT, 1);
                this.jumpDistance =
                    (-4 * Math.pow(this.jumpAnimationProgress - 0.5, 2) + 1) *
                    JUMP_DISTANCE;
            }
            if (this.moveAnimationProgress < 1) {
                this.moveAnimationProgress =
                    this.moveAnimationProgress +
                    this.deltaTime / MOVE_ANIMATION_DURATION;
                this.moveDistance = this.moveAnimationProgress * MOVE_DISTANCE;
            }
            if (this.moveAnimationProgress >= 1) {
                this.moveAnimationProgress = 0;
            }
        }

        drawPlayer() {
            const ctx = this.ctx;
            const offset = PLAYER_SIZE / 4;
            ctx.resetTransform();
            ctx.translate(
                this.pos[0] - PLAYER_SIZE / 2,
                this.pos[1] - PLAYER_SIZE / 2 - this.jumpDistance,
            );
            ctx.fillStyle = "deeppink";
            ctx.rotate((this.jumpAnimationProgress * Math.PI) / 2);
            ctx.fillRect(
                -PLAYER_SIZE / 2,
                -PLAYER_SIZE / 2,
                PLAYER_SIZE,
                PLAYER_SIZE,
            );
            ctx.fillStyle = "#222";
            ctx.fillRect(
                -PLAYER_SIZE / 2 + offset,
                -PLAYER_SIZE / 2 + offset,
                PLAYER_SIZE - offset * 2,
                PLAYER_SIZE - offset * 2,
            );
        }

        drawTiles() {
            const ctx = this.ctx;
            for (let i = 0; i < this.tiles.length; ++i) {
                const tile = this.tiles[i];
                switch (tile) {
                    case BLOCK_GROUND_SPIKE:
                        ctx.resetTransform();
                        ctx.translate(
                            this.pos[0] -
                                PLAYER_SIZE * 6 +
                                i * PLAYER_SIZE -
                                this.moveDistance,
                            this.pos[1] - PLAYER_SIZE,
                        );
                        ctx.fillStyle = "aquamarine";
                        ctx.beginPath();
                        ctx.moveTo(0, PLAYER_SIZE);
                        ctx.lineTo(PLAYER_SIZE / 2, PLAYER_SIZE * 0.1);
                        ctx.lineTo(PLAYER_SIZE, PLAYER_SIZE);
                        ctx.closePath();
                        ctx.fill();
                    case BLOCK_GROUND:
                        ctx.resetTransform();
                        ctx.translate(
                            this.pos[0] -
                                PLAYER_SIZE * 6 +
                                i * PLAYER_SIZE -
                                this.moveDistance,
                            this.pos[1],
                        );
                        ctx.fillStyle = "gray";
                        ctx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE / 8);
                        break;

                    default:
                        break;
                }
            }
        }

        drawStartGame() {
            const ctx = this.ctx;
            ctx.resetTransform();
            ctx.translate(this.canvas.width / 2, this.canvas.height / 4);
            ctx.fillStyle = "gainsboro";
            ctx.textAlign = "center";
            ctx.fillText("Esc = Start game", 0, 0);
            ctx.translate(0, FONT_SIZE + 4);
            ctx.fillText("Space = Jump", 0, 0);
        }

        drawCompleteGame() {
            const ctx = this.ctx;
            ctx.resetTransform();
            ctx.font = `${FONT_SIZE}px sans-serif`;
            ctx.textAlign = "start";
            ctx.fillStyle = "lime";
            ctx.fillText("Nice!", 10, FONT_SIZE + 10);
            ctx.fillText("R = Play again", 10, 2 * FONT_SIZE + 10 + 4);
        }

        drawFailGame() {
            const ctx = this.ctx;
            ctx.resetTransform();
            ctx.font = `${FONT_SIZE}px sans-serif`;
            ctx.textAlign = "start";
            ctx.fillStyle = "tomato";
            ctx.fillText("Bonk!", 10, FONT_SIZE + 10);
            ctx.fillText("R = Restart", 10, 2 * FONT_SIZE + 10 + 4);
        }
    },
);
