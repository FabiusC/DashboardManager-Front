// components/Scheduling/components/SchedulingBreadcrumb.jsx
import { Breadcrumb, useBreadcrumbControls } from '@creangel/ifindit-ui';
import { CalendarMonth } from '@mui/icons-material';
import { useRouter } from 'next/router';

const SchedulingBreadcrumb = ({ activeItem = 'scheduling' }) => {
  const router = useRouter();
  const state = useBreadcrumbControls({
    state: {
      items: [
        { id: 'scheduling', label: 'Reportes', path: '/reports', icon: <CalendarMonth sx={{ fontSize: '18px' }} /> },
        { id: 'report', label: 'Reporte', path: '/report' },
      ],
      activeItem: activeItem || 'scheduling',
      showHomeIcon: true,
    },
    show: { breadcrumb: true },
    handlers: { onItemClick: (item) => item.path && router.push(item.path) },
  });
  return <Breadcrumb state={state} />;
};

export default SchedulingBreadcrumb;