import { Box } from "@mui/material";
import ToolbarButton from './ToolbarButton';

const toolbarContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 0.3,
  paddingLeft: 1,
  paddingRight: 2
};

function ActionsToolbar({ actions }) {

  return (
    <Box >
      <Box sx={toolbarContainerStyles}>
        {Object.entries(actions).map(([key, action]) => (
          <ToolbarButton
            key={key}
            actionKey={key}
            action={action}
            onClick={() => action.action()}
          />
        ))}
      </Box>
    </Box>
  );
}

export default ActionsToolbar;

