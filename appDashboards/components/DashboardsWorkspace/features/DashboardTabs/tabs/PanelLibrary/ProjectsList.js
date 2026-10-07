import {
  Typography,
  Box,
  Card,
  CardHeader,
  Tooltip,
  Skeleton,
  InputBase,
  IconButton,
  Pagination,
  alpha,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import { FolderCopyRounded } from "@mui/icons-material"
import { getContrastColor } from "@components/Recursive/mui_styled_components"

const ProjectsList = ({ projects, isLoading, onProjectClick, searchTerm, onSearchChange, currentPage, totalPages, onPageChange }) => {
    return (
      <Box>
        <Box
          component="form"
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: "1px solid #e2e8f0",
            borderRadius: '10px',
            height: '30px',
            width: '98%',
            mb: 1,
          }}
        >
          <InputBase
            sx={{
              flex: 1,
              fontSize: '14px',
              height: '30px',
              pl: 1,
              'input': {
                '&::placeholder': {
                  color: theme => theme.palette.primary.light,
                }
              }
            }}
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={onSearchChange}
          />
          <IconButton type="button" sx={{ p: '5px', '&:hover': { backgroundColor: '#fff' } }} aria-label="search">
            <SearchIcon sx={{ fontSize: "18px", color: theme => theme.palette.primary.main, '&:hover': { color: theme => theme.palette.primary.dark } }} />
          </IconButton>
        </Box>
        
        {isLoading ? (
          <Box sx={{ mt: 1 }}>
            {[1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                height={48}
                sx={{ 
                  borderRadius: 1, 
                  mb: 1.5,
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
                }}
              />
            ))}
          </Box>
        ) : projects.length > 0 ? (
          <Box sx={{ minHeight: "400px", overflowY: "auto" }}>
          {projects.map((project) => (
            <Card key={project.id} sx={{ mt: 1.5, overflow: "hidden", }}>
              <CardHeader
                onClick={() => onProjectClick(project)}
                sx={{
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.2),
                  color: theme => getContrastColor(alpha(theme.palette.primary.main, 0.2)),
                  cursor: "pointer",
                  "&:hover": { bgcolor: theme => alpha(theme.palette.primary.main, 0.3) },
                  p: 1,
                  "& .MuiCardHeader-avatar": {
                    marginRight: "4px",
                  },
                }}
                avatar={<FolderCopyRounded sx={{ fontSize: "18px", color: theme => theme.palette.primary.main }} />}
                title={
                  <Tooltip title={project.name} arrow placement="right">
                    <Typography variant="body1" sx={{ fontSize: "13px", fontWeight: "medium" }}>
                      {project.name.length > 13 ? project.name.slice(0, 13) + "..." : project.name}
                    </Typography>
                  </Tooltip>
                }
                disableTypography
              />
            </Card>
          ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", color: "text.secondary", mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "12px", lineHeight: 1.2 }}>
              {"No se encontraron proyectos que coincidan con tu búsqueda."}
            </Typography>
          </Box>
        )}
        
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={onPageChange}
              size="small"
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '12px',
                  minWidth: '28px',
                  height: '28px',
                }
              }}
            />
          </Box>
        )}
      </Box>
    )
  }

export default ProjectsList