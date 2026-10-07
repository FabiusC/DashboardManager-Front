export function getAlignmentValue(align){
    switch (align) {
      case "left": return "flex-start";
      case "right": return "flex-end";
      case "center": return "center";
      case "space-between": return "space-between";
      default:
        return "center";
    }
  };
  
export function getTextAlignValue(align) {
    switch (align) {
      case "left": return "left";
      case "right": return "right";
      case "center": 
        return "center";
      case "space-between":
        return "space-between";
      default:
        return "center";
    }
  };