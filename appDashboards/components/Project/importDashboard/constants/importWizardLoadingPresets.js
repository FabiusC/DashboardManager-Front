import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';

export const validateSourcesLoadingProps = {
    centerIcon: StorageOutlinedIcon,
    messages: [
        { Icon: SearchRoundedIcon, text: 'Buscando fuentes compatibles…..' },
        { Icon: StorageOutlinedIcon, text: 'Cruzando validación con tu catálogo…' },
        { Icon: LinkRoundedIcon, text: 'Preparando opciones para tu tablero…' }
    ]
};

export const dashboardCreatingLoadingProps = {
    centerIcon: DashboardCustomizeOutlinedIcon,
    messages: [
        { Icon: DashboardCustomizeOutlinedIcon, text: 'Importando tu tablero…' },
        { Icon: ViewModuleOutlinedIcon, text: 'Configurando paneles y diseño…' },
        { Icon: LinkRoundedIcon, text: 'Conectando fuentes de datos…' }
    ],
    footnote: 'No cierres esta ventana hasta que termine la importación'
};

export const dashboardExportingLoadingProps = {
    centerIcon: DashboardCustomizeOutlinedIcon,
    messages: [
        { Icon: DownloadRoundedIcon, text: 'Exportando tu tablero…' },
        { Icon: ViewModuleOutlinedIcon, text: 'Recopilando paneles y configuración…' },
        { Icon: LinkRoundedIcon, text: 'Preparando el archivo de exportación…' }
    ],
    footnote: 'El archivo se descargará automáticamente al finalizar',
    lightText: true
};

export const dashboardDuplicatingLoadingProps = {
    centerIcon: DashboardCustomizeOutlinedIcon,
    messages: [
        { Icon: DashboardCustomizeOutlinedIcon, text: 'Duplicando tu tablero…' },
        { Icon: ViewModuleOutlinedIcon, text: 'Creando paneles y diseño…' },
        { Icon: LinkRoundedIcon, text: 'Manteniendo las mismas fuentes de datos…' }
    ],
    footnote: 'No cierres esta ventana hasta que termine la duplicación',
    lightText: true
};
