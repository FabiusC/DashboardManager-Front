import { useEffect } from 'react'
import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function Login() {
	const router = useRouter();
	const { forward } = router.query;

	useEffect(() => {
		const timer = setTimeout(() => {
			if (process.env.NEXT_PUBLIC_AUTH_URL) {
				window.location.href = process.env.NEXT_PUBLIC_AUTH_URL;
			}
		}, []);

		return () => clearTimeout(timer);
	}, []);

	if (process.env.NEXT_PUBLIC_AUTH_URL) {
		return (<> </>)
	}
	if (forward !== undefined) {
		return (
			<Box
				display="flex"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				height="100vh"
				textAlign="center"
				px={2}
			>
				<ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
				<Typography variant="h5" color="error" gutterBottom>
					Error al iniciar sesión
				</Typography>
				<Typography variant="body1" sx={{ mb: 3 }}>
					Vuelva al sistema de autenticación y verifique su sesión.
				</Typography>

			</Box>
		);
	} else {
		return (
			<Box
				display="flex"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				height="100vh"
				textAlign="center"
				px={2}
			>
				<ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
				<Typography variant="h5" color="error" gutterBottom>
					Error al iniciar sesión
				</Typography>
				<Typography variant="body1" sx={{ mb: 3 }}>
					Vuelva al sistema de autenticación y verifique su sesión.
				</Typography>

			</Box>
		);
	}
}
