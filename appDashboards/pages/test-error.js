/**
 * Página solo para probar la vista de error global.
 * Al visitar /test-error se fuerza un error 500 para ver _error.js en acción.
 * Eliminar o no enlazar esta ruta en producción.
 */
export async function getServerSideProps() {
	// Forzar error 500 para probar la página de error
	throw new Error('Error de prueba para ver la página de error');
}

export default function TestErrorPage() {
	return null;
}
