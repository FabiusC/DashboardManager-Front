import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AccountTreeOutlined } from '@mui/icons-material';
import { useDispatch } from "react-redux";

const RecentlyModified = ({ organizationId }) => {
    const [currentData, setCurrentData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const theme = useTheme();
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
    const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'lg')); 
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')); 
    const cardsPerSlide = isLargeScreen ? 7 : isMediumScreen ? 3 : 1;
    const dispatch = useDispatch()

    useEffect(() => {}, [])
    
    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + cardsPerSlide) % entities.length);
    };

    const handlePrev = () => {
        setCurrentIndex(
        (prevIndex) => (prevIndex - cardsPerSlide + entities.length) % entities.length
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
                { currentData.length > 0 && currentData.slice(currentIndex, currentIndex + cardsPerSlide).map((entity, index) => (
                    <Card key={index} sx={{ height: 150, width: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1, paddingTop: 2, paddingBottom: 2 }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, paddingBottom: '0px !important' }}>
                            <AccountTreeOutlined sx={{ fontSize: '50px' }} />
                            <Typography 
                                color="text.secondary"
                                sx={{ fontSize: '1rem' }}
                            >
                                {entity.name}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );

};

export default RecentlyModified;
