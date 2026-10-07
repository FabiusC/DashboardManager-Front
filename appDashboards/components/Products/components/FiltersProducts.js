import { CustomSelect } from "@creangel/ifindit-ui";
import { Box } from "@mui/material";

const FiltersProducts = ({ groupsSelectState, projectsSelectState }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', padding: 1 }}>
      <CustomSelect state={groupsSelectState.state} />
      <CustomSelect state={projectsSelectState.state} />
    </Box>
  )
}

export default FiltersProducts;