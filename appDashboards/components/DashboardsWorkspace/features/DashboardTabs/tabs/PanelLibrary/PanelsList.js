import {
  Typography,
  Box,
  Skeleton,
  InputBase,
  IconButton,
  Pagination,
  alpha,
  useTheme,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { PanelIcon } from "./PanelLibraryComponents"

const PanelsList = ({ panels, isLoading, onBackClick, currentFolder, dashboardPanels, onBlockedDrag, searchTerm, onSearchChange, currentPage, totalPages, onPageChange }) => {
  const theme = useTheme()
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
          placeholder="Buscar paneles..."
          value={searchTerm}
          onChange={onSearchChange}
        />
        <IconButton type="button" sx={{ p: '5px', '&:hover': { backgroundColor: '#fff' } }} aria-label="search">
          <SearchIcon sx={{ fontSize: "18px", color: theme => theme.palette.primary.main, '&:hover': { color: theme => theme.palette.primary.dark } }} />
        </IconButton>
      </Box>
      
      {isLoading ? (
        <Box sx={{ mt: 1 }}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              height={40}
              sx={{ 
                borderRadius: 1, 
                mb: 1,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
              }}
            />
          ))}
        </Box>
      ) : panels.length > 0 ? (
        <Box sx={{ minHeight: "400px", overflowY: "auto" }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mt: 1,
              mb: 1.5,
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            }}
          >
            <InfoOutlinedIcon 
              sx={{ 
                fontSize: 18, 
                color: theme.palette.info.main,
                mt: 0.2,
                flexShrink: 0
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: "12px", 
                lineHeight: 1.4,
                color: theme.palette.text.secondary,
              }}
            >
              Los paneles deben estar publicados para poder ser usados en este tablero.
            </Typography>
          </Box>
          {panels.map((panel) => (
            <PanelIcon
              key={panel.id}
              panel={panel}
              isActive={dashboardPanels.some((id) => String(id) === String(panel.id))}
              onBlockedDrag={onBlockedDrag}
            />
          ))}
        </Box>
              ) : (
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                maxWidth: '90%',
              }}
            >
              <InfoOutlinedIcon 
                sx={{ 
                  fontSize: 18, 
                  color: theme.palette.warning.main,
                  mt: 0.2,
                  flexShrink: 0
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: "12px", 
                  lineHeight: 1.4,
                  color: theme.palette.text.secondary,
                  textAlign: 'left',
                  fontWeight: 500,
                }}
              >
                No se encontraron paneles en esta carpeta.
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                maxWidth: '90%',
              }}
            >
              <InfoOutlinedIcon 
                sx={{ 
                  fontSize: 18, 
                  color: theme.palette.info.main,
                  mt: 0.2,
                  flexShrink: 0
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: "12px", 
                  lineHeight: 1.4,
                  color: theme.palette.text.secondary,
                  textAlign: 'left',
                }}
              >
                Los paneles deben estar publicados para poder ser usados en este tablero.
              </Typography>
            </Box>
          </Box>
        )}
        
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
              mb: 0.5,
              flexShrink: 0,
              overflow: "visible",
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={onPageChange}
              size="small"
              color="primary"
              siblingCount={0}
              boundaryCount={1}
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  rowGap: 0.5,
                },
                '& .MuiPaginationItem-root': {
                  fontSize: '12px',
                  minWidth: '24px',
                  height: '24px',
                  margin: '0 1px',
                }
              }}
            />
          </Box>
        )}
      </Box>
    )
  }

export default PanelsList 