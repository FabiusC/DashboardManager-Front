import Main from '../../components/Main'
import { useRouter } from 'next/router'
import Dashboards from '../../components/Project/IndexDashboards/Dashboards';

export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Dashboards/>
        </Main>
    )
}