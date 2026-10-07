import Head from 'next/head'
import store from '../redux/store';
import { Provider } from 'react-redux';
import { addModules } from '../redux/initDispatch';
import { StrictMode, useMemo } from 'react'; 
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../public/css/reset.css'
import '../public/css/main.css'
import "@fontsource/roboto"; // Defaults to weight 400
import "@fontsource/roboto/700.css"; 
import "@fortawesome/fontawesome-free/css/all.min.css";
import "gridstack/dist/gridstack.min.css";
import "../components/DashboardsWorkspace/features/Dashboard/shared/components/grid/gridDashboard.css";
import CustomThemeProvider from '../components/Recursive/CustomThemeProvider';
import AuthGate from '@components/Authenticator/AuthGate';

store.dispatch(addModules());

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function MyApp({ Component, pageProps }) {
    const staticPrefix = process.env.staticPrefix;
    const router = useRouter(); 
    const isExcludedRoute = useMemo(() => {
        const p = router.pathname || '';
        return (
            p.startsWith('/authenticator') ||
            p.startsWith('/login') ||
            p.startsWith('/NotFound') ||
            p.startsWith('/_error')
        );
    }, [router.pathname]);

    return (
        <StrictMode>
            <Head>
                <title>IFindIt</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href={staticPrefix + "/favicon.ico"} />
            </Head>
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <CustomThemeProvider>
                        
                        {isExcludedRoute ? (
                            <Component {...pageProps} />
                        ) : (
                            <AuthGate>
                                <Component {...pageProps} />
                            </AuthGate>
                        )}

                    </CustomThemeProvider>
                </QueryClientProvider>
            </Provider>
        </StrictMode>
    )
}

export default MyApp
