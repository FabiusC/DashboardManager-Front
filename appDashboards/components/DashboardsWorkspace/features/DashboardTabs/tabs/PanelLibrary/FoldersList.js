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
import { getContrastColor } from "@components/Recursive/mui_styled_components"
import { Folder as FolderIcon } from "@mui/icons-material"

const FoldersList = ({ folders, isLoading, onFolderClick, onBackClick, currentProject, searchTerm, onSearchChange, currentPage, totalPages, onPageChange }) => {
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
          placeholder="Buscar carpetas..."
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
      ) : folders.length > 0 ? (
        <Box sx={{ minHeight: "400px", overflowY: "auto" }}>
        {folders.map((folder) => (
          <Card key={folder.id} sx={{ mt: 1.5, overflow: "hidden" }}>
            <CardHeader
              onClick={() => onFolderClick(folder)}
              sx={{
                bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                color: theme => getContrastColor(alpha(theme.palette.primary.main, 0.1)),
                cursor: "pointer",
                "&:hover": { bgcolor: theme => alpha(theme.palette.primary.main, 0.2) },
                p: 1,
                "& .MuiCardHeader-avatar": {
                  marginRight: "4px",
                },
              }}
              avatar={<FolderIcon sx={{ fontSize: "16px", color: theme => alpha(theme.palette.primary.main, 0.6) }} />}
              title={
                <Tooltip title={folder.name} arrow placement="right">
                  <Typography variant="body1" sx={{ fontSize: "13px", fontWeight: "medium" }}>
                    {folder.name.length > 13 ? folder.name.slice(0, 13) + "..." : folder.name}
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
              {"No se encontraron carpetas en este proyecto."}
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

export default FoldersList 