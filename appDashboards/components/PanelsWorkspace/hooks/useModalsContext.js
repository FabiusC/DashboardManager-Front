import { useContext, useCallback, useMemo } from 'react';
import { ModalsContext } from '../context/ModalsContext';

export default function useModalsContext() {
  const { state, openModal, closeModal } = useContext(ModalsContext);

  const openCreateModal = useCallback(() => openModal('openCreateModal'), [openModal]);
  const closeCreateModal = useCallback(() => closeModal('openCreateModal'), [closeModal]);

  const openDeleteFieldModal = useCallback(() => openModal('openDeleteFieldModal'), [openModal]);
  const closeDeleteFieldModal = useCallback(() => closeModal('openDeleteFieldModal'), [closeModal]);

  const openCreateFieldModal = useCallback(() => openModal('openCreateFieldModal'), [openModal]);
  const closeCreateFieldModal = useCallback(() => closeModal('openCreateFieldModal'), [closeModal]);

  const modalState = useMemo(() => ({
    isCreateModalOpen: state.openCreateModal,
    isDeleteFieldModalOpen: state.openDeleteFieldModal,
    isCreateFieldModalOpen: state.openCreateFieldModal,
  }), [state.openCreateModal, state.openDeleteFieldModal, state.openCreateFieldModal]);

  const modalActions = useMemo(() => ({
    openCreateModal,
    closeCreateModal,
    openDeleteFieldModal,
    closeDeleteFieldModal,
    openCreateFieldModal,
    closeCreateFieldModal,
    openModal,
    closeModal,
  }), [openCreateModal, closeCreateModal, openDeleteFieldModal, closeDeleteFieldModal, openCreateFieldModal, closeCreateFieldModal, openModal, closeModal]);

  return {
    ...modalState,
    ...modalActions,
  };
}
