import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { tabsClasses } from '@mui/material/Tabs';

const ScrollableTabs = ({  tabs, ...props }) => {
  const {option, setOption} = props

  const handleChange = (_, newValue) => {
    setOption(newValue);
  };

  const isScrollable = tabs.length > 4;
  const scrollBehavior = isScrollable ? 'scrollable' : 'standard';
  const tabWidth = !isScrollable ? `${100 / tabs.length}%` : undefined;

  return (
    <Tabs
      value={option}
      onChange={handleChange}
      variant={scrollBehavior}
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Tabs filtro"
      sx={{
        width: '100%',
        [`& .${tabsClasses.scrollButtons}`]: {
          '&.Mui-disabled': { opacity: 0.3 },
        },
        mb: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          value={tab.id}
          icon={
            <Tooltip title={tab.label || tab.name} arrow placement="top">
              {tab.icon}
            </Tooltip>
          }
          sx={{
            '& .MuiSvgIcon-root': {
              fontSize: 20,
            },
            minHeight: 44,
            minWidth: isScrollable ? '25%' : 0,
            width: tabWidth,
            maxWidth: isScrollable ? '25%' : 'none',
            padding: '4px 6px',
            fontSize: '0.75rem',
            textTransform: 'none',
          }}
        />
      ))}
    </Tabs>
  );
};

export default ScrollableTabs;
