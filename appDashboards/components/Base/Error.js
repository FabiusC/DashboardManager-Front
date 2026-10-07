export default function Error({ className, message }) {
	return (<>
		<div className={"errorAlert " + className}>{message}</div>
		<style jsx>{`
				.errorAlert {
					color: #a94442;
					background-color: #f2dede;
					border-color: #ebccd1;
					border-radius: 5px;
					line-height: 2;
					padding: 5px 20px;
				}
			`}</style>
	</>);
}
