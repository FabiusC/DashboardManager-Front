import Main from '../../components/Main'
import { useRouter } from 'next/router'
import Project from '../../components/Project/Project';

export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Project />
        </Main>
    )
}