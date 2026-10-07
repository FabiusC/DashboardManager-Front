export const checkerCreateDashboard = (dashboardData) => {
  if (!dashboardData.name || dashboardData.name.trim() === "") {
    return {
      message: "El nombre del tablero no puede estar vacío.",
      status: false,
    };
  }

  if (dashboardData.name.length < 3) {
    return {
      message: "El nombre del tablero debe contener al menos 3 caracteres.",
      status: false,
    };
  }

  if (dashboardData.name.length > 500) {
    return {
      message: "El nombre del tablero no puede contener más de 500 caracteres.",
      status: false,
    };
  }

  if (!dashboardData.description || dashboardData.description.trim() === "") {
    return {
      message: "La descripción del tablero no puede estar vacía.",
      status: false,
    };
  }

  const threeWords = dashboardData.description.trim().split(/\s+/).length >= 3;
  if (!threeWords) {
    return {
      message: "La descripción del tablero debe contener al menos 3 palabras.",
      status: false,
    };
  }

  if (dashboardData.description.length > 10000) {
    return {
      message:
        "La descripción del tablero no puede contener más de 10000 caracteres.",
      status: false,
    };
  }

  if (dashboardData.data_sources.length === 0) {
    return {
      message: "El tablero debe tener al menos una fuente de datos.",
      status: false,
    };
  }

  if (dashboardData.instances.length === 0) {
    return {
      message: "El tablero debe tener al menos una instancia.",
      status: false,
    };
  }

  return {
    message: "El tablero ha sido creado exitosamente.",
    status: true,
  };
};
