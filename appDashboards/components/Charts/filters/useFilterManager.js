
import { useMemo } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { FilterManager } from './FilterManager';

export const useFilterManager = (panel_id) => {
  const dispatch = useDispatch();
  const store = useStore();
  
  const manager = useMemo(() => {
    return new FilterManager(dispatch, store.getState, panel_id);
  }, [dispatch, store, panel_id]);

  return manager;
};