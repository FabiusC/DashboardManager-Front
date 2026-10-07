import { Modal, Button } from 'react-bootstrap';

export default function Confirm(props) {

	const handleClose = () => {
		props.callBack(false)
	}

	const handleClick = () => {
		props.handleConfirm();
		props.callBack(false)
	}

	return (
		<Modal show={true} onHide={handleClose} centered={true}>
			<Modal.Header closeButton>
				<Modal.Title>Confirmar</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<h4>{props.message}</h4>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="primary" id="btnConfirm" onClick={handleClick}>Sí</Button>
				<Button variant="secondary" id="btnDeny" onClick={handleClose}>No</Button>
			</Modal.Footer>
		</Modal>
	)
}
