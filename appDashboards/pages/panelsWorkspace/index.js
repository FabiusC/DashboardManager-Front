import Main from '@components/Main'
import { useRouter } from 'next/router'
import PanelsWorkspace from '@components/PanelsWorkspace';
import WrapperContext from '@components/PanelsWorkspace/context/wrapper';


export default function UsersPage() {
    const router = useRouter();
    const { pathname } = router
    return (
        <WrapperContext>
            <Main>
                <PanelsWorkspace />
            </Main>
        </WrapperContext>
    )
}