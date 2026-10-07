import { useCallback, useEffect, useRef, useState } from "react";
import { pushNotification } from "@redux/actions";
import { uploadPanelPreview } from "@services/previewService";

const PREVIEW_DEBOUNCE = 750;

const isAbortError = (error, signal) =>
    signal?.aborted ||
    error?.code === "ERR_CANCELED" ||
    error?.name === "AbortError" ||
    error?.name === "CanceledError";

export const usePanelPreview = ({
    panelId,
    elementRef,
    elementId,
    token,
    fixedSize = true,
    dispatch,
} = {}) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewRequest, setPreviewRequest] = useState(0);
    const requestPreview = useCallback(
        () => setPreviewRequest((request) => request + 1),
        []
    );
    const previousPanelId = useRef(panelId);
    const lastHandledRequest = useRef(previewRequest);

    useEffect(() => {
        if (previousPanelId.current !== panelId) {
            previousPanelId.current = panelId;
            lastHandledRequest.current = previewRequest;
            setIsCapturing(false);
            return undefined;
        }

        if (
            panelId === undefined ||
            panelId === null ||
            previewRequest <= lastHandledRequest.current
        ) {
            return undefined;
        }

        lastHandledRequest.current = previewRequest;
        let active = true;
        const controller = new AbortController();

        const timeoutId = setTimeout(async () => {
            if (!active) return;
            setIsCapturing(true);

            try {
                await uploadPanelPreview({
                    panelId,
                    element: elementRef?.current,
                    elementId,
                    token,
                    signal: controller.signal,
                    fixedSize,
                });
            } catch (error) {
                if (!isAbortError(error, controller.signal)) {
                    dispatch?.(pushNotification({
                        msg: "No se pudo actualizar el preview del panel.",
                        status: "warn",
                    }));
                }
            } finally {
                if (active) setIsCapturing(false);
            }
        }, PREVIEW_DEBOUNCE);

        return () => {
            active = false;
            clearTimeout(timeoutId);
            controller.abort();
            setIsCapturing(false);
        };
    }, [
        dispatch,
        elementId,
        elementRef,
        fixedSize,
        panelId,
        previewRequest,
        token,
    ]);

    return { isCapturing, requestPreview };
};
