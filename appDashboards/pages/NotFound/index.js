import * as React from 'react';
import { Box, Button, Link, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Container } from '@mui/system';

export default function NotFoundPage() {
	const router = useRouter();

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
						<img src="./img/lupe_ask.png" alt="Lupe Ask" />
					</Box>
					<Box>
						<Typography variant="h2" component="h1" gutterBottom color={theme => theme.palette.primary.main}>
							404
						</Typography>
						<Typography variant="h4" component="h2" gutterBottom>
							Página no encontrada
						</Typography>
						<Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
							Lo sentimos, la página que estás buscando no existe.
						</Typography>
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
					</Box>
				</Box>
			</Box>
		</Container>
	);

}