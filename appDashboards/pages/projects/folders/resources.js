import Resources from '@components/Project/Resources';
import Main from '../../../components/Main'
import { useRouter } from 'next/router'

export default function ResourcesPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Resources />
        </Main>
    )
}
