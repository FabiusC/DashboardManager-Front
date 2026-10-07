import Favorites from '@components/Project/Favorites';
import Main from '../../components/Main'
import { useRouter } from 'next/router'

export default function FavoritesPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            <Favorites />
        </Main>
    )
}

