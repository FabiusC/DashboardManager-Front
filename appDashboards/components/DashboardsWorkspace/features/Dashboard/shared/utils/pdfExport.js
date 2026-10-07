import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
const flattenLeafletTransforms = (clonedDoc) => {
  const clonedWindow = clonedDoc.defaultView;
  if (!clonedWindow) return;

  const transformedElements = clonedDoc.querySelectorAll(
    '.leaflet-container [style*="transform"]'
  );
  transformedElements.forEach((element) => {
    const { transform } = clonedWindow.getComputedStyle(element);
    if (!transform || transform === "none") return;

    const matrix = new DOMMatrixReadOnly(transform);
    element.style.left = `${matrix.m41}px`;
    element.style.top = `${matrix.m42}px`;
    element.style.transformOrigin = "0 0";
    element.style.transform = matrix.a === 1 && matrix.d === 1 ? "none" : `scale(${matrix.a}, ${matrix.d})`;
  });
};

const GridStylesForCapture = (clonedDoc) => {
  clonedDoc.querySelectorAll(".dashboard-grid-root").forEach((el) => {
    el.classList.remove(
      "dashboard-grid-root--drag-ghost",
      "dashboard-grid-root--dragging",
      "dashboard-grid-root--resizing"
    );
    el.style.backgroundImage = "none";
    el.style.setProperty("--resize-handle-color", "transparent");
    el.style.setProperty("--resize-handle-color-hover", "transparent");
  });

  clonedDoc.querySelectorAll(".ui-resizable-handle").forEach((el) => {
    el.style.display = "none";
  });

  clonedDoc.querySelectorAll(".grid-stack-placeholder").forEach((el) => {
    el.style.display = "none";
  });
};

const prepareCloneForCapture = (clonedDoc) => {
  flattenLeafletTransforms(clonedDoc);
  GridStylesForCapture(clonedDoc);
};

export const exportElementToPDF = async (mainElementId, filename = "documento", scrollElementId = "scrollable-body") => {
  const mainElement = document.getElementById(mainElementId);
  const scrollElement = document.getElementById(scrollElementId);

  if (!mainElement) {
    return false;
  }

  let alturaOriginal, overflowOriginal, scrollOriginal;

  if (scrollElement) {
    alturaOriginal = scrollElement.style.height;
    overflowOriginal = scrollElement.style.overflow;
    scrollOriginal = scrollElement.scrollTop;
    scrollElement.scrollTop = 0;
    scrollElement.style.height = `${scrollElement.scrollHeight}px`;
    scrollElement.style.overflow = "visible";
  }

  try {
    const canvas = await html2canvas(mainElement, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollY: -window.scrollY,
      windowHeight: mainElement.scrollHeight,
      onclone: prepareCloneForCapture,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.8);

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "l" : "p",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height, undefined, "FAST");

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("PDF export failed:", error);
    return false;
  } finally {
    if (scrollElement) {
      scrollElement.style.height = alturaOriginal;
      scrollElement.style.overflow = overflowOriginal;
      scrollElement.scrollTop = scrollOriginal;
    }
  }
};