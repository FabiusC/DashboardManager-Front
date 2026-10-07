import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { getImageFileUrl } from "@services/imageServerAPI";

const OBJECT_FIT_VALUES = new Set(["cover", "contain", "fill"]);

const ImageChart = ({ styles = {} }) => {
  const imageId = styles?.imageId;
  const caption = typeof styles?.caption === "string" ? styles.caption.trim() : "";
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageId]);

  const imageUrl = useMemo(() => {
    if (!imageId) return null;
    try {
      return getImageFileUrl(imageId);
    } catch {
      return null;
    }
  }, [imageId]);
  const objectFit = OBJECT_FIT_VALUES.has(styles?.objectFit)
    ? styles.objectFit
    : "contain";
  const numericOpacity = Number(styles?.opacity);
  const opacity = Number.isFinite(numericOpacity)
    ? Math.min(1, Math.max(0, numericOpacity))
    : 1;

  if (!imageId) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Sin imagen configurada
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="figure"
      sx={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        m: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
        }}
      >
        {hasError || !imageUrl ? (
          <Typography color="text.secondary" variant="body2">
            No se pudo cargar la imagen
          </Typography>
        ) : (
          <Box
            component="img"
            src={imageUrl}
            alt={caption || "Imagen de la gráfica"}
            onError={() => setHasError(true)}
            sx={{
              width: "100%",
              height: "100%",
              objectFit,
              opacity,
              display: "block",
            }}
          />
        )}
      </Box>
      {caption && (
        <Typography
          component="figcaption"
          color="text.secondary"
          variant="caption"
          sx={{ mt: 1, flexShrink: 0 }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
};

export default ImageChart;
