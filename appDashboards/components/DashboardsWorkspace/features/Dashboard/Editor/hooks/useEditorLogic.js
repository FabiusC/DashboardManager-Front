import { useState } from "react"
import { useDispatch } from "react-redux"
import { useEditorSaving } from "./useEditorSaving"
import { useEditorGrid } from "./useEditorGrid"
import { useEditorTabs } from "./useEditorTabs"

export const useEditorLogic = ({
  dashboard,
  panels,
  layout,
  setDashboard,
  setPanels,
  setLayout,
  user,
  id,
  previewElementRef,
  setPreviewCapturing,
}) => {
  const dispatch = useDispatch()

    // Create-panel modal state (not owned by the specialized hooks)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Saving and unsaved-changes hook
  const saving = useEditorSaving({
    dashboard,
    setDashboard,
    setLayout,
    layout,
    user,
    id,
    previewElementRef,
    setPreviewCapturing,
    dispatch
  })

  // Grid hook (uses helpers from the saving hook)
  const grid = useEditorGrid({
    panels,
    setDashboard,
    setLayout,
    setPanels,
    dispatch,
    registerPendingAdd: saving.registerPendingAdd,
    registerPendingRemove: saving.registerPendingRemove,
    setChangedItems: saving.setChangedItems
  })

  // Side menu tabs hook
  const tabs = useEditorTabs({
    dashboard,
    setDashboard,
    user
  })

  return {
    // Side menu tabs
    sideTabs: tabs.tabs,

    // Toolbar actions
    actions: saving.actions,

    // Unsaved-changes modal props
    unsavedModalProps: saving.modalProps,

    // Grid handlers
    onDropPanel: grid.onDropPanel,
    onLayoutChange: grid.onLayoutChange,
    handleDeletePanel: grid.handleDeletePanel,

    // Create-panel modal state
    isCreateModalOpen,
    setIsCreateModalOpen,

    // Internal state (handy for debugging or extra logic)
    changedItems: saving.changedItems,
    isAddingPanel: grid.isAddingPanel,
    isSaving: saving.isSaving,
  }
}
