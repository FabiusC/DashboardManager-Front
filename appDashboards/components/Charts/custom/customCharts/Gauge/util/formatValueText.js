// Helper to format the number
export function formatValue(val) {
    if (val === null || val === undefined) return "";
    // Enforce 2 decimal places, then replace the dot with a comma
    return Number(val).toFixed(2).replace(".", ",");
  };