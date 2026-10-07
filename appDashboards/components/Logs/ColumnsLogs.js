import {
    Box
} from '@mui/material';

const columnsYearList = [
    {
        accessorKey: 'field',
        header: 'Año',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsMonthList = [
    {
        accessorKey: 'field',
        header: 'Mes',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsDayWeekList = [
    {
        accessorKey: 'field',
        header: 'Día de la semana',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsDayList = [
    {
        accessorKey: 'field',
        header: 'Fecha',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsHourList = [
    {
        accessorKey: 'field',
        header: 'Hora',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsGroupList = [
    {
        accessorKey: 'field',
        header: 'Nombre grupo',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    }
]

const columnsUsersList = [
    {
        accessorKey: 'field',
        header: 'Nombre de usuario',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
]

const columnsTypeObject = [
    {
        accessorKey: 'field',
        header: 'Objeto',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
]

const columnsTypeAction = [
    {
        accessorKey: 'field',
        header: 'Acción',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
]

const columnsTypeStatus = [
    {
        accessorKey: 'field',
        header: 'Resultado',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
    {
        accessorKey: 'count',
        header: 'Número de actividades',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        }
    },
]
export const columnsHistoricalLogsList = [
    {
        accessorKey: '@timestamp',
        header: 'Fecha',
        size: 80,
        muiTableHeadCellProps: {
            align: 'center',
        },
        muiTableBodyCellProps: {
            align: 'center',
        },
        Cell: ({ cell }) => {
            const isoDateString = cell.getValue('@timestamp');
            const date = new Date(isoDateString);
            const options = {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
                timeZone: 'America/Bogota'
            };
            const formattedDate = new Intl.DateTimeFormat('es-CO', options).format(date);
            return (
                <Box component="span">
                    {formattedDate}
                </Box>
            )
        }
    },
    {
        accessorKey: 'action',
        header: 'Acción',
        size: 80,
        muiTableHeadCellProps: {
            align: 'left',
        },
        muiTableBodyCellProps: {
            align: 'left',
        }
    },
    {
        accessorKey: 'group',
        header: 'Grupo',
        size: 80,
        muiTableHeadCellProps: {
            align: 'left',
        },
        muiTableBodyCellProps: {
            align: 'left',
        }
    },
    {
        accessorKey: 'result',
        header: 'Resultado',
        size: 80,
        muiTableHeadCellProps: {
            align: 'left',
        },
        muiTableBodyCellProps: {
            align: 'left',
        }
    },
]

export const columnsLogsList = {"year": columnsYearList,
                                "month": columnsMonthList,
                                "day_week": columnsDayWeekList,
                                "day": columnsDayList,
                                "hour": columnsHourList,
                                "groups": columnsGroupList,
                                "users": columnsUsersList,
                                "object_types": columnsTypeObject,
                                "actions": columnsTypeAction,
                                "status": columnsTypeStatus}