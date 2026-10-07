import { useRouter } from 'next/router'
import Panels from '@components/Panels';

export default function PanelPage() {
    const router = useRouter();
    const { panelId } = router.query;

    if (!panelId) return <div>No panel ID provided</div>;

    if (typeof panelId === 'string') return <Panels panelId={panelId} />;

}
