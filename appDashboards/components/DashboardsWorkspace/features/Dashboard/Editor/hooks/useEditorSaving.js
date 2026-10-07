import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/router"
import { SaveRounded, ArrowBack } from "@mui/icons-material"
import { handleSaveDashboardChanges } from "../utils/editorActions"
import { useFilterCleanup } from "../../../../../../hooks/useFilterCleanup"
import { uploadDashboardPreview } from "@services/previewService"
import { pushNotification } from "@redux/actions"


export const useEditorSaving = ({
  dashboard,
  setDashboard,
  setLayout,
  layout,
  user,
  id,
  previewElementRef,
  setPreviewCapturing,
  dispatch
}) => {
  const router = useRouter()
  const { clearFiltersSafely } = useFilterCleanup()

  // Unsaved-changes state: moved/resized panels, plus panels added or removed
  const [changedItems, setChangedItems] = useState([])
  const [pendingAdds, setPendingAdds] = useState([])
  const [pendingRemoves, setPendingRemoves] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingActionName, setPendingActionName] = useState("")
  const [pendingAction, setPendingAction] = useState(null)

  const hasUnsavedChanges =
    changedItems.length > 0 || pendingAdds.length > 0 || pendingRemoves.length > 0

  const registerPendingAdd = useCallback((panelId, position) => {
    const id = String(panelId)
    if (pendingRemoves.some((r) => String(r) === id)) {
      setPendingRemoves((prev) => prev.filter((r) => String(r) !== id))
      if (position) {
        setChangedItems((prev) => [
          ...prev.filter((item) => String(item.id) !== id),
          {
            id,
            x: position.x || 0,
            y: position.y || 0,
            w: position.w > 0 ? position.w : 3,
            h: position.h > 0 ? position.h : 2,
          },
        ])
      }
      return
    }
    setPendingAdds((prev) => (prev.some((a) => String(a) === id) ? prev : [...prev, id]))
  }, [pendingRemoves])


  const registerPendingRemove = useCallback((panelId) => {
    const id = String(panelId)
    setChangedItems((prev) => prev.filter((item) => String(item.id) !== id))
    if (pendingAdds.some((a) => String(a) === id)) {
      setPendingAdds((prev) => prev.filter((a) => String(a) !== id))
      return
    }
    setPendingRemoves((prev) => (prev.some((r) => String(r) === id) ? prev : [...prev, id]))
  }, [pendingAdds])

  // Update toolbar action state (loading, disabled, etc.)
  const updateActionState = useCallback((name, newState) => {
    setActions((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        state: {
          ...prev[name].state,
          ...newState,
        },
      },
    }));
  }, []);

  // Initial toolbar actions
  const [actions, setActions] = useState({
    save: {
      name: "savePanel",
      label: "Guardar",
      description: "Guardar cambios",
      icon: <SaveRounded />,
      state: { isLoading: false, isDisabled: true, isActive: false },
      action: () => { },
    },
    return: {
      name: "returnIndex",
      label: "Volver",
      description: "Regresar al índice de paneles",
      icon: <ArrowBack />,
      state: { isLoading: false, isDisabled: false, isActive: true },
      action: () => { },
    },
  })

  // Prompt before running an action if there are unsaved changes
  const checkUnsavedChanges = useCallback((actionName, actionFunction) => {
    if (hasUnsavedChanges) {
      setPendingActionName(actionName)
      setPendingAction(() => actionFunction)
      setShowUnsavedModal(true)
    } else {
      actionFunction()
    }
  }, [hasUnsavedChanges])

  // Persist ALL pending changes (adds, removes, moves/resizes) in one pass
  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) return true

    const saved = await handleSaveDashboardChanges({
      dashboard,
      layout,
      changedItems,
      pendingAdds,
      pendingRemoves,
      setDashboard,
      setLayout,
      setChangedItems,
      setPendingAdds,
      setPendingRemoves,
      dispatch,
      userToken: user[0].userID,
      updateActionState,
    })
    if (!saved) return false
    if (!setPreviewCapturing || !previewElementRef) return true

    setPreviewCapturing(true)
    try {
      await uploadDashboardPreview({
        dashboardId: dashboard.id,
        element: previewElementRef?.current,
        token: user[0].userID,
      })
    } catch (error) {
      console.error("Dashboard preview upload failed:", error)
      dispatch(pushNotification({
        msg: "El tablero se guardó, pero no se pudo actualizar su preview.",
        status: "warn",
      }))
    } finally {
      setPreviewCapturing(false)
    }

    return true
  }, [
    dashboard,
    layout,
    changedItems,
    pendingAdds,
    pendingRemoves,
    setDashboard,
    setLayout,
    dispatch,
    user,
    updateActionState,
    hasUnsavedChanges,
    previewElementRef,
    setPreviewCapturing,
  ])

  // Accept unsaved-changes modal: save first, then run the pending action
  const handleAcceptModal = useCallback(async () => {
    setIsSaving(true)
    try {
      // Save first
      const saved = await handleSave()
      if (!saved) return
      // Then run the pending action
      if (pendingAction) {
        pendingAction()
      }
      setShowUnsavedModal(false)
      setPendingAction(null)
      setPendingActionName("")
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setIsSaving(false)
    }
  }, [handleSave, pendingAction])

  // Dismiss unsaved-changes modal
  const handleCloseModal = useCallback(() => {
    setShowUnsavedModal(false)
    setPendingAction(null)
    setPendingActionName("")
  }, [])

  // Navigate back to the index
  const handleReturnIndex = useCallback(() => {
    // Always clear filters before navigating
    clearFiltersSafely()

    sessionStorage.removeItem('resourceId')
    sessionStorage.removeItem('resourceType')
    sessionStorage.removeItem('resourceName')
    if (id) {
      if (sessionStorage.getItem('projectId') && sessionStorage.getItem('folderId')) {
        router.push('/projects/folders/resources')
      } else {
        router.push('/products')
      }
    } else {
      router.push('/projects/folders/resources')
    }
  }, [id, router, clearFiltersSafely])

  // Keep toolbar actions in sync with save/return handlers
  useEffect(() => {
    setActions((prev) => ({
      ...prev,
      save: {
        ...prev.save,
        action: () => handleSave(),
        state: {
          ...prev.save.state,
          isDisabled: !hasUnsavedChanges,
        },
      },
      return: {
        ...prev.return,
        action: () => checkUnsavedChanges("regresar al índice", handleReturnIndex),
      }
    }))
  }, [handleSave, hasUnsavedChanges, checkUnsavedChanges, handleReturnIndex])

  // Unsaved-changes modal props
  const modalProps = useMemo(() => ({
    open: showUnsavedModal,
    onClose: handleCloseModal,
    onAccept: handleAcceptModal,
    actionName: pendingActionName,
    isSaving: isSaving,
  }), [showUnsavedModal, handleCloseModal, handleAcceptModal, pendingActionName, isSaving])

  return {
    // Toolbar actions
    actions,

    // Guard for actions that need a clean layout
    checkUnsavedChanges,

    // Pending layout changes
    changedItems,
    setChangedItems,

    // Pending add/remove tracking (persisted on "Guardar")
    registerPendingAdd,
    registerPendingRemove,
    hasUnsavedChanges,

    // Modal props
    modalProps,

    // Saving flag
    isSaving,
  }
}

