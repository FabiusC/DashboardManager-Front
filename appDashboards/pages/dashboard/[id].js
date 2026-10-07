import { useRouter } from "next/router";
import Main from "../../components/Main";
import DashboardsWorkspace from "@components/DashboardsWorkspace";
import { Box } from "@mui/material";
import { LoadingAssembly } from "@creangel/ifindit-ui";

export default function DashboardPage() {
   const router = useRouter();
   const { id } = router.query;
   const pathname = router.pathname;

   if (!router.isReady || !id) {
      return (
         <Box
            sx={{
               display: "flex",
               justifyContent: "center",
               alignItems: "center",
               minHeight: "100vh",
               bgcolor: "#F5F5F5",
            }}
         >
            <LoadingAssembly
               state={{
                  message: "Cargando tablero...",
                  borderRadius: false,
                  boxShadow: false,
                  size: 60,
               }}
            />
         </Box>
      );
   }

    return (
        <Main forwardURL={pathname}>
            <DashboardsWorkspace id={id} />
        </Main>
    )
}