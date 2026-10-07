export const getResolvedColors = (panel, qParams) => {
    const colorStrategyObj = panel?.colorStrategy ?? qParams?.colorStrategy;
    const defaultColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    
    if (!colorStrategyObj) return defaultColors;

    const strategyType = colorStrategyObj.strategy_type || 'preset';
    const paletteKey = `${strategyType}_palette`;
    const activePalette = colorStrategyObj[paletteKey];

    if (activePalette && Array.isArray(activePalette.colors) && activePalette.colors.length > 0) {
      return activePalette.colors;
    }

    return defaultColors;
}
