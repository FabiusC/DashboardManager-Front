import { getGroupList, getACLList } from "@services/creangelAuthAPI";

export const handleGroupsList = async ( userID, elementsPerPage, currentPage, searchTerm, filter) => {
    // setIsLoadingGroupsList(true)
    
    let requestHeader = {
        'Authorization': 'Bearer ' + userID,
        'Content-Type': 'application/json'
    }
    let requestBody = {
        limit: elementsPerPage ||  10,
        offset: (currentPage - 1) * elementsPerPage,
        q: searchTerm,
        filter: filter,
        order_by: 'desc',
        order_field: 'created_at'
    }
    
    try {
        const responseGroupsList = await getGroupList(requestBody, requestHeader);
        // La respuesta viene con status: "ok" y los datos en response.data
        if (responseGroupsList.data && responseGroupsList.data.status === "ok") {
            return responseGroupsList.data; // Retornar los datos para que puedan ser utilizados
        }
    } catch (error) {
        console.error("Error en handleGroupsList:", error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el componente que llama esta función
    }
}

// Función para obtener lista de productos (ACL)
export const getProductsList = async (params, stateSetters) => {
    try {
        const {
            elementsPerPage = 500,
            offset = 0,
            searchTerm = '',
            sortField = 'created_at',
            sortDirection = 'desc',
            userToken,
            filters = [],
            types = ['panel', 'dashboard'],
            filtered_groups = [],
            showLoading = false
        } = params;

        const {
            setIsLoadingList,
            setProductsList,
            setTotalProducts
        } = stateSetters;

        // Mostrar loading si es necesario
        if (showLoading && setIsLoadingList) {
            setIsLoadingList(true);
        }

        const requestData = {
            type: types,
            filtered_groups: filtered_groups,
            limit: elementsPerPage,
            offset: offset,
            q: searchTerm,
            order_by: sortDirection,
            order_field: sortField,
            filter: [
                { field: 'in_trash', value: false },
                ...filters
            ]
        };


        const response = await getACLList(requestData, {
            'Authorization': `Bearer ${userToken}`
        });


        // Si no hay datos, resetear states y ocultar loading
        if (!response?.data) {
            console.warn("Respuesta de API sin data:", response);
            if (setProductsList) setProductsList([]);
            if (setTotalProducts) setTotalProducts(0);
            if (setIsLoadingList) setIsLoadingList(false);

            return {
                results: [],
                count: 0,
                offsetError: false
            };
        }

        const { results, count } = response.data;
        
        // Asegurar que results sea un array
        const safeResults = Array.isArray(results) ? results : [];
        const offsetError = offset > count && count > 0;

        // Si hay error de offset, resetear
        if (offsetError) {
            if (setIsLoadingList) setIsLoadingList(false);

            return {
                results: [],
                count,
                offsetError: true
            };
        }

        // Actualizar todos los states
        if (setProductsList) setProductsList(safeResults);
        if (setTotalProducts) setTotalProducts(count || 0);
        if (setIsLoadingList) setIsLoadingList(false);

        return {
            results: safeResults,
            count: count || 0,
            offsetError: false
        };

    } catch (error) {
        console.error('Error en getProductsList:', error);
        const { setIsLoadingList, setProductsList, setTotalProducts } = stateSetters;
        
        if (setProductsList) setProductsList([]);
        if (setTotalProducts) setTotalProducts(0);
        if (setIsLoadingList) setIsLoadingList(false);

        return {
            results: [],
            count: 0,
            error: error.message || 'Error al obtener productos'
        };
    }
}