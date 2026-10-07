import {
  creangelAuthGeneralRequest,
  getGroupMetadata,
  getUserMetadata,
} from "@services/creangelAuthAPI";
import { dashboardGeneralRequest } from "@services/dashboardAPI";
import { useMutation, useQuery } from "@tanstack/react-query";

// Obtiene una lista de todos los reportes programados creados
export const getScheduleReportsList = async (
  params,
  retries = 3,
  delay = 1000,
) => {
  try {
    const {
      limit,
      offset,
      order_by,
      order_field,
      field_str_search,
      field_str_q,
      filters,
    } = params;

    const response = await dashboardGeneralRequest({
      version: "v1",
      typeRequest: "POST",
      nameUrl: "listScheduleList",
      body: {
        limit,
        offset,
        order_by,
        order_field,
        field_str_search,
        field_str_q,
        filters,
      },
    });

    if (!response?.data) return { results: [], count: 0, error: "Sin datos" };
    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      error: null,
    };
  } catch (error) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, delay));
      return getScheduleReportsList(params, retries - 1, delay);
    }
    return { results: [], count: 0, error: error.message };
  }
};
// Obtiene el detalle de un reporte programado
export const useScheduleDetail = (reportId) => {
  return useQuery({
    queryKey: ["scheduleDetail", reportId],
    queryFn: async () => {
      try {
        const response = await dashboardGeneralRequest({
          version: "v1",
          typeRequest: "GET",
          nameUrl: "scheduleDetail",
          dynamicParams: { report_id: reportId },
        });
        if (response?.status === "success" || response?.status === "ok") {
          if (!response?.data)
            throw new Error("La fuente de datos aún no está lista");
          return response?.data;
        }
        if (response?.status === "error" || response?.status === "err") {
          throw new Error(response?.msg || "Fuente de datos no encontrada");
        }
        return response?.data || null;
      } catch (err) {
        console.error("Error en useScheduleDetail:", err);
        throw err;
      }
    },
    enabled: !!reportId,
  });
};
// Crea un reporte programado
export const useCreateScheduleMutation = (dynamicParams) => {
  const { mutate, isLoading, data, error, reset } = useMutation({
    mutationFn: async (payload) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "POST",
        nameUrl: "createSchedule",
        body: payload,
        dynamicParams: { dashboard_id: dynamicParams },
      });
      return response;
    },
  });

  return { mutate, isLoading, data, error, reset };
};
// Elimina permanentemente un reporte programado
export const deleteScheduleMutation = (dynamicParams) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async () => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "DELETE",
        nameUrl: "deleteSchedule",
        dynamicParams: { report_id: dynamicParams },
      });
      return response;
    },
  });

  return { mutate, isLoading, data, error };
};
// Actualiza la información general de un reporte programado
export const useUpdateGeneralScheduleMutation = (dynamicParams) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async (payload) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "PUT",
        nameUrl: "updateGeneralSchedule",
        body: payload,
        dynamicParams: { report_id: dynamicParams },
      });
      return response;
    },
  });

  return { mutate, isLoading, data, error };
};
// Actualiza la información del horario del reporte programado
export const useUpdateScheduleMutation = (dynamicParams) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async (payload) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "PUT",
        nameUrl: "updateScheduleSchedule",
        body: payload,
        dynamicParams: { report_id: dynamicParams },
      });
      return response;
    },
  });
  return { mutate, isLoading, data, error };
};
// Añade un destinatario a un reporte programado
export const addRecipientMutation = (reportId) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async (payload) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "POST",
        nameUrl: "createRecipient",
        body: payload,
        dynamicParams: { report_id: reportId },
      });
      return response;
    },
  });

  return { mutate, isLoading, data, error };
};
// Actualiza la información de un destinatario de un reporte programado
export const useUpdateRecipientMutation = (reportId) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async ({ type, recipient_id }) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "PUT",
        nameUrl: "updateRecipient",
        body: { type },
        dynamicParams: { report_id: reportId, recipient_id: recipient_id },
      });
      return response;
    },
  });
  return { mutate, isLoading, data, error };
};
// Elimina a un destinatario de un reporte programado
export const deleteRecipientMutation = (reportId) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async (recipientId) => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "DELETE",
        nameUrl: "deleteRecipient",
        dynamicParams: { report_id: reportId, recipient_id: recipientId },
      });
      return response;
    },
  });

  return { mutate, isLoading, data, error };
};
// Obtiene los tipos de programación - intervalos, días del mes y días del año
export const getSchedulesTaskTypes = () => {
  return useQuery({
    queryKey: ["taskTypes"],
    queryFn: async () => {
      try {
        const response = await dashboardGeneralRequest({
          version: "v1",
          typeRequest: "POST",
          nameUrl: "listScheduleTaskTypes",
          body: { limit: 10, offset: 0 },
        });
        // Manejar la estructura de respuesta
        if (response?.status === "success" || response?.status === "ok") {
          if (!response?.data) {
            throw new Error("La fuente de datos aún no está lista");
          }
          return response?.data;
        }

        if (response?.status === "error" || response?.status === "err") {
          throw new Error(response?.msg || "Fuente de datos no encontrada");
        }

        return response?.data || null;
      } catch (err) {
        console.error("Error en useDataSourceById:", err);
        throw err;
      }
    },
  });
};
// Obtiene los correos en el sistema para añadir como destinatarios a los reportes programados
export const getEmailsList = async (params) => {
  try {
    const { limit, offset, q, order_by, order_field } = params;

    const response = await creangelAuthGeneralRequest({
      version: "v1",
      typeRequest: "POST",
      nameUrl: "emailsUsersList",
      body: { limit, offset, q, order_by, order_field },
    });

    if (!response?.data) return { results: [], count: 0, error: "Sin datos" };
    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      error: null,
    };
  } catch (error) {
    return { results: [], count: 0, error: error.message };
  }
};

export const deleteFiltersReportsMutation = (reportId) => {
  const { mutate, isLoading, data, error } = useMutation({
    mutationFn: async () => {
      const response = await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "DELETE",
        nameUrl: "deleteFilters",
        dynamicParams: { report_id: reportId },
      });
      return response;
    },
  });
  return { mutate, isLoading, data, error };
};
// Obtiene la metada de los usuarios creadores y actualizadores de los reportes programados
export const useUsersMetadata = (userIds, enabled = true, header) => {
  return useQuery({
    queryKey: ["usersMetadata", userIds],
    queryFn: () => {
      if (!userIds) throw new Error("El identificador es requerido");
      return getUserMetadata(userIds, header);
    },
    select: (response) => response.data,
    enabled: enabled && Boolean(userIds),
  });
};
// Obtiene la metada de los grupos
export const useGroupsMetadata = (groupIds, enabled = true, header) => {
  return useQuery({
    queryKey: ["groupsMetadata", groupIds],
    queryFn: () => {
      if (!groupIds) throw new Error("El identificador es requerido");
      return getGroupMetadata(groupIds, header);
    },
    select: (response) => response.data,
    enabled: enabled && Boolean(groupIds),
  });
};
// Obtiene la información del tablero 
export const useDashboardData = (id) => {
  return useQuery({
    queryKey: ["dashboardData", id],
    queryFn: async () => {
      try {
        if (!id) throw new Error("El id del reporte es requerido");
        return await dashboardGeneralRequest({
          version: "v1",
          typeRequest: "GET",
          nameUrl: "dashboardEditionGet",
          dynamicParams: { id: id },
        });
      } catch (error) {
        console.error(
          "Ocurrio un error intentando obtener la información del tablero vinculado al reporte",
          error,
        );
      }
    },
  });
};
