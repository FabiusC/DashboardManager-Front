import Main from '../../components/Main'
import { useRouter } from 'next/router'
import Panels from '../../components/Project/IndexPanels/Panels';

export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Panels/>
        </Main>
    )
}