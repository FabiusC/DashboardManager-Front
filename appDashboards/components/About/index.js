/* 
Name: About
Action: License description
*/

import _ from "lodash";
import { connect } from "react-redux";
import { keyframes, Link, Paper, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/system/Box";
import { useRouter } from "next/router";
import { clearSessionStorage } from "../../utilities/sessionStorageUtils";

const CREANGEL_URL = 'https://www.creangel.com';

/* --- Professional Animations --- */
// A subtle, slow float
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-8px) rotateX(1deg); }
`;

// A sophisticated deep space background pulse
const deepSpace = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// A slow, breathing glow for the border
const pulseBorder = keyframes`
  0%, 100% { border-color: rgba(100, 200, 255, 0.3); box-shadow: 0 0 20px rgba(100, 200, 255, 0.1); }
  50% { border-color: rgba(100, 200, 255, 0.7); box-shadow: 0 0 35px rgba(100, 200, 255, 0.3); }
`;

// A quick flash when the mode activates
const bootUp = keyframes`
  0% { filter: brightness(1) blur(0px); }
  10% { filter: brightness(2) blur(2px); }
  100% { filter: brightness(1) blur(0px); }
`;

const mapStateToProps = (state) => {
  return {
    user: state.user,
    organization: state.organization,
  };
};

function About(props) {
  const [screenMinHei] = useState(400);
  const staticPrefix = process.env.staticPrefix ?? "";
  const logoUrl = staticPrefix ? `${staticPrefix}/img/ifinditBig.png` : "";
  const creangelLogoUrl = staticPrefix
    ? `${staticPrefix}/img/logocreangel.png`
    : "";

  const [license, setLicense] = useState({
    Tool: "--",
    Version: "--",
    Client: "--",
    Order: "--",
    InitDate: "--",
    EndDate: "--",
  });

  // --- Secret State ---
  const [secretMode, setSecretMode] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (props.organization?.[0]?.license !== undefined) {
      const arrayLicenseData = props.organization[0].license.split(",");
      if (arrayLicenseData?.length > 0) {
        setLicense((prev) => {
          const deepCopyData = _.cloneDeep(prev);
          arrayLicenseData.forEach((eachData) => {
            const arrayData = eachData.split(":");
            const keyData = String(arrayData[0]);
            deepCopyData[keyData] = arrayData[1];
          });
          return deepCopyData;
        });
      }
    }
  }, [props.organization]);

  // --- Stealth Trigger Logic ---
  const handleSecretTrigger = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    // Reset count if user stops clicking for 600ms
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 600);

    if (clickCountRef.current >= 7) {
      setSecretMode((prev) => !prev);
      clickCountRef.current = 0;
    }
  };

  const handleGoLicenses = () => router.push("../licenses");

  // Colors for the professional theme
  const theme = {
    accent: "#64c8ff", // Electric light blue
    textLight: "#e0f7ff",
    textDim: "rgba(224, 247, 255, 0.6)",
    bgDark: "rgba(10, 15, 30, 0.6)",
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        mt: 3,
        pb: 4,
        transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        // Deep, professional radial gradient
        background: secretMode
          ? "radial-gradient(circle at center, #1a2a4f 0%, #0a0f1f 70%, #050810 100%)"
          : "transparent",
        backgroundSize: "200% 200%",
        animation: secretMode ? `${deepSpace} 20s ease infinite` : "none",
        minHeight: secretMode ? "85vh" : "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: secretMode ? "center" : "flex-start",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          width: "100%",
          perspective: "1000px",
        }}
      >
        {/* --- The Morphing Glass Card --- */}
        <Paper
          elevation={secretMode ? 24 : 0}
          sx={{
            width: "100%",
            maxWidth: 560,
            minHeight: screenMinHei,
            p: 4,
            borderRadius: secretMode ? 4 : 2,
            transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            position: "relative",
            overflow: "hidden",
            zIndex: 10,

            // Standard Mode vs Secret Mode Styles
            border: secretMode
              ? `1px solid ${theme.accent}`
              : "1px solid #e5e7eb",
            backgroundColor: secretMode ? theme.bgDark : "#ffffff",
            // High-quality glass effect
            backdropFilter: secretMode ? "blur(24px) saturate(120%)" : "none",
            color: secretMode ? theme.textLight : "inherit",

            // Animations
            boxShadow: secretMode ? "none" : "none", // Box shadow handled by animation below
            animation: secretMode
              ? `${subtleFloat} 8s ease-in-out infinite, ${pulseBorder} 4s ease-in-out infinite, ${bootUp} 0.5s ease-out`
              : "none",

            // Subtle internal gradient for glass depth
            backgroundImage: secretMode
              ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)"
              : "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.5,
              position: "relative",
              zIndex: 2,
            }}
          >
            {logoUrl && (
              <Box
                component="img"
                src={logoUrl}
                alt="IFindIT"
                sx={{
                  width: 160,
                  height: "auto",
                  // Clean brightness boost, no glitch
                  filter: secretMode
                    ? "brightness(1.1) drop-shadow(0 0 20px rgba(100,200,255,0.4))"
                    : "none",
                  transition: "filter 0.8s ease",
                }}
              />
            )}

            <Box sx={{ textAlign: "center" }}>
              {/*
                            <Typography variant="h5" sx={{
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                                textShadow: secretMode ? `0 0 15px ${theme.accent}` : 'none',
                                transition: 'text-shadow 0.8s ease'
                            }}>
                                {license.Tool}
                            </Typography>
                            */}

              <Typography
                variant="caption"
                onClick={handleSecretTrigger}
                sx={{
                  display: "block",
                  mt: 0.5,
                  userSelect: "none",
                  // Uses the accent color in secret mode
                  color: secretMode ? theme.accent : "text.secondary",
                  fontFamily: secretMode
                    ? '"Roboto Mono", monospace'
                    : "inherit",
                  cursor: "default",
                  letterSpacing: secretMode ? "1px" : "normal",
                  transition: "color 0.5s ease",
                }}
              >
                {secretMode
                  ? `// SYSTEM.VERSION: ${license.Version}`
                  : `Versión ${license.Version}`}
              </Typography>
            </Box>

            {/* License Data Grid */}
            <Box
              sx={{
                width: "100%",
                mt: 2,
                p: 2.5,
                // Sleek, dark data container
                bgcolor: secretMode ? "rgba(0,0,0,0.25)" : "#f9fafb",
                borderRadius: 3,
                border: secretMode
                  ? `1px solid rgba(100, 200, 255, 0.15)`
                  : "none",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                transition: "all 0.8s ease",
              }}
            >
              <DetailRow
                label="CLIENTE"
                value={license.Client}
                active={secretMode}
                theme={theme}
              />
              <DetailRow
                label="USUARIO ACTIVO EN ESTA SESIÓN"
                value={props.user?.[0]?.userData?.username}
                active={secretMode}
                theme={theme}
              />
              <DetailRow
                label="NÚMERO DE ORDEN DE COMPRA"
                value={license.Order}
                active={secretMode}
                theme={theme}
              />
              <DetailRow
                label="PERÍODO DE VALIDEZ DE LA LICENCIA"
                value={`${license.InitDate} — ${license.EndDate}`}
                active={secretMode}
                theme={theme}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: secretMode ? theme.textDim : "text.disabled",
                mt: 2,
              }}
            >
              © {new Date().getFullYear()} Creangel. Todos los derechos
              reservados.
            </Typography>

            <Link
              component="button"
              variant="caption"
              onClick={handleGoLicenses}
              sx={{
                fontWeight: 600,
                color: secretMode ? theme.accent : "primary.main",
                textDecoration: "none",
                transition: "color 0.3s ease",
                "&:hover": {
                  textDecoration: secretMode ? "none" : "underline",
                  textShadow: secretMode ? `0 0 10px ${theme.accent}` : "none",
                },
              }}
            >
              Third Party Notices and Licenses
            </Link>
          </Box>
        </Paper>

        {/* --- Enhanced Footer Branding with FIXED SHADOW --- */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: secretMode ? "translateY(20px)" : "none",
            transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: secretMode ? 0.9 : 1,
          }}
        >
          <Typography
            variant="overline"
            color={secretMode ? theme.textDim : "text.secondary"}
            sx={{
              mb: 1.5,
              letterSpacing: 3,
              fontSize: "0.65rem",
              fontWeight: 600,
            }}
          >
            Powered By
          </Typography>

          <Link
            href={CREANGEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 1.5,
              borderRadius: 50,
              // Professional Pill Style
              backgroundColor: secretMode ? "rgba(10, 20, 40, 0.8)" : "#fff",
              border: secretMode
                ? `1px solid rgba(100, 200, 255, 0.3)`
                : "1px solid transparent",
              boxShadow: secretMode
                ? `0 0 30px rgba(100, 200, 255, 0.2)`
                : "0 6px 16px rgba(0,0,0,0.08)",
              backdropFilter: secretMode ? "blur(10px)" : "none",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: secretMode
                  ? `0 0 40px rgba(100, 200, 255, 0.4)`
                  : "0 10px 24px rgba(0,0,0,0.12)",
              },
            }}
          >
            {creangelLogoUrl && (
              <Box
                component="img"
                src={creangelLogoUrl}
                alt="Creangel"
                sx={{
                  height: 28,
                  width: "auto",
                  filter: secretMode
                    ? `invert(1) drop-shadow(0 0 4px ${theme.accent})`
                    : "drop-shadow(0 0px 4px rgba(0, 9, 107, 0.34))",
                  transition: "filter 0.5s ease",
                }}
              />
            )}
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
// Cleaned up Sub-component
const DetailRow = ({ label, value, active, theme }) => (
    <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: active ? `1px solid rgba(100, 200, 255, 0.1)` : '1px solid #eee',
        pb: 1.5,
        '&:last-child': { borderBottom: 'none', pb: 0 }
    }}>
        <Typography variant="caption" sx={{
            color: active ? theme.textDim : 'text.secondary',
            fontWeight: 600,
            letterSpacing: active ? '1px' : 'normal',
            fontSize: '0.75rem'
        }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{
            fontWeight: 600,
            color: active ? theme.textLight : 'text.primary',
            fontFamily: active ? '"Roboto Mono", monospace' : 'sans-serif'
        }}>
            {value ?? '--'}
        </Typography>
    </Box>
);
export default connect(mapStateToProps)(About);
