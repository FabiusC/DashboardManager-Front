import { CustomSelect } from "@creangel/ifindit-ui";
import { Box } from "@mui/material";

const FiltersTrash = ({ productTypeSelectState }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', padding: 1 }}>
      <CustomSelect state={productTypeSelectState.state} />
    </Box>
  )
}

export default FiltersTrash;