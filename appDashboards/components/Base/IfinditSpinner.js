import React from 'react';
import { Typography } from '@mui/material';

const IfinditSpinner = ({ msg, orbitRadius = 60 }) => {
  const staticPrefix = process.env.staticPrefix;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(248, 250, 252, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="spinner-container">
        <div className="spinner-center">
          <div
            className="orbiting-container"
            style={{ '--orbit-radius': `${orbitRadius}px` }}
          >
            <img
              src={staticPrefix + '/img/magnifying_glass_ifindit.png'}
              alt="Loading"
              style={{
                width: '50px',
                height: '50px',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
                opacity: 0.7,
              }}
            />
          </div>
        </div>
        <div className="loading-text-container">
          <Typography
            variant="body1"
            className="flash"
            sx={{
              fontWeight: 500,
              color: '#374151',
              letterSpacing: '0.025em',
              mb: '12px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
            }}
          >
            {msg}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default IfinditSpinner;