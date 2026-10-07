import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DashboardIcon from '@mui/icons-material/Dashboard';

export const SearchHeader = ({ searchTerm, onSearchChange }) => (
  <Box sx={{ mb: 2 }}>
    <TextField
      fullWidth
      size="small"
      placeholder="Buscar dashboard..."
      value={searchTerm}
      onChange={onSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        )
      }}
    />
  </Box>
);

export const ProjectsList = ({ projects = [], selectedProject, onSelectProject }) => (
  <Paper sx={{ p: 1, height: '100%', overflowY: 'auto' }}>
    <Typography variant="subtitle2" sx={{ px: 1, py: 0.5, fontWeight: 'bold' }}>
      Proyectos
    </Typography>
    <List dense>
      {projects.map((project) => (
        <ListItem
          button
          key={project.id}
          selected={selectedProject?.id === project.id}
          onClick={() => onSelectProject(project)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AccountTreeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={project.name} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export const FoldersList = ({ folders = [], selectedFolder, onSelectFolder }) => (
  <Paper sx={{ p: 1, height: '100%', overflowY: 'auto' }}>
    <Typography variant="subtitle2" sx={{ px: 1, py: 0.5, fontWeight: 'bold' }}>
      Carpetas
    </Typography>
    <List dense>
      {folders.map((folder) => (
        <ListItem
          button
          key={folder.id}
          selected={selectedFolder?.id === folder.id}
          onClick={() => onSelectFolder(folder)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export const DashboardsList = ({ dashboards = [], searchTerm, onSelectDashboard }) => {
  const filtered = dashboards.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper sx={{ p: 1, height: '100%', overflowY: 'auto' }}>
      <Typography variant="subtitle2" sx={{ px: 1, py: 0.5, fontWeight: 'bold' }}>
        Dashboards
      </Typography>
      <List dense>
        {filtered.map((dashboard) => (
          <ListItem
            button
            key={dashboard.id}
            onClick={() => onSelectDashboard && onSelectDashboard(dashboard)}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DashboardIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={dashboard.name}
              secondary={dashboard.description}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};