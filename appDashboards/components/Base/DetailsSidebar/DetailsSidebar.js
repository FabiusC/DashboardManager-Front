"use client"
import React from 'react';
import { Box, Typography, Chip, IconButton, Divider } from '@mui/material';
import { Close as CloseIcon, CalendarToday, Public, Lock, Add, AccountTree as AccountTreeIcon } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/es';
moment.locale('es');

/**
 * Componente reutilizable para mostrar detalles de una entidad en un sidebar
 * @param {Object} props
 * @param {Object} props.item - La entidad seleccionada (proyecto, carpeta, producto, etc.)
 * @param {Object} props.chipConfig - Configuración del chip de tipo
 * @param {string} props.chipConfig.label - Etiqueta del chip
 * @param {string} props.chipConfig.color - Color de fondo del chip
 * @param {React.ReactNode} props.chipConfig.icon - Ícono del chip
 * @param {React.ReactNode} props.chipConfig.secondaryChip - Chip secundario opcional (ej: Solo Lectura)
 * @param {Function} props.onClose - Función para cerrar el sidebar
 * @param {Array} props.actions - Array de botones de acción
 * @param {Array} props.customFields - Campos personalizados adicionales para mostrar
 * @param {boolean} props.showVisibility - Mostrar campo de visibilidad (por defecto true)
 * @param {boolean} props.showDates - Mostrar fechas de creación y modificación (por defecto true)
 * @param {number} props.itemCount - Cantidad de elementos (ej: proyectos) para el estado vacío
 * @param {Function} props.onCreateClick - Función para crear un nuevo elemento (ej: abrir modal de creación)
 * @param {string} props.entityName - Nombre de la entidad para personalizar el texto (ej: "Proyectos")
 */
const DetailsSidebar = ({
  item,
  chipConfig,
  onClose,
  actions = [],
  customFields = [],
  showVisibility = true,
  showDates = true,
  itemCount = 0,
  onCreateClick,
  enableCreateButton = false,
  entityName = 'Elementos',
}) => {
  if (!item) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: 3,
          py: 3,
          backgroundColor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: '1.125rem',
              lineHeight: 1.3,
              color: 'text.primary',
            }}
          >
            Mis {entityName}
          </Typography>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Item Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountTreeIcon
              sx={{
                fontSize: 24,
                color: 'primary.main',
              }}
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: 'text.primary',
              }}
            >
              {itemCount} {entityName}{itemCount === 1 ? '' : 's'}
            </Typography>
          </Box>

          {/* Info Text for Possible Actions */}
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'text.secondary',
                mb: 1,
              }}
            >
              Acciones Disponibles
            </Typography>
            <Box
              component="ul"
              sx={{
                pl: 2,
                m: 0,
                listStyleType: 'disc',
                '& li': {
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                },
              }}
            >
               <li>
                 <Typography variant="body2" sx={{ display: 'inline' }}>
                   Selecciona un {entityName.toLowerCase()} para ver sus detalles.
                 </Typography>
               </li>
               <li>
                 <Typography variant="body2" sx={{ display: 'inline' }}>
                   Ingresa a {entityName.toLowerCase()} disponibles haciendo doble clic en el nombre.
                 </Typography>
               </li>
               {enableCreateButton && onCreateClick && (
                 <li>
                   <Typography variant="body2" sx={{ display: 'inline' }}>
                     Crea un nuevo {entityName.toLowerCase()} haciendo clic en el botón "Nuevo {entityName}" o "Crear Nuevo".
                   </Typography>
                 </li>
               )}
            </Box>
          </Box>

          {/* Empty State Message */}
          {itemCount === 0 && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                mt: 2,
                lineHeight: 1.65,
              }}
            >
              No hay {entityName.toLowerCase()}s creados. ¡Crea tu primer {entityName.toLowerCase()} para comenzar!
            </Typography>
          )}
        </Box>

        {/* Footer: Call-to-Action Button */}
        {enableCreateButton && onCreateClick && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              onClick={onCreateClick}
              sx={{
                py: 1.25,
                px: 2.5,
                borderRadius: 1.5,
                backgroundColor: 'primary.main',
                color: 'white',
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.01)',
                  boxShadow: 2,
                },
                '&:active': {
                  transform: 'scale(0.99)',
                },
              }}
            >
              <Add sx={{ fontSize: 18 }} />
              <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
                Crear Nuevo {entityName}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        px: 3,
        py: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{
            fontWeight: 500,
            fontSize: '1.125rem',
            lineHeight: 1.3,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={chipConfig.icon}
              label={chipConfig.label}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 1.5,
                backgroundColor: chipConfig.color || '#1976d2',
                color: 'white',
                '& .MuiChip-label': { px: 1.5 },
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            {chipConfig.secondaryChip}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3.5 }}>
        {/* Descripción */}
        {item.description && (
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              lineHeight: 1.65,
              fontSize: '0.9375rem'
            }}>
              {item.description}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3.5 }} />

        {/* Detalles */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Visibilidad */}
          {showVisibility && (
            <Box>
              <Typography variant="overline" sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: 'text.secondary',
                display: 'block',
                mb: 1.25
              }}>
                Visibilidad
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                {item.is_public ? (
                  <Public sx={{ fontSize: 18, color: 'success.main' }} />
                ) : (
                  <Lock sx={{ fontSize: 18, color: 'text.secondary' }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.is_public ? 'Público' : 'Privado'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Campos personalizados */}
          {customFields.map((field, index) => (
            <Box key={index}>
              <Typography variant="overline" sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: 'text.secondary',
                display: 'block',
                mb: 1.25
              }}>
                {field.label}
              </Typography>
              {field.content}
            </Box>
          ))}

          {/* Fechas */}
          {showDates && (
            <Box>
              <Typography variant="overline" sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: 'text.secondary',
                display: 'block',
                mb: 1.25
              }}>
                Fechas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                    Creado: {item.created_at ? moment(item.created_at).format('DD/MM/YY') : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                    Modificado: {item.updated_at || item.edited_at ? moment(item.updated_at || item.edited_at).format('DD/MM/YY') : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer con botones de acción */}
      {actions.length > 0 && (
        <Box sx={{
          px: 3,
          py: 2.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}>
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.type === 'divider' ? (
                <Divider sx={{ my: 0.5 }} />
              ) : (
                <Box
                  onClick={action.onClick}
                  sx={{
                    py: action.style === 'danger' ? 1 : 1.25,
                    px: action.style === 'danger' ? 2 : 2.5,
                    borderRadius: 1.5,
                    backgroundColor: action.style === 'primary'
                      ? 'primary.main'
                      : action.style === 'danger'
                        ? 'transparent'
                        : 'action.hover',
                    color: action.style === 'primary'
                      ? 'white'
                      : action.style === 'danger'
                        ? 'error.main'
                        : 'text.primary',
                    textAlign: 'center',
                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    display: action.hidden ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    border: '1px solid',
                    borderColor: action.style === 'danger'
                      ? 'error.main'
                      : action.style === 'primary'
                        ? 'transparent'
                        : 'divider',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: action.disabled ? 0.5 : 1,
                    '&:hover': action.disabled ? {} : {
                      backgroundColor: action.style === 'primary'
                        ? 'primary.dark'
                        : action.style === 'danger'
                          ? 'error.main'
                          : 'action.selected',
                      borderColor: action.style === 'primary'
                        ? 'transparent'
                        : action.style === 'danger'
                          ? 'error.main'
                          : 'text.secondary',
                      color: action.style === 'danger' ? 'white' : undefined,
                      transform: 'scale(1.01)',
                      boxShadow: action.style === 'primary' ? 2 : undefined
                    },
                    '&:active': action.disabled ? {} : {
                      transform: 'scale(0.99)'
                    }
                  }}
                >
                  {action.icon}
                  <Typography variant="button" sx={{ fontSize: action.style === 'danger' ? '0.8125rem' : '0.875rem' }}>
                    {action.label}
                  </Typography>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DetailsSidebar;