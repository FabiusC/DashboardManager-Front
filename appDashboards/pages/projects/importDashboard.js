import Main from '@components/Main';
import ImportDashboard from '@components/Project/importDashboard/ImportDashboard';
import { useRouter } from 'next/router';

export default function ImportDashboardPage() {
    const router = useRouter();
    const { pathname } = router;

    return (
        <Main forwardURL={pathname}>
            <ImportDashboard />
        </Main>
    );
}
