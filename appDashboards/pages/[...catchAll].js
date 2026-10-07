export async function getServerSideProps() {
	return {
	  redirect: {
		destination: '/NotFound',
		permanent: false,
	  },
	};
  }
  
  export default function CatchAll() {
	return null; // No se renderiza nada, ya se redirige en SSR
  }