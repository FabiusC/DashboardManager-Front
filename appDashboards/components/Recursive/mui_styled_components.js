/* 
Name: mui_styled_components.js
Action: Styled components for MUI components
*/

import { styled } from "@mui/material/styles";
import {
    Button,
    Table,
    TableRow,
    TableSortLabel,
    Tab,
    Tabs,
    IconButton,
    Chip,
    Avatar,
    Switch,
    Paper,
    CircularProgress,
    Typography,
    Box,
    Checkbox,
    Step,
    Backdrop,
    darken,
    Select,
    tableCellClasses,
    Fade
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { alpha, height, minHeight, useTheme } from "@mui/system";
import { SquareLoader } from "react-spinners";

export const StyledMain = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(0),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
    }),
)

export const StyledDrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    minHeight: 90, // Spacer below MainBar; match your header height (was theme.mixins.toolbar ~64px)
    justifyContent: 'flex-end',
}));

export const StyledDrawerHeaderColor = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
    background: theme.palette.primary.main,
    boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)"
}));

export const StyledSwitch = styled((props) => <Switch {...props} />)(
    ({ theme }) => ({
        '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
                color: '#fff',
                '& + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 1,
                    border: 0,
                }
            }
        }
    })
)

export const StyledCheckbox = styled((props) => <Checkbox {...props} />)(
    ({ theme }) => ({
        color: "#5f618d",
        '&.Mui-checked': {
            color: "#5f618d",
        },
    })
)

export const StyledChip = styled((props) => <Chip {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            backgroundColor: darken(theme.palette.secondary.main, 0.2),
            textTransform: "unset",
        },
        backgroundColor: theme.palette.secondary.main,  //"#aaacc8", 
        textTransform: "unset",
        color: getContrastColor(theme.palette.secondary.main),
        fontSize: "16px",
        '& .MuiChip-icon': { color: "#dddff5" }
    })
)

export const StyledAvatar = styled((props) => <Avatar {...props} />)(
    ({ theme }) => ({
        width: 32,
        height: 32,
        backgroundColor: theme.palette.primary.main,  //"#aaacc8", 
        textTransform: "unset",
        color: getContrastColor(theme.palette.primary.main),
    })
)

export const StyledButton = styled((props) => <Button {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            color: getContrastColor(darken(theme.palette.primary.main, 0.2)),
            backgroundColor: darken(theme.palette.primary.main, 0.2),
            border: "none"
        },
        backgroundColor: theme.palette.primary.main,
        textTransform: "unset",
        fontWeight: "bolder",
        minHeight: "20px",
        borderRadius: "10px",
        color: getContrastColor(theme.palette.primary.main),
        minWidth: "60px",
        border: "none",
        padding: "8px 15px",
        fontSize: "12px"
    })
)

export const StyledButtonRounded = styled((props) => <Button {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            color: getContrastColor(theme.palette.primary.main),
            backgroundColor: darken(theme.palette.primary.main, 0.2),
        },
        backgroundColor: theme.palette.primary.main,
        textTransform: "unset",
        fontWeight: "bolder",
        minHeight: "40px",
        borderRadius: "25px"
    })
)

export const StyledButtonTops = styled((props) => <Button {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            color: "#FFFFFF",
            backgroundColor: darken(theme.palette.primary.main, 0.2),
        },
        backgroundColor: theme.palette.primary.main,
        textTransform: "unset",
        fontWeight: "bolder",
        minHeight: "38px",
        borderRadius: "3px",
        color: getContrastColor(theme.palette.primary.main),
        minWidth: "80px",
        padding: "6px 10px"
    })
)

export const StyledIconButton = styled((props) => <IconButton {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            padding: "0px"
        },
        paddingRight: "0px",
        paddingleft: "2px",
        paddingTop: "0px",
        paddingBottom: "0px",
    })
)

export const StyledCircularProgress = styled((props) => <CircularProgress {...props} />)(
    ({ theme }) => ({
        color: "#5f618d",
    })
)

export const RowsHeadStyled = styled((props) => <TableRow {...props} />)(
    ({ theme }) => ({
        borderBottom: "unset",
        background: "#2A3F54"
    })
)

export const RowsStyled = styled((props) => <TableRow {...props} />)(
    ({ theme }) => ({
        borderBottom: "1px solid #e6e9ed",
        background: "#ffffff",
        "&:hover": {
            backgroundColor: "rgb(227 236 241)",
            opacity: 1
        },
    })
)

export const SortTableStyled = styled((props) => <TableSortLabel {...props} />)(
    ({ theme }) => ({
        "&:hover": {
            color: "rgb(227 236 241)"
        },
        color: "#ffffff"
    })
)

export const TableStyled = styled((props) => <Table {...props} />)(
    ({ theme }) => ({
        "& .MuiTableCell-root": {
            border: "unset"
        },
        "& .MuiTableRow-root:nth-child(2n)": {
            backgroundColor: hexToRgba(theme.palette.fourth.main, 0.1)
        },
        "& .MuiTableRow-root:nth-child(2n):hover": {
            background: hexToRgba(theme.palette.fourth.main, 0.1)
        },
        ".MuiTableSortLabel-root.Mui-active": {
            color: "rgb(224 224 224)"
        },
        "& .MuiTableHead-root": {
            backgroundColor: hexToRgba(theme.palette.primary.main, 0.9),
        },
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: hexToRgba(theme.palette.primary.main, 0.9),
            // color: theme.palette.common.white,
        },
    })
)

export const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
    ({ theme }) => ({
        textTransform: "none",
        minWidth: 0,
        [theme.breakpoints.up("sm")]: {
            minWidth: 0
        },
        fontWeight: 400,
        fontSize: "18px",
        marginRight: theme.spacing(1),
        color: "#AAACC8",
        fontFamily: "Roboto",
        "&:hover": {
            color: "#286090",
            opacity: 1
        },
        "&.Mui-selected": {
            color: "#464867",
            fontWeight: theme.typography.fontWeightMedium
        },
    })
);

export const StyledTabs = styled((props) => <Tabs {...props} />)(
    ({ theme }) => ({
        '.MuiTabs-indicator': {
            backgroundColor: "#464867 !important",
        },
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        width: "100%",
        height: "60px"
    })
);

export const StyledTab2 = styled((props) => <Tab disableRipple {...props} />)(
    ({ theme }) => ({
        textTransform: "none",
        minWidth: 0,
        [theme.breakpoints.up("sm")]: {
            minWidth: 0
        },
        fontWeight: 400,
        fontSize: "20px",
        minHeight: "10px !important",
        marginRight: theme.spacing(1),
        color: "#AAACC8",
        fontFamily: "Roboto",
        "&:hover": {
            color: "#286090",
            opacity: 1
        },
        "&.Mui-selected": {
            color: "#464867",
            fontWeight: theme.typography.fontWeightMedium,
            backgroundColor: "#d2d3e6",
            borderRadius: "25px"
        },
    })
);

export const StyledTabs2 = styled((props) => <Tabs {...props} />)(
    ({ theme }) => ({
        '.MuiTabs-indicator': {
            backgroundColor: "#ffffff !important",
        },
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        width: "100%",
        height: "74px"
    })
);

export const StyledTabMin = styled((props) => <Tab disableRipple {...props} />)(
    ({ theme }) => ({
        textTransform: "none",
        minWidth: 0,
        [theme.breakpoints.up("sm")]: {
            minWidth: 0
        },
        fontWeight: 100,
        fontSize: "18px",
        color: "#000000",
        fontFamily: "Roboto",
        "&:hover": {
            backgroundColor: hexToRgba(theme.palette.fourth.main, 0.2),
            color: getContrastColor(theme.palette.fourth.main),
            borderRadius: "30px",
        },
        "&.Mui-selected": {
            fontWeight: 100,
            backgroundColor: hexToRgba(theme.palette.primary.main, 0.9),
            color: getContrastColor(theme.palette.primary.main),
            borderRadius: "30px",
        },
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "16px",
        paddingRight: "16px",
        minHeight: "5px"
    })
);

export const hexToRgba = (hex, alpha = 1) => {
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const StyledTabsMin = styled((props) => <Tabs {...props} />)(
    ({ theme }) => ({
        '.MuiTabs-indicator': {
            display: "none"
        },
        '&.MuiTabs-root': {
            minHeight: "20px"
        },
    })
);

export const StyledItem = styled((props) => <Paper {...props} />)(
    ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    })
);

export const colorAPP = {
    "bg_body_1": "#22274E",
    "bg_body_2": "#464867",
    "bg_body_3": "#AAACC8",
    "bg_body_4": "#d2d3e6",
    "bg_body_5": "#8d8e9a",
    "bg_body_6": "#8587a3",
    "bg_body_F": "#FFFFFF",
    "bg_icons_warning": "#ffc100",
    "bg_body_light": "#f2f3fb",
    "bg_icons": "#5f618d",
};

export const StyledSelectChip = styled((props) => <Select {...props} />)(
    ({ theme }) => ({
        '&.MuiSelect-outlined': {
            paddingTop: "0px",
            paddingBottom: "4px",
            paddingLeft: "0px",
            paddingRight: "0px"
        },
        maxHeight: "40px",
        borderRadius: "20px"
    })
);

export const StyledMaterialTable = (props) => {
    return (
        <MaterialReactTable
            {...props}
            initialState={{
                density: 'comfortable',
                pagination: { pageIndex: 0, pageSize: 5 }
            }}
            localization={MRT_Localization_ES}
            enableStickyHeader
            enableStickyFooter
            selectAllMode="all"
            globalFilterFn="contains"
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableSelectAll={false}
            enableMultiRowSelection={false}
            enableRowActions
            displayColumnDefOptions={{
                "mrt-row-actions": {
                    size: 100,
                    enableResizing: true,
                    muiTableHeadCellProps: {
                        align: "center",
                    },
                    muiTableBodyCellProps: {
                        align: 'center',
                    },
                },
            }}
            positionActionsColumn={'first'}
            muiTableHeadCellFilterTextFieldProps={{
                // variant: 'outlined',
                sx: {
                    background: "white",
                    borderRadius: "8px",
                    color: "black",
                    paddingLeft: "4px",
                    '& .MuiSvgIcon-root': {
                        width: "20px"
                    }
                }
            }}
            muiTableHeadCellColumnActionsButtonProps={{ sx: { color: "white", opacity: "1" } }}
            muiTableHeadCellFilterSliderProps={{ sx: { background: "white" } }}
            muiTableBodyCellProps={{
                sx: {
                    border: 'none',
                }
            }}
            muiTableHeadCellProps={{
                sx: {
                    background: "#464866",
                    color: "white",
                    fontSize: '16px',
                    fontWeight: "500"
                },
            }}
            muiTableBodyProps={{
                sx: () => ({
                    '& tr:nth-of-type(even)': {
                        backgroundColor: 'rgb(219 219 219 / 12%)'
                    },
                })
            }}
            muiTableContainerProps={{
                sx: {
                    minHeight: '400px',
                    maxHeight: '800px',
                    fontFamily: 'Roboto',
                    '& .MuiTableSortLabel-icon': { color: "#ffffff !important" },
                    '& .MuiIconButton-root': { color: "unset !important" },
                    position: 'sticky'
                }
            }}
            muiTopToolbarProps={{
                sx: {
                    '& .Mui-checked': {
                        color: "#464866"
                    },
                    '& .MuiSwitch-track': {
                        backgroundColor: "#464866"
                    }
                }
            }}

        />
    )
}

export const StyledMaterialTable_withoutActions = (props) => {
    return (
        <MaterialReactTable
            {...props}
            initialState={{
                density: 'comfortable',
                pagination: { pageIndex: 0, pageSize: 5 }
            }}
            localization={MRT_Localization_ES}
            enableStickyHeader
            enableStickyFooter
            selectAllMode="all"
            globalFilterFn="contains"
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableSelectAll={false}
            enableMultiRowSelection={false}
            displayColumnDefOptions={{
                "mrt-row-expand": {
                    size: 30,
                    enableResizing: true,
                    muiTableHeadCellProps: {
                        align: "center",
                    },
                    muiTableBodyCellProps: {
                        align: 'center',
                    },
                },
            }}
            muiTableHeadCellFilterTextFieldProps={{
                // variant: 'outlined',
                sx: {
                    background: "white",
                    borderRadius: "8px",
                    color: "black",
                    paddingLeft: "4px",
                    '& .MuiSvgIcon-root': {
                        width: "20px"
                    }
                }
            }}
            muiTableHeadCellColumnActionsButtonProps={{ sx: { color: "white", opacity: "1" } }}
            muiTableHeadCellFilterSliderProps={{ sx: { background: "white" } }}
            muiTableBodyCellProps={{
                sx: {
                    border: 'none',
                }
            }}
            muiTableHeadCellProps={{
                sx: {
                    /*
                    '& .MuiSvgIcon-root': {
                        opacity: '1',
                    },
                    */
                    background: (theme) => theme.palette.primary.main,
                    color: "white",
                    fontSize: '16px',
                    fontWeight: "500"
                },
            }}
            muiTableBodyProps={{
                sx: () => ({
                    '& tr:nth-of-type(even)': {
                        backgroundColor: 'rgb(219 219 219 / 12%)'
                    },
                })
            }}
        />
    )
}

export const StyledMaterialTable_withoutActions_compact = (props) => {
    return (
        <MaterialReactTable
            {...props}
            initialState={{
                density: 'compact',
                pagination: { pageIndex: 0, pageSize: 5 }
            }}
            localization={MRT_Localization_ES}
            enableStickyHeader
            enableStickyFooter
            selectAllMode="all"
            globalFilterFn="contains"
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableSelectAll={false}
            enableMultiRowSelection={false}
            displayColumnDefOptions={{
                "mrt-row-expand": {
                    size: 30,
                    enableResizing: true,
                    muiTableHeadCellProps: {
                        align: "center",
                    },
                    muiTableBodyCellProps: {
                        align: 'center',
                    },
                },
            }}
            muiTableHeadCellFilterTextFieldProps={{
                // variant: 'outlined',
                sx: {
                    background: "white",
                    borderRadius: "8px",
                    color: "black",
                    paddingLeft: "4px",
                    '& .MuiSvgIcon-root': {
                        width: "20px"
                    }
                }
            }}
            muiTableHeadCellColumnActionsButtonProps={{ sx: { color: "white", opacity: "1" } }}
            muiTableHeadCellFilterSliderProps={{ sx: { background: "white" } }}
            muiTableBodyCellProps={{
                sx: {
                    border: 'none',
                }
            }}
            muiTableHeadCellProps={{
                sx: {
                    /*
                    '& .MuiSvgIcon-root': {
                        opacity: '1',
                    },
                    */
                    background: "#464866",
                    color: "white",
                    fontSize: '16px',
                    fontWeight: "500"
                },
            }}
            muiTableBodyProps={{
                sx: () => ({
                    '& tr:nth-of-type(even)': {
                        backgroundColor: 'rgb(219 219 219 / 12%)'
                    },
                })
            }}
        />
    )
}

export const StyledMaterialTable_withoutStyles = (props) => {
    return (
        <MaterialReactTable
            {...props}
            initialState={{
                density: 'comfortable',
                pagination: { pageIndex: 0, pageSize: 5 }
            }}
            localization={MRT_Localization_ES}
            enableStickyHeader
            enableStickyFooter
            selectAllMode="all"
            globalFilterFn="contains"
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableSelectAll={false}
            enableMultiRowSelection={false}
            enableRowActions
            displayColumnDefOptions={{
                "mrt-row-actions": {
                    size: 100,
                    enableResizing: true,
                    muiTableHeadCellProps: {
                        align: "center",
                    },
                    muiTableBodyCellProps: {
                        align: 'center',
                    },
                },
            }}
            positionActionsColumn={'first'}
            muiTableHeadCellFilterTextFieldProps={{
                // variant: 'outlined',
                sx: {
                    background: "white",
                    borderRadius: "8px",
                    color: "black",
                    paddingLeft: "4px",
                    '& .MuiSvgIcon-root': {
                        width: "20px"
                    }
                }
            }}
            muiTableHeadCellColumnActionsButtonProps={{ sx: { color: "white", opacity: "1" } }}
            muiTableHeadCellFilterSliderProps={{ sx: { background: "white" } }}
            muiTableBodyCellProps={{
                sx: {
                    border: 'none',
                }
            }}
            muiTableHeadCellProps={{
                sx: {
                    /*
                    '& .MuiSvgIcon-root': {
                        opacity: '1',
                    },
                    */
                    background: "#464866",
                    color: "white",
                    fontSize: '16px',
                    fontWeight: "500"
                },
            }}
            muiTableBodyProps={{
                sx: () => ({
                    '& tr:nth-of-type(even)': {
                        backgroundColor: 'rgb(219 219 219 / 12%)'
                    },
                })
            }}
        />
    )
}

export const StyledMaterialTable_withoutActions_withoutStyles = (props) => {
    return (
        <MaterialReactTable
            {...props}
            initialState={{
                density: 'comfortable',
                pagination: { pageIndex: 0, pageSize: 5 }
            }}
            localization={MRT_Localization_ES}
            enableStickyHeader
            enableStickyFooter
            selectAllMode="all"
            globalFilterFn="contains"
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableSelectAll={false}
            enableMultiRowSelection={false}
            muiTableHeadCellFilterTextFieldProps={{
                // variant: 'outlined',
                sx: {
                    background: "white",
                    borderRadius: "8px",
                    color: "black",
                    paddingLeft: "4px",
                    '& .MuiSvgIcon-root': {
                        width: "20px"
                    }
                }
            }}
            muiTableHeadCellColumnActionsButtonProps={{ sx: { color: "white", opacity: "1" } }}
            muiTableHeadCellFilterSliderProps={{ sx: { background: "white" } }}
            muiTableBodyCellProps={{
                sx: {
                    border: 'none',
                }
            }}
            muiTableHeadCellProps={{
                sx: {
                    /*
                    '& .MuiSvgIcon-root': {
                        opacity: '1',
                    },
                    */
                    background: "#464866",
                    color: "white",
                    fontSize: '16px',
                    fontWeight: "500"
                },
            }}
            muiTableBodyProps={{
                sx: () => ({
                    '& tr:nth-of-type(even)': {
                        backgroundColor: 'rgb(219 219 219 / 12%)'
                    },
                })
            }}
        />
    )
}

export const CircularProgressWithLabel = (props) => {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

const steps = ['Select campaign settings', 'Create an ad group', 'Create an ad'];
export default function CustomizedSteppers() {
    return (
        <Stack sx={{ width: '100%' }} spacing={4}>
            <Stepper alternativeLabel activeStep={1} connector={<QontoConnector />}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Stepper alternativeLabel activeStep={1} connector={<ColorlibConnector />}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Stack>
    );
}

// Function to get the contrast color of a given hex color
export const getContrastColor = (color) => {
    let r, g, b, a = 1;

    if (color.startsWith('#')) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
    } else if (color.startsWith('rgba') || color.startsWith('rgb')) {
        const values = color.match(/[\d.]+/g)?.map(Number);
        if (!values || values.length < 3) return '#000000';
        [r, g, b, a = 1] = values; // alpha por defecto 1
    } else {
        return '#000000'; // fallback
    }

    // Simula mezcla sobre fondo blanco (asumiendo que lo hay)
    r = Math.round((1 - a) * 255 + a * r);
    g = Math.round((1 - a) * 255 + a * g);
    b = Math.round((1 - a) * 255 + a * b);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};


export const hexToRgb = (hexColor) => {
    const hex = hexColor.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
};