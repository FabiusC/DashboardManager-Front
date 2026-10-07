import Main from '@components/Main';
import Report from '@components/Scheduling/report/report';
import { useRouter } from 'next/router'

export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Report/>
        </Main>
    )
}