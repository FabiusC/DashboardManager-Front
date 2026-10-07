import * as React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Container } from '@mui/system';

/**
 * Mensajes por código de error (404 lo maneja otro componente, no se usa aquí).
 */
function getErrorContent(statusCode) {
	const map = {
		500: { title: 'Error del servidor', description: 'Algo salió mal en nuestro lado. Estamos trabajando para solucionarlo. Por favor, inténtalo de nuevo en unos momentos o vuelve al inicio.' },
		502: { title: 'Servicio no disponible', description: 'El servidor no pudo completar la solicitud. Intenta de nuevo en unos minutos.' },
		503: { title: 'Servicio en mantenimiento', description: 'Estamos realizando tareas de mantenimiento. Por favor, vuelve más tarde.' },
		403: { title: 'Acceso denegado', description: 'No tienes permiso para acceder a este recurso.' },
		401: { title: 'No autorizado', description: 'Debes iniciar sesión para acceder a esta página.' },
		408: { title: 'Tiempo de espera agotado', description: 'La solicitud tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.' },
	};
	return map[statusCode] || {
		title: 'Algo salió mal',
		description: 'Ha ocurrido un error inesperado. Por favor, vuelve al inicio o intenta recargar la página.',
	};
}

/**
 * Ilustración SVG en línea con la paleta: solo color primario.
 */
function ErrorIllustration({ primary }) {
	return (
		<Box
			component="svg"
			viewBox="0 0 280 200"
			sx={{
				width: '100%',
				maxWidth: 280,
				height: 'auto',
			}}
		>
			<ellipse cx="140" cy="170" rx="120" ry="24" fill={primary} fillOpacity="0.12" />
			<rect x="70" y="50" width="140" height="100" rx="12" fill={primary} fillOpacity="0.15" stroke={primary} strokeWidth="2" />
			<rect x="85" y="65" width="40" height="28" rx="4" fill={primary} fillOpacity="0.25" />
			<rect x="135" y="65" width="40" height="28" rx="4" fill={primary} fillOpacity="0.25" />
			<rect x="185" y="65" width="40" height="28" rx="4" fill={primary} fillOpacity="0.25" />
			<rect x="85" y="100" width="40" height="28" rx="4" fill={primary} fillOpacity="0.2" />
			<rect x="135" y="100" width="40" height="28" rx="4" fill={primary} fillOpacity="0.2" />
			<rect x="185" y="100" width="40" height="28" rx="4" fill={primary} fillOpacity="0.2" />
			<circle cx="220" cy="45" r="14" fill={primary} fillOpacity="0.9" />
			<path fill="#fff" d="M220 38v6h0c0 1.1-.9 2-2 2s-2-.9-2-2v-6c0-1.1.9-2 2-2s2 .9 2 2zm0 12v2h-4v-2h4z" />
			<path d="M70 110 H50" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
			<path d="M210 125 H240" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
			<path d="M155 135 q8 6 6 14 q-2 10 -10 12" stroke={primary} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
		</Box>
	);
}

function ErrorPageContent({ statusCode, title, description, router, primary }) {
	return (
		<Container maxWidth="md">
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100vh',
					textAlign: 'center',
				}}
			>
				<Box
					sx={{
						bgcolor: 'background.paper',
						borderRadius: 2,
						boxShadow: 3,
						p: 4,
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						alignItems: 'center',
					}}
				>
					<Box sx={{ mr: { md: 4 }, mb: { xs: 4, md: 0 } }}>
						<ErrorIllustration primary={primary} />
					</Box>
					<Box>
						<Typography variant="h2" component="h1" gutterBottom color={theme => theme.palette.primary.main}>
							{statusCode}
						</Typography>
						<Typography variant="h4" component="h2" gutterBottom>
							{title}
						</Typography>
						<Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
							{description}
						</Typography>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
							<Button
								variant="contained"
								size="large"
								endIcon={<ArrowForwardIcon />}
								onClick={() => router.push('/home')}
								sx={{
									background: theme => theme.palette.primary.main,
									borderRadius: 28,
									px: 4,
									py: 1.5,
									transition: 'all 0.3s',
									'&:hover': {
										transform: 'translateY(-3px)',
										boxShadow: 4,
									},
								}}
							>
								Volver al inicio
							</Button>
							<Button
								variant="outlined"
								size="large"
								startIcon={<RefreshIcon />}
								onClick={() => router.reload()}
								sx={{
									borderColor: theme => theme.palette.primary.main,
									color: theme => theme.palette.primary.main,
									borderRadius: 28,
									px: 4,
									py: 1.5,
									transition: 'all 0.3s',
									'&:hover': {
										borderColor: theme => theme.palette.primary.main,
										background: theme => theme.palette.primary.main + '14',
										transform: 'translateY(-3px)',
										boxShadow: 4,
									},
								}}
							>
								Reintentar
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Container>
	);
}

/**
 * Página de error global de Next.js.
 * Los 404 se redirigen al componente que ya los maneja (/NotFound).
 */
function Error({ statusCode }) {
	const router = useRouter();
	const theme = useTheme();
	const primary = theme.palette.primary.main || '#464866';

	const code = statusCode || 500;
	const is404 = code === 404;

	React.useEffect(() => {
		if (is404) {
			router.replace('/NotFound');
		}
	}, [is404, router]);

	if (is404) {
		return null;
	}

	const { title, description } = getErrorContent(code);

	return (
		<ErrorPageContent
			statusCode={code}
			title={title}
			description={description}
			router={router}
			primary={primary}
		/>
	);
}

Error.getInitialProps = function getInitialProps({ res, err }) {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};

export default Error;
