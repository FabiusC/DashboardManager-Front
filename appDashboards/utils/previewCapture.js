const PREVIEW_READY_TIMEOUT = 15_000;
const IMAGE_READY_TIMEOUT = 5_000;

const flattenLeafletTransforms = (clonedDoc) => {
    const clonedWindow = clonedDoc.defaultView;
    if (!clonedWindow) return;

    clonedDoc
        .querySelectorAll('.leaflet-container [style*="transform"]')
        .forEach((element) => {
            const { transform } = clonedWindow.getComputedStyle(element);
            if (!transform || transform === "none") return;

            const matrix = new DOMMatrixReadOnly(transform);
            element.style.left = `${matrix.m41}px`;
            element.style.top = `${matrix.m42}px`;
            element.style.transformOrigin = "0 0";
            element.style.transform =
                matrix.a === 1 && matrix.d === 1
                    ? "none"
                    : `scale(${matrix.a}, ${matrix.d})`;
        });
};

const waitForNextPaint = (
    view = typeof window !== "undefined" ? window : null
) =>
    new Promise((resolve) => {
        const requestFrame = view?.requestAnimationFrame;
        if (typeof requestFrame !== "function") {
            setTimeout(resolve, 0);
            return;
        }

        requestFrame.call(view, () => {
            requestFrame.call(view, resolve);
        });
    });

const isInsideCaptureHeight = (node, root, height) => {
    if (!Number.isFinite(height)) return true;

    const rootRect = root.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const captureBottom = rootRect.top + height;

    return nodeRect.height === 0
        ? nodeRect.top >= rootRect.top && nodeRect.top <= captureBottom
        : nodeRect.bottom > rootRect.top && nodeRect.top < captureBottom;
};

const waitForReady = async (element, height) => {
    const ownerWindow = element.ownerDocument?.defaultView || window;
    const deadline = Date.now() + PREVIEW_READY_TIMEOUT;

    while (true) {
        const pendingNode = Array.from(
            element.querySelectorAll(
                "[data-preview-state='LOADING'], " +
                "[data-preview-state='WAITING_PRE_FILTER'], " +
                "[data-preview-loading='true']"
            )
        ).find((node) => isInsideCaptureHeight(node, element, height));

        if (!pendingNode) {
            await waitForNextPaint(ownerWindow);
            return;
        }

        if (Date.now() >= deadline) {
            throw new Error("The preview element did not finish rendering before the timeout.");
        }

        await waitForNextPaint(ownerWindow);
    }
};

const waitForImages = async (element, height) => {
    const images = Array.from(element.querySelectorAll("img")).filter((image) =>
        isInsideCaptureHeight(image, element, height)
    );

    await Promise.all(
        images.map((image) => {
            if (image.complete) return Promise.resolve();

            return new Promise((resolve) => {
                let timeoutId;
                const finish = () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    image.removeEventListener("load", finish);
                    image.removeEventListener("error", finish);
                    resolve();
                };

                image.addEventListener("load", finish, { once: true });
                image.addEventListener("error", finish, { once: true });
                timeoutId = setTimeout(finish, IMAGE_READY_TIMEOUT);
            });
        })
    );
};

const buildNodeFilter = ({ excludedIds = [], excludedSelectors = [] } = {}) => {
    const ids = new Set(excludedIds);

    return (node) => {
        if (!node || typeof node.matches !== "function") return true;
        if (ids.has(node.id)) return false;
        return !excludedSelectors.some((selector) => node.matches(selector));
    };
};

const canvasToBlob = (canvas) =>
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }

            reject(new Error("The preview canvas could not be converted to an image."));
        }, "image/png");
    });

const cropCanvasToHeight = (canvas, height, scale, ownerDocument) => {
    if (!Number.isFinite(height) || !Number.isFinite(scale)) return canvas;

    const targetHeight = Math.min(
        canvas.height,
        Math.max(1, Math.ceil(height * scale))
    );
    if (targetHeight >= canvas.height) return canvas;

    const croppedCanvas = ownerDocument.createElement("canvas");
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = targetHeight;
    const context = croppedCanvas.getContext("2d");
    if (!context) return canvas;

    context.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        targetHeight,
        0,
        0,
        croppedCanvas.width,
        croppedCanvas.height
    );

    return croppedCanvas;
};

export const captureElementAsBlob = async ({
    element,
    width,
    height,
    windowWidth,
    windowHeight,
    excludedIds,
    excludedSelectors,
    backgroundColor = "#ffffff",
} = {}) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("Image capture is only available in the browser.");
    }

    if (!element || typeof element.querySelectorAll !== "function") {
        throw new TypeError("A valid DOM element is required for image capture.");
    }

    const ownerDocument = element.ownerDocument || document;
    const ownerWindow = ownerDocument.defaultView || window;
    const normalizedWidth = Number.isFinite(width)
        ? Math.max(1, Math.floor(width))
        : undefined;
    const normalizedHeight = Number.isFinite(height)
        ? Math.max(1, Math.floor(height))
        : undefined;
    const normalizedWindowWidth = Number.isFinite(windowWidth)
        ? Math.max(1, Math.floor(windowWidth))
        : undefined;
    const normalizedWindowHeight = Number.isFinite(windowHeight)
        ? Math.max(1, Math.floor(windowHeight))
        : undefined;

    await waitForReady(element, normalizedHeight);

    if (ownerDocument.fonts?.ready) {
        await ownerDocument.fonts.ready;
    }
    await waitForImages(element, normalizedHeight);
    await waitForNextPaint(ownerWindow);

    const elementRect = element.getBoundingClientRect();
    const contentWidth = Math.max(element.scrollWidth, elementRect.width);
    const contentHeight = Math.max(element.scrollHeight, elementRect.height);
    const html2CanvasModule = await import("html2canvas");
    const html2canvas = html2CanvasModule.default || html2CanvasModule;
    const shouldIncludeNode = buildNodeFilter({ excludedIds, excludedSelectors });

    const options = {
        backgroundColor,
        logging: false,
        scale: normalizedWidth || normalizedHeight ? 2 : 1,
        useCORS: true,
        ignoreElements: (node) => !shouldIncludeNode(node),
        onclone: (clonedDocument, clonedReferenceElement) => {
            flattenLeafletTransforms(clonedDocument);

            clonedDocument.querySelectorAll(".dashboard-grid-root").forEach((gridRoot) => {
                gridRoot.classList.remove(
                    "dashboard-grid-root--drag-ghost",
                    "dashboard-grid-root--dragging",
                    "dashboard-grid-root--resizing"
                );
                gridRoot.style.backgroundImage = "none";
            });

            const clonedElement = element.id
                ? clonedDocument.getElementById(element.id)
                : clonedReferenceElement;
            if (!clonedElement) return;

            if (normalizedWidth) {
                clonedElement.style.width = `${normalizedWidth}px`;
                clonedElement.style.minWidth = `${normalizedWidth}px`;
                clonedElement.style.maxWidth = `${normalizedWidth}px`;
            }

            if (normalizedHeight) {
                clonedElement.style.height = `${normalizedHeight}px`;
                clonedElement.style.minHeight = `${normalizedHeight}px`;
                clonedElement.style.maxHeight = `${normalizedHeight}px`;
                clonedElement.style.overflow = "hidden";
            }

        },
    };

    if (normalizedWidth || normalizedHeight) {
        options.width = normalizedWidth || Math.ceil(contentWidth);
        options.height = normalizedHeight || Math.ceil(contentHeight);
        options.windowWidth =
            normalizedWindowWidth || normalizedWidth || Math.ceil(contentWidth);
        options.windowHeight =
            normalizedWindowHeight || Math.ceil(contentHeight);
    }

    const canvas = await html2canvas(element, options);
    const outputCanvas = cropCanvasToHeight(
        canvas,
        normalizedHeight,
        options.scale,
        ownerDocument
    );

    return canvasToBlob(outputCanvas);
};
