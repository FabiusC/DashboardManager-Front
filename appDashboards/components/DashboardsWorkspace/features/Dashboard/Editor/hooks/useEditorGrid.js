import { useState, useCallback } from "react"
import { handleAddPanelLocal, handleRemovePanelLocal } from "../utils/editorActions"

export const useEditorGrid = ({
  panels,
  setDashboard,
  setLayout,
  setPanels,
  dispatch,
  registerPendingAdd,
  registerPendingRemove,
  setChangedItems,
}) => {

  const [isAddingPanel, setIsAddingPanel] = useState(false)

  const onLayoutChange = useCallback((changed) => {
    if (!changed?.length) return
    setLayout((prev) => mergeLayout(prev, changed))
    setChangedItems((prev) => mergeChanged(prev, changed))
  }, [setLayout, setChangedItems])

  const onDropPanel = useCallback((panelId, position) => {
    if (!panelId) return
    const exists = panels.some((p) => String(p.id) === String(panelId))
    if (exists) return
    handleAddPanelLocal(panelId, position, {
      setPanels,
      setLayout,
      setDashboard,
      registerPendingAdd,
      setIsAddingPanel,
      dispatch,
    })
  }, [panels, setPanels, setLayout, setDashboard, registerPendingAdd, dispatch])

  // Deleting is also local (reversible until "Guardar" persists it).
  const handleDeletePanel = useCallback((panelId) => {
    handleRemovePanelLocal(panelId, {
      setPanels,
      setLayout,
      setDashboard,
      registerPendingRemove,
    })
  }, [setPanels, setLayout, setDashboard, registerPendingRemove])

  return {
    onDropPanel,
    onLayoutChange,
    handleDeletePanel,
    isAddingPanel
  }
}

/** Upsert panel positions by id. Optionally keep extra fields (e.g. page). */
const upsertById = (items, updates, preserveExtras = false) => {
  const byId = new Map(items.map((item) => [String(item.id), item]))

  for (const { id, x, y, w, h } of updates) {
    const panelId = String(id)
    const previous = preserveExtras ? byId.get(panelId) ?? { id: panelId, page: 0 } : { id: panelId }
    byId.set(panelId, { ...previous, id: panelId, x, y, w, h })
  }

  return [...byId.values()]
}

const mergeChanged = (pending, updates) => upsertById(pending, updates)
const mergeLayout = (layout, updates) => upsertById(layout, updates, true)