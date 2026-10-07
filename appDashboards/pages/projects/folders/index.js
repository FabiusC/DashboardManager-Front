import Main from '@components/Main';
import Folders from '@components/Project/Folders';
import { useRouter } from 'next/router'

export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Folders/>
        </Main>
    )
}