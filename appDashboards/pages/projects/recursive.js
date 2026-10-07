import Main from '../../components/Main'
import { useRouter } from 'next/router'
// import Recursives from '../../components/Project/Recursives/index';

export default function Recursive() {
    const router = useRouter();
    const { pathname } = router
    return (
        <Main forwardURL={pathname}>
            {/* <Recursives/> */}
        </Main>
    )
}