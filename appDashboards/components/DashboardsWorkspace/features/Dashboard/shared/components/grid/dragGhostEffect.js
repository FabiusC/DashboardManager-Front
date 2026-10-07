import { DDManager } from "gridstack";
/**
 * Visual drag-ghost for GridStack: styles the native placeholder and hides the
 * live panel while dragging/resizing so only the ghost is visible. Shows real
 * cell w×h on the ghost. Does not alter drag/snap/layout logic.
 *
 * Flip ENABLE_DRAG_GHOST to false to fully disable (no listeners).
 */

export const ENABLE_DRAG_GHOST = true;

const ROOT_FEATURE = "dashboard-grid-root--drag-ghost";
const ROOT_INTERACTING = "dashboard-grid-root--dragging";
const CHIP_CLASS = "dashboard-drag-ghost-chip";
const EVENTS = "dragstart dragstop resizestart resize resizestop";

function readSize(el) {
    const node = el?.gridstackNode;
    const wAttr = el?.getAttribute?.("gs-w");
    const hAttr = el?.getAttribute?.("gs-h");
    const w = Number(node?.w) > 0 ? Number(node.w) : Number(wAttr) > 0 ? Number(wAttr) : 1;
    const h = Number(node?.h) > 0 ? Number(node.h) : Number(hAttr) > 0 ? Number(hAttr) : 1;
    return { w, h };
}

function findGhostHost(el) {
    return el?.querySelector?.(".grid-stack-item-content") ?? null;
}

function ensureChip(host) {
    if (!host) return null;
    let chip = host.querySelector(`.${CHIP_CLASS}`);
    if (!chip) {
        chip = document.createElement("span");
        chip.className = CHIP_CLASS;
        chip.setAttribute("aria-hidden", "true");
        host.appendChild(chip);
    }
    return chip;
}

function updateChip(gridEl, el) {
    const chip = ensureChip(findGhostHost(el));
    if (!chip) return;
    const { w, h } = readSize(el);
    const label = `${w} × ${h}`;
    if (chip.textContent !== label) chip.textContent = label;
}

function cleanupChip(gridEl, el) {
    findGhostHost(el)?.querySelector(`.${CHIP_CLASS}`)?.remove();
    gridEl?.querySelectorAll?.(`.${CHIP_CLASS}`).forEach((chip) => chip.remove());
}

/**
 * @param {import("gridstack").GridStack} grid
 * @returns {() => void} detach
 */
export function attachDragGhostEffect(grid) {
    if (!ENABLE_DRAG_GHOST || !grid?.el) return () => {};

    const gridEl = grid.el;
    gridEl.classList.add(ROOT_FEATURE);

    const onStart = (_event, el) => {
        DDManager.pauseDrag = false;
        gridEl.classList.add(ROOT_INTERACTING);
        requestAnimationFrame(() => updateChip(gridEl, el));
    };

    let chipRaf = 0;
    const onResize = (_event, el) => {
        if (chipRaf) return;
        chipRaf = requestAnimationFrame(() => {
            chipRaf = 0;
            updateChip(gridEl, el);
        });
    };

    const onStop = (_event, el) => {
        if (chipRaf) {
            cancelAnimationFrame(chipRaf);
            chipRaf = 0;
        }
        gridEl.classList.remove(ROOT_INTERACTING);
        cleanupChip(gridEl, el);
    };

    grid.on("dragstart resizestart", onStart);
    grid.on("resize", onResize);
    grid.on("dragstop resizestop", onStop);

    return () => {
        grid.off(EVENTS);
        gridEl.classList.remove(ROOT_FEATURE, ROOT_INTERACTING);
        cleanupChip(gridEl);
    };
}
