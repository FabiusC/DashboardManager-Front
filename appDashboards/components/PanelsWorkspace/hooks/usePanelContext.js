// hooks/usePanel.js
import { useContext, useCallback, act } from "react";
import { PanelsContext } from "../context/PanelsContext";
import { getRequest } from "../../../helpers/dashboardAPI/genericRequest";

export const usePanelContext = () => {
  /* ---------- Contexto interno ---------- */
  const {
    state: { panel, setUp },
    initPanel,          // dispatchers ocultos al exterior
    setSetUp,
    setSetUpChanged,
    setPanelField,
    setDimension
  } = useContext(PanelsContext);

  /** Inicializa el panel con la data cruda del backend */
  const initializePanel = useCallback(
    (rawPanel) => {
      console.log("initializePanel", rawPanel);
      initPanel(rawPanel);
    },
    [initPanel]
  );

  /** Reemplaza toda la configuración actual del panel */
  const updateSetUp = useCallback(
    (nextSetUp) => setSetUp(nextSetUp),
    [setSetUp]
  );

  /** Guarda cambios locales antes de confirmar */
  const markSetUpChanges = useCallback(
    (changes) => setSetUpChanged(changes),
    [setSetUpChanged]
  );

  /** Cambia dimensiones (width/height) u otras props simples */
  const updateDimension = useCallback(
    (key, value) => setDimension(key, value),
    [setDimension]
  );
  const handleSetUpChangedPanel = useCallback(
    (updateComponent) => {
      // helper de deep merge
      const walkAndUpdate = (target, updates) => {
        for (const key in updates) {
          if (
            updates[key] &&
            typeof updates[key] === "object" &&
            !Array.isArray(updates[key])
          ) {
            target[key] = walkAndUpdate(target[key] || {}, updates[key]);
          } else {
            target[key] = updates[key];
          }
        }
        return target;
      };

      const base = setUp.changed || {};
      const merged = walkAndUpdate({ ...base }, updateComponent);
      setSetUpChanged(merged);
    },
    [setUp.changed, setSetUpChanged]
  );

  /** Alias práctico para width/height + sincronizar react-grid-layout */
  const setUpGeneralPanel = useCallback(
    (key, value, panelId, syncLayouts) => {
      updateDimension(key, value);
      if (syncLayouts) {
        syncLayouts("lg", (prev) =>
          prev.map((l) =>
            l.i === panelId
              ? { ...l, [key === "width" ? "w" : "h"]: value }
              : l
          )
        );
      }
    },
    [updateDimension]
  );

  /** Trae la configuración fresca de la API y la inserta en el estado */
  const refreshSetUp = useCallback(
    async ({ reduxDispatch, userID, panelId }) => {
      const info = await getRequest(
        reduxDispatch,
        userID,
        "",
        "",
        "getPanelSetUp",
        "configuración del panel",
        { panel_id: panelId }
      );
      updateSetUp(info || {});
    },
    [updateSetUp]
  );


  const handleChangeState = useCallback(
    (key, value) => {
      if (key === "width" || key === "height") {
        setDimension(key, value);
      } else {
        setPanelField({ [key]: value });
      }
    },
    [setDimension, setPanelField]
  );

  return {
    /* estado solo-lectura */
    state: {
      panel,
      setUp,
    },
    actions: {
      initializePanel,
      handleSetUpChangedPanel,
      updateSetUp,
      markSetUpChanges,
      updateDimension,
      setUpGeneralPanel,
      refreshSetUp,
      handleChangeState,
    },

  };
};
