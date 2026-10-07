import { useState, useEffect } from 'react';
import { connect } from "react-redux";
import DashboardFiltersView from './components/DashboardFiltersView';
import FilterFloatingButton from './components/FilterFloatingButton';
import { useDashboardFilters } from './hooks/useDashboardFilters';

const DashboardFilters = ({ position = "top", filtersState = {}, dispatch, isReadOnly = false }) => {
  const [filterShow, setFilterShow] = useState(false);
  const { activeGroups, hasActiveFilters, activeRulesCount, rootOperator, handleDeleteGroup, handleDeleteRule, handleClearAll } = useDashboardFilters(
    filtersState,
    dispatch
  );

  // Cerrar el popover cuando no hay filtros activos
  useEffect(() => {
    if (!hasActiveFilters && filterShow) {
      setFilterShow(false);
    }
  }, [hasActiveFilters, filterShow]);

  // Si no hay filtros activos o no está en modo readonly, no mostrar nada
  if (!hasActiveFilters || !isReadOnly) {
    return null;
  }

  // Si el panel está oculto, mostrar solo el botón flotante
  if (!filterShow) {
    return (
      <FilterFloatingButton
        activeRulesCount={activeRulesCount}
        onClick={() => setFilterShow(true)}
      />
    );
  }

  // Si el panel está visible, mostrar el panel de filtros
  return (
    <DashboardFiltersView
      activeGroups={activeGroups}
      rootOperator={rootOperator}
      onDeleteGroup={handleDeleteGroup}
      onDeleteRule={handleDeleteRule}
      onClearAll={handleClearAll}
      onClose={() => setFilterShow(false)}
      position={position}
    />
  );
};

const mapStateToProps = (state) => ({
  user: state.user,
  filtersState: state.filters || {},
});

export default connect(mapStateToProps)(DashboardFilters);

