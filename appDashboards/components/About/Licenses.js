/* 
Name: Licenses
Action: DataCatalog Licenses
*/

import { connect } from 'react-redux';
import { Typography } from '@mui/material';
import Box from '@mui/system/Box';
import BookIcon from '@mui/icons-material/Book';
import TurnedInIcon from '@mui/icons-material/TurnedIn';
import licensesData from './licenses.json';
import { clearSessionStorage } from '../../utilities/sessionStorageUtils';
import { useEffect } from 'react';

function Licenses(props) {
    
    const verbose = false;

    if (verbose) {
        console.log("licenses01", props)
        console.log("licensesData", licensesData)
    }

    useEffect(() => {
        clearSessionStorage(['projectId', 'projectName', 'folderId', 'folderName', 'resourceId', 'resourceName', 'panelId']);
    }, []);

    return (
        <div className='center_vert'>
            <div className='w_80 distributed_horz_strech flex_wrap gap_2_undetermine'>
                <div className='fullWidht bg_white box_shadow_aws'>
                    <Box className="fullWidht center_horz mt_40">
                        <Box style={{ width: "100%", padding: "0 40px", height: "100%" }}>
                            <Typography variant="h5" noWrap className='color_body_titles' component="div" sx={{ fontWeight: "500", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <span>{"Third Party Notices and Licenses"}</span>
                            </Typography>
                            {licensesData.map((license_item, index) => {
                                return (
                                    <Box key={index} className="pad_l_40 pad_t_30 pad_r_40">
                                        <Box className="left_vert col_gap_10">
                                            <Box className="left_horz mt_10">
                                                <BookIcon style={{ color: '#464866' }} />
                                                <Typography variant="h6" component="p" sx={{fontFamily: "Times New Roman"}}>
                                                    {license_item.LicenseName}
                                                </Typography>            
                                            </Box>
                                            <Box className="mt_20">
                                                {Object.entries(license_item.Applications || {}).map(([appName, versions]) => (
                                                    <Typography key={appName} variant="body1" component="div" className="left_horz" sx={{fontFamily: "Times New Roman"}}>
                                                        <TurnedInIcon fontSize="small" style={{ color: '#464866' }}/>
                                                        {appName}: {versions.join(',  ')}
                                                    </Typography>
                                                ))}
                                            </Box>
                                            <Box className="mt_10">
                                                <Typography variant="h9" component="div" sx={{ wordWrap: "breakWord", textAlign: "justify", fontFamily: "Times New Roman" }}>
                                                    {license_item.LicenseText.split(/\n\n/).map((paragraph, index) => (
                                                        <Typography key={index} variant="h9" component="div" sx={{ wordWrap: "breakWord", fontFamily: "Times New Roman" }}>
                                                            {paragraph}
                                                            <br /><br />
                                                        </Typography>
                                                    ))}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        organization: state.organization,
        actions: state.actions
    };
};

export default connect(mapStateToProps)(Licenses);