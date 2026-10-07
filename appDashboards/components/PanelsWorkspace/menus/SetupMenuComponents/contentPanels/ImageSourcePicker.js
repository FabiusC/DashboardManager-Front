import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutline,
  Close,
  CollectionsOutlined,
  CloudUploadOutlined,
  DeleteOutline,
  ImageOutlined,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getImageFileUrl,
  listImages,
  uploadImage,
} from "@services/imageServerAPI";

const IMAGE_ACCEPT = "image/*";
const RECENT_IMAGE_LIMIT = 3;

const ImageSourcePicker = ({
  keyName,
  type,
  value_type,
  type_es,
  value,
  id,
  handleInputChange,
  idComponent,
  parentData = [],
  getValue,
  token,
  clearTrigger = 0,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [source, setSource] = useState("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [libraryImages, setLibraryImages] = useState([]);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedImageId = getValue(keyName, type, value, parentData);
  const normalizedImageId = String(selectedImageId || "").trim();

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreviewUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!normalizedImageId) {
      setSelectedImage(null);
    }
  }, [normalizedImageId]);

  useEffect(() => {
    if (source !== "upload") {
      releaseObjectUrl();
    }
  }, [releaseObjectUrl, source]);

  useEffect(() => {
    if (clearTrigger > 0) {
      releaseObjectUrl();
      setSelectedImage(null);
    }
  }, [clearTrigger, releaseObjectUrl]);

  const getSafeImageUrl = useCallback((imageId) => {
    if (!imageId) return "";
    try {
      return getImageFileUrl(imageId);
    } catch {
      return "";
    }
  }, []);

  const selectedImageUrl = useMemo(
    () => localPreviewUrl || getSafeImageUrl(normalizedImageId),
    [getSafeImageUrl, localPreviewUrl, normalizedImageId]
  );
  const hasSelectedImage = Boolean(
    normalizedImageId || localPreviewUrl || isUploading
  );

  const updateImageValue = useCallback(
    (imageId) => {
      handleInputChange(
        keyName,
        type,
        id,
        imageId,
        value_type,
        idComponent,
        parentData
      );
    },
    [
      handleInputChange,
      id,
      idComponent,
      keyName,
      parentData,
      type,
      value_type,
    ]
  );

  const selectImage = useCallback(
    (image) => {
      if (!image?.id) return;
      releaseObjectUrl();
      setSelectedImage(image);
      setError(null);
      updateImageValue(String(image.id));
      setLibraryOpen(false);
    },
    [releaseObjectUrl, token, updateImageValue]
  );

  const clearImage = useCallback(() => {
    releaseObjectUrl();
    setSelectedImage(null);
    setError(null);
    updateImageValue("");
  }, [releaseObjectUrl, updateImageValue]);

  const uploadSelectedFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type?.startsWith("image/")) {
        setError("Selecciona un archivo de imagen válido.");
        return;
      }
      if (file.size === 0) {
        setError("El archivo de imagen está vacío.");
        return;
      }

      setError(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setLocalPreviewUrl(objectUrl);
      setSelectedImage({ name: file.name });
      setIsUploading(true);

      try {
        const uploadedImage = await uploadImage({ file, token });
        if (!uploadedImage?.id) {
          throw new Error("El servidor no devolvió el identificador de la imagen.");
        }
        releaseObjectUrl();
        setSelectedImage(uploadedImage);
        updateImageValue(String(uploadedImage.id));
      } catch (uploadError) {
        setError(uploadError?.message || "No se pudo cargar la imagen.");
      } finally {
        setIsUploading(false);
      }
    },
    [releaseObjectUrl, updateImageValue]
  );

  const handleFileInputChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      uploadSelectedFile(file);
    },
    [uploadSelectedFile]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      uploadSelectedFile(event.dataTransfer.files?.[0]);
    },
    [uploadSelectedFile]
  );

  useEffect(() => {
    if (source !== "library") return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsLibraryLoading(true);
      try {
        const result = await listImages({
          limit: 50,
          processingProfile: "generic",
          token,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setLibraryImages(result.images);
          setLibraryTotal(result.total);
        }
      } catch (listError) {
        if (!controller.signal.aborted) {
          setError(listError?.message || "No se pudo cargar la biblioteca.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLibraryLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [source, token]);

  const recentImages = libraryImages.slice(0, RECENT_IMAGE_LIMIT);
  const remainingImageCount = Math.max(
    0,
    libraryTotal - recentImages.length
  );

  const renderImagePreview = useCallback(
    (image, { selected = false } = {}) => {
      const imageId = image?.id || normalizedImageId;
      const imageUrl = getSafeImageUrl(imageId);
      if (!imageUrl) {
        return (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <ImageOutlined />
          </Box>
        );
      }
      return (
        <Box
          component="img"
          src={imageUrl}
          alt={image?.original_filename || image?.name || "Imagen"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: selected ? 0.9 : 1,
          }}
        />
      );
    },
    [getSafeImageUrl, normalizedImageId]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="body2"
        sx={{ display: "flex", alignItems: "center", mb: 1 }}
      >
        {type_es || "Imagen"}
      </Typography>

      <Box
        role="tablist"
        aria-label="Origen de imagen"
        sx={{
          display: "flex",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Button
          role="tab"
          aria-selected={source === "upload"}
          variant={source === "upload" ? "contained" : "outlined"}
          size="small"
          startIcon={<CloudUploadOutlined />}
          onClick={() => setSource("upload")}
          sx={{ textTransform: "none", flex: 1 }}
        >
          Cargar nueva
        </Button>
        <Button
          role="tab"
          aria-selected={source === "library"}
          variant={source === "library" ? "contained" : "outlined"}
          size="small"
          startIcon={<CollectionsOutlined />}
          onClick={() => setSource("library")}
          sx={{ textTransform: "none", flex: 1 }}
        >
          Biblioteca
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 1.5 }}
        >
          {error}
        </Alert>
      )}

      {source === "upload" ? (
        <Box
          component="label"
          htmlFor={`image-picker-${idComponent}-${id}`}
          role="button"
          tabIndex={0}
          aria-label={
            hasSelectedImage
              ? "Imagen seleccionada. Quita la imagen para cargar otra."
              : "Cargar una imagen"
          }
          onClick={(event) => {
            if (hasSelectedImage) {
              event.preventDefault();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!hasSelectedImage) {
                fileInputRef.current?.click();
              }
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px dashed ${
              isDragging
                ? theme.palette.primary.main
                : alpha(theme.palette.primary.main, 0.35)
            }`,
            borderRadius: 2,
            cursor: isUploading || hasSelectedImage ? "default" : "pointer",
            overflow: "hidden",
            backgroundColor: isDragging
              ? alpha(theme.palette.primary.main, 0.08)
              : "transparent",
            transition: "border-color 0.2s ease, background-color 0.2s ease",
            "&:hover": {
              borderColor: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <input
            ref={fileInputRef}
            id={`image-picker-${idComponent}-${id}`}
            type="file"
            accept={IMAGE_ACCEPT}
            hidden
            disabled={isUploading}
            onChange={handleFileInputChange}
          />
          {selectedImageUrl ? (
            <Box sx={{ position: "relative", aspectRatio: "16 / 9" }}>
              {renderImagePreview(
                {
                  id: normalizedImageId,
                  name: selectedImage?.name,
                  url: selectedImageUrl,
                },
                { selected: true }
              )}
              {isUploading && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.7)",
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                px: 2,
                py: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  mb: 0.5,
                }}
              >
                <CloudUploadOutlined fontSize="small" />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Arrastra tu imagen aquí
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG hasta 5MB
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Biblioteca de imágenes
          </Typography>
          {isLibraryLoading && libraryImages.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : recentImages.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
              }}
            >
              {recentImages.map((image) => {
                const isSelected =
                  String(image.id) === normalizedImageId;
                return (
                  <Box
                    component="button"
                    type="button"
                    key={image.id}
                    onClick={() => selectImage(image)}
                    aria-label={`Seleccionar ${
                      image.original_filename || "imagen"
                    }`}
                    sx={{
                      position: "relative",
                      aspectRatio: "1",
                      overflow: "hidden",
                      border: `1px solid ${
                        isSelected
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      borderRadius: 1,
                      p: 0,
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    {renderImagePreview(image, { selected: isSelected })}
                    {isSelected && (
                      <CheckCircleOutline
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          color: theme.palette.primary.main,
                          backgroundColor: "white",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </Box>
                );
              })}
              {remainingImageCount > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setLibraryOpen(true)}
                  sx={{
                    minWidth: 0,
                    aspectRatio: "1",
                    textTransform: "none",
                    color: theme.palette.primary.main,
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                  }}
                >
                  +{remainingImageCount}
                </Button>
              )}
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 2 }}
            >
              No hay imágenes genéricas disponibles.
            </Typography>
          )}
        </Box>
      )}

      {normalizedImageId && (
        <Button
          color="inherit"
          size="small"
          startIcon={<DeleteOutline />}
          onClick={clearImage}
          sx={{ mt: 1, textTransform: "none" }}
        >
          Quitar imagen
        </Button>
      )}

      <Dialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <CollectionsOutlined color="primary" />
          Biblioteca de imágenes
          <IconButton
            aria-label="Cerrar biblioteca"
            onClick={() => setLibraryOpen(false)}
            sx={{ ml: "auto" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isLibraryLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 1.5,
              }}
            >
              {libraryImages.map((image) => {
                const isSelected =
                  String(image.id) === normalizedImageId;
                return (
                  <Box
                    component="button"
                    type="button"
                    key={image.id}
                    onClick={() => selectImage(image)}
                    sx={{
                      position: "relative",
                      aspectRatio: "1",
                      overflow: "hidden",
                      border: `1px solid ${
                        isSelected
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      borderRadius: 1,
                      p: 0,
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    {renderImagePreview(image, { selected: isSelected })}
                    {isSelected && (
                      <CheckCircleOutline
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          color: theme.palette.primary.main,
                          backgroundColor: "white",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
          {!isLibraryLoading && libraryImages.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No se encontraron imágenes.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLibraryOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageSourcePicker;
