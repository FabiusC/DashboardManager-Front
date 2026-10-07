import Authenticator from '../../components/Authenticator';

import Router from "next/router";

export default function AuthenticatorPage() {
	let organization_id = undefined
	if (typeof window !== "undefined"){
		organization_id = new URLSearchParams(window.location.search).get('organization_id');
	}
	
	console.log("rendering Authenticator Page")
	if (organization_id !== undefined && organization_id !== null){
		return(
		<Authenticator
			organizationID={organization_id}
			edition={false}
		/>)
	} else {
		if (typeof window !== "undefined"){
			Router.push('/NotFound');
		}
		return null;
	}
}
