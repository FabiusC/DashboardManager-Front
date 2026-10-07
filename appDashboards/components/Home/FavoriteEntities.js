import React, { useState, useEffect } from "react";
import { Box, TextField, InputAdornment, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { StyledButton, StyledTabMin, StyledTabsMin } from "../Recursive/mui_styled_components";
import { AccountTreeOutlined, Folder, FolderCopyRounded, Search } from "@mui/icons-material";
import moment from 'moment'
import 'moment/locale/es'
moment.locale('es')

const FavoriteEntities = ({ projectData, folderData, pipelineData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState("project");
    const [filteredData, setFilteredData] = useState([]);
    
    const handleSelectedTab = (event, newValue) => {
        setSelectedTab(newValue);
    }

    useEffect(() => {
        let data;
        if (selectedTab === "project") {
            data = projectData;
        } else if (selectedTab === "folders") {
            data = folderData;
        } else if (selectedTab === "pipeline") {
            data = pipelineData;
        }
        setFilteredData(data);
        // setFilteredData(data.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [selectedTab, /*searchTerm,*/ projectData, folderData, pipelineData]);


    return (
        <Box>
            <Box className="top_center_distributed_horz mb_5 mt_15">
                <StyledTabsMin
                    value={selectedTab}
                    onChange={handleSelectedTab}
                    variant="scrollable"
                    // scrollButtons="auto"
                    sx={{ mb: 2 }}
                >
                    <StyledTabMin key={"project"} label={"Proyectos"} value="project" />
                    <StyledTabMin key={"folders"} label={"Carpetas"} value="folders" />
                    <StyledTabMin key={"pipeline"} label={"Pipelines"} value="pipeline" />
                </StyledTabsMin>
                <Box sx={{ mb: 2, width: { xs: '100%', sm: '100%', md: '30%'}, gap: 1, display: 'flex'}} autoComplete="off">
                    <TextField
                        variant="outlined"
                        placeholder="Buscar trabajos"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e)}
                        autoComplete="off"
                        inputProps={{
                            autoComplete: 'off',
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: '100%', borderRadius: 2 }}
                        size="small"
                    />
                    <StyledButton>Favoritos</StyledButton>
                </Box>
            </Box>
            <Card sx={{ mb: 2 }}>
                <CardContent sx={{ pr: 2, pl: 3, pb: '8px !important', pt: 1, backgroundColor: 'rgb(0 0 0 / 6%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Typography variant= "subtitle1" sx={{ flex: 1, fontWeight: 'medium', textTransform: 'capitalize' }}>Nombre:</Typography>
                        <Box className="pad_r_60">
                            <Typography variant= "subtitle1" sx={{ flex: 1, fontWeight: 'medium', textTransform: 'capitalize' }}>Última modificación:</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
            {filteredData.length > 0 && filteredData.map((item, index) => (
                <Card key={index} 
                    sx={{ 
                        // mb: 1,     
                        borderRadius: '0px',
                        borderBottom: '0.5px solid #c5c5c5',
                    }}
                >
                    <CardActionArea>
                        <CardContent sx={{ pr: 4, pl: 3, pb: 1, pt: 1 }}>
                            <Box sx={{ display: 'flex',  alignItems: 'center', gap: 2, flexDirection: 'row' }}>
                                <Box sx={{ width: '84%', display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    {selectedTab === "project" && <FolderCopyRounded sx={{color: item.color}}/>} 
                                    {selectedTab === "folders" && <Folder sx={{color: item.color}}/>} 
                                    {selectedTab === "pipeline" && <AccountTreeOutlined sx={{color: '#4db3f3'}}/>}
                                    <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 'medium', textTransform: 'capitalize' }}>
                                        {item.name}
                                    </Typography>
                                </Box>
                                <Box className="pad_r_30">
                                    <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 'medium', textTransform: 'capitalize' }}>
                                        {moment(item.edited_at).format("DD MMMM, YYYY")}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </CardActionArea>
                </Card>
            ))}
            {/* <Card>
                <CardActionArea>
                    <CardContent sx={{ pr: 4, pl: 3, pb: 1, pt: 1 }}>
                        <Box 
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 1,
                                flexDirection: 'row'
                            }}
                        >
                            <FolderCopyRounded sx={{ color: project.color, fontSize: '50px' }} /> 
                            <Typography variant= "subtitle1" sx={{ flex: 1, fontWeight: 'medium', textTransform: 'capitalize' }}>prueba2</Typography>
                        </Box>
                    </CardContent>
                </CardActionArea>
            </Card> */}
        </Box>
    );
};

export default FavoriteEntities;