import { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Alert, AlertTitle, IconButton, Snackbar } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import { removeNotification } from '../../redux/actions';
import { Box } from '@mui/system';

const mapStateToProps = state => {
    return {
        user: state.user,
        terms: state.terms,
        notifications: state.notifications
    };
};

function Notificator({ notifications}) {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const dispatch = useDispatch();
  useEffect(() => {
    if (JSON.stringify(notifications) !== JSON.stringify(activeNotifications)) {
      setActiveNotifications(notifications);
    }
  }, [notifications]);

  const handleClose = (index) => {
    setActiveNotifications(prev => prev.filter((_, i) => i !== index));
    dispatch(removeNotification(index));
  };

  useEffect(() => {
    if (activeNotifications.length > 0) {
      if (activeNotifications[0]?.silent === true) {
        try {
          const n = activeNotifications[0];
          const msg = typeof n?.msg === 'string' ? n.msg : 'Silent notification';
          console.warn(msg, n);
        } catch (_) { }
        setActiveNotifications(prev => prev.slice(1));
        dispatch(removeNotification());
        return;
      }

      const timer = setTimeout(() => {
        setActiveNotifications(prev => prev.slice(1));
        dispatch(removeNotification());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeNotifications, dispatch]);

    // Función helper para convertir el mensaje a un ReactNode válido
  const getNotificationMessage = (msg) => {
    if (msg === null || msg === undefined) {
      return '';
    }
    
    // Si es un objeto, intentar extraer description o convertir a string
    if (typeof msg === 'object') {
      if (msg.description) {
        return msg.description;
      }
      if (msg.message) {
        return msg.message;
      }
      // Si no tiene propiedades conocidas, convertir a string JSON
      try {
        return JSON.stringify(msg);
      } catch (e) {
        return String(msg);
      }
    }
    
    // Si es un array, unir los elementos
    if (Array.isArray(msg)) {
      return msg.join(', ');
    }
    
    // Si ya es un string o número, devolverlo tal cual
    return String(msg);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
        '&:hover > *': {
          transform: 'translateY(0) scale(1)',
          opacity: 1,
        },
      }}
    >
      {activeNotifications.filter((n) => n?.silent !== true).slice(0,3).map((notification, index) => (
        <Snackbar
          key={index}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={true}
          sx={{
            position: 'static',
            mb: 1,
            transition: 'all 0.3s ease',
            transform: `translateY(${index * 20}px) scale(${1 - index * 0.08})`,
            opacity: 1 - index * 0.2,
            '&:hover': {
              transform: 'translateY(0) scale(1)',
              opacity: 1,
            },
          }}
        >
          <Alert
            severity={notification.status === 'ok' ? 'success' : (notification.status === 'error' || notification.status === 'err') ? 'error' : 'warning'}
            onClose={() => handleClose(index)}
            sx={{ width: '100%', maxWidth: 350 }}
          >
            <AlertTitle>{notification.status === 'ok' ? 'Exitoso' : (notification.status === 'error' || notification.status === 'err') ? 'Error' : 'Advertencia'}</AlertTitle>
            {getNotificationMessage(notification.msg)}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}

export default connect(mapStateToProps, null)(Notificator);