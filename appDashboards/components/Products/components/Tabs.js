// components/ScrollableTabs.js
import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  Paper,
  Tooltip,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { tabsClasses } from '@mui/material/Tabs';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';


const ScrollableTabs = ({ handleChangeGroup }) => {
  const [value, setValue] = useState(0);

  const handleChange = (_, newValue) => {
    setValue(newValue)
    handleChangeGroup(newValue+1)
  };

  const tabs = [

    { label: 'Grupos', icon: <PeopleIcon /> },
    { label: 'Proyecto', icon: <FolderIcon /> },
  ];

  return (
    <Tabs
      value={value}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons
      aria-label="visible arrows tabs example"
      sx={{
        [`& .${tabsClasses.scrollButtons}`]: {
          '&.Mui-disabled': { opacity: 0.3 },
        },
      }}
    >
      {tabs.map((tab, index) => (
        <Tooltip title={tab.label} key={index} arrow>
          <Tab
            icon={tab.icon}
            sx={{
              minWidth: 48,
              width: 60,
              padding: 0.8,
              '& .MuiSvgIcon-root': {
                fontSize: 25,
              },
            }}
          />
        </Tooltip>
      ))}
    </Tabs>



  );
};

export default ScrollableTabs;
