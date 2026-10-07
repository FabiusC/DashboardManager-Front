import { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Alert, AlertTitle } from '@mui/material'
import { removeNotification } from '../../redux/actions';

const mapStateToProps = state => {
    return {
        user: state.user,
        terms: state.terms,
        notifications: state.notifications
    };
};

function NotificatorLogin(props) {
    const [showingNotification, setShowingNotification] = useState(undefined);
    const dispatch = useDispatch();
    useEffect(() => {
        if (props.notifications && props.notifications?.length && props.notifications.length > 0) {
            const notification_i = props.notifications[0];
            if (notification_i.hasOwnProperty("msg") && notification_i.hasOwnProperty("status")) {
                setShowingNotification(notification_i);
            }
        }
    }, [props.notifications])

    useEffect(() => {
        if (showingNotification !== undefined) {
            const timer = setTimeout(() => {
                setShowingNotification(undefined);
                dispatch(removeNotification());
            }, 2500)
            return () => clearTimeout(timer);
        }
    }, [showingNotification])

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

    if (showingNotification) {
        return (
            <div className="fullWidht fullHeight pad_t_20">
                <Alert severity={showingNotification.status === "ok" ? "success" : (showingNotification.status === 'error' || showingNotification.status === 'err') ? 'error' : 'warning'}>
                    <AlertTitle>{showingNotification.status === "ok" ? 'Exitoso' : (showingNotification.status === 'error' || showingNotification.status === 'err') ? 'Error' : 'Advertencia'}</AlertTitle>
                    {getNotificationMessage(showingNotification.msg)}
                </Alert>
            </div>
        )
    } else {
        return (
            <div style={{ display: "none" }}></div>
        )
    }
}

export default connect(mapStateToProps, null)(NotificatorLogin);