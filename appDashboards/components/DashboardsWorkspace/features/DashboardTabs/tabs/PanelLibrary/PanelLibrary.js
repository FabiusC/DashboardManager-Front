import { useCallback, useEffect, useState } from "react"
import {
  Box,
  Paper,
  Breadcrumbs,
  Link,
} from "@mui/material"
import { connect, useDispatch } from "react-redux"
import { pushNotification } from "@redux/actions"
import ProjectsList from "./ProjectsList"
import FoldersList from "./FoldersList"
import PanelsList from "./PanelsList"
import { getProjectList } from "@components/Project/Project/services/Project"
import { getFolderList } from "@components/Project/Folders/services/Folder"
import { getACLList} from "@services/creangelAuthAPI" 
const PanelLibrary = ({ dashboard, user }) => {
const getInitialNavigation = () => {
    if (typeof window === 'undefined') {
      return {
        currentView: 'projects',
        currentProject: null,
        currentFolder: null
      };
    }

    const sessionProjectId = sessionStorage.getItem('projectId');
    const sessionProjectName = sessionStorage.getItem('projectName');
    const sessionFolderId = sessionStorage.getItem('folderId');
    const sessionFolderName = sessionStorage.getItem('folderName');

    if (sessionProjectId && sessionFolderId) {
      return {
        currentView: 'panels',
        currentProject: { id: sessionProjectId, name: sessionProjectName || 'Proyecto actual' },
        currentFolder: { id: sessionFolderId, name: sessionFolderName || 'Carpeta actual' }
      };
    }
    return {
      currentView: 'projects',
      currentProject: null,
      currentFolder: null
    };
  };
  const initialNavigation = getInitialNavigation();
  // Estados de navegación
  const [currentView, setCurrentView] = useState(initialNavigation.currentView)
  const [currentProject, setCurrentProject] = useState(initialNavigation.currentProject)
  const [currentFolder, setCurrentFolder] = useState(initialNavigation.currentFolder)
  // Estados de datos
  const [projects, setProjects] = useState([])
  const [folders, setFolders] = useState([])
  const [panels, setPanels] = useState([])
  
  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [isLoadingPanels, setIsLoadingPanels] = useState(false)
  
  // Estados de paginación
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalFolders, setTotalFolders] = useState(0)
  const [totalPanels, setTotalPanels] = useState(0)
  const [perPageProjects] = useState(8)
  const [perPageFolders] = useState(8)
  const [perPagePanels] = useState(4)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFoldersPage, setCurrentFoldersPage] = useState(1)
  const [currentPanelsPage, setCurrentPanelsPage] = useState(1)
  
  const dispatch = useDispatch()
  
  // Calcular dashboardPanels directamente desde dashboard.panels
  const dashboardPanels = dashboard?.panels?.map((panel) => panel.id).filter(Boolean) || [];

  const handleGetProjectList = useCallback(async (showLoading = false) => {
    const stateSetters = {
        setIsLoading,
        setProjects,
        setTotalProjects,
        setCurrentPage
    };
    const data = {
        projectsPerPage: perPageProjects,
        offset: (currentPage - 1) * perPageProjects,
        searchValue: searchTerm,  
        sortField: "name",
        sortDirection: "desc",
        userToken: user[0].userID,
        showLoading
    };
    await getProjectList(data, stateSetters);
}, [searchTerm, perPageProjects, currentPage, user]);

  const handleGetFolderList = useCallback(async (showLoading = false) => {
    const params = {
        foldersPerPage: perPageFolders,
        offset: (currentFoldersPage - 1) * perPageFolders,
        searchValue: searchTerm,
        sortField: "name",
        sortDirection: "desc",
        userToken: user[0].userID,
        projectId: currentProject?.id,
        showLoading
    };

    const stateSetters = {
        setIsLoadingFolders,
        setFolders
    };

    const result = await getFolderList(params, stateSetters);
    
    if (result.error) {
        console.error('Error al obtener carpetas:', result.error);
    } else if (result.count !== undefined) {
        setTotalFolders(result.count);
    }
    
    return result;
}, [searchTerm, perPageFolders, currentFoldersPage, user, currentProject]);

const handleGetPanelsList = useCallback(async () => {
    setIsLoadingPanels(true)
    const requestHeader = {
        'Authorization': 'Bearer ' + user[0].userID,
        'Content-Type': 'application/json'
    }
    const requestBody = {
        limit: perPagePanels,
        offset: (currentPanelsPage - 1) * perPagePanels,
        q: searchTerm,
        order_by: "asc",
        order_field: "name",
        type: ["panel"],
        filtered_groups: [],
        filter: [
            { field: 'folder_id', value: currentFolder?.id },
            { field: 'in_trash', value: false },
            { field: 'project_id', value: currentProject?.id },
        ]
    }
  const response = await getACLList(requestBody, requestHeader)
if (response?.status === "success") {
    const results = response.data.results.map(panel => ({
        ...panel,
        title: panel.name
    }))
    setPanels(results)
    setTotalPanels(response.data.count)
}
    setIsLoadingPanels(false)
}, [searchTerm, perPagePanels, currentPanelsPage, user, currentFolder, currentProject])
  useEffect(() => {
    if (currentView === 'projects') {
      handleGetProjectList(projects.length === 0)
    } else if (currentView === 'folders' && currentProject) {
      handleGetFolderList(folders.length === 0)
    } else if (currentView === 'panels' && currentFolder) {
      handleGetPanelsList()
    }
  }, [currentView, currentPage, currentFoldersPage, currentPanelsPage, searchTerm, currentProject, currentFolder, projects.length, folders.length, handleGetProjectList, handleGetFolderList, handleGetPanelsList])

  const handleProjectClick = (project) => {
    setCurrentProject(project)
    setCurrentView('folders')
    setSearchTerm("")
  }

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder)
    setCurrentView('panels')
    setSearchTerm("")
  }

  const handleBlockedDrag = (panel) => {
    dispatch(pushNotification({ msg: "Este panel ya está en el tablero. Arrástralo desde el lienzo para moverlo.", status: 'warn' }))
  }

  const handleBackToProjects = () => {
    setCurrentView('projects')
    setCurrentProject(null)
    setCurrentFolder(null)
    setSearchTerm("")
  }

  const handleBackToFolders = () => {
    setCurrentView('folders')
    setCurrentFolder(null)
    setSearchTerm("")
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    if (currentView === 'projects') {
      setCurrentPage(1)
    } else if (currentView === 'folders') {
      setCurrentFoldersPage(1)
    } else if (currentView === 'panels') {
      setCurrentPanelsPage(1)
    }
  }

  const handleProjectsPageChange = (event, page) => {
    setCurrentPage(page)
  }

  const handleFoldersPageChange = (event, page) => {
    setCurrentFoldersPage(page)
  }

  const handlePanelsPageChange = (event, page) => {
    setCurrentPanelsPage(page)
  }

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: 'Proyectos',
        onClick: handleBackToProjects,
        active: currentView === 'projects'
      }
    ]

    if (currentProject) {
      breadcrumbs.push({
        label: currentProject.name,
        onClick: currentView === 'panels' ? handleBackToFolders : undefined,
        active: currentView === 'folders'
      })
    }

    if (currentFolder) {
      breadcrumbs.push({
        label: currentFolder.name,
        onClick: undefined,
        active: currentView === 'panels'
      })
    }

    return (
      <Breadcrumbs 
        sx={{ 
          mb: 1, 
          fontSize: '12px',
          '& .MuiBreadcrumbs-separator': { fontSize: '12px' }
        }}
        separator="›"
      >
        {breadcrumbs.map((crumb, index) => (
          <Link
            key={index}
            color={crumb.active ? "primary" : "inherit"}
            underline="hover"
            sx={{ 
              cursor: crumb.onClick ? "pointer" : "default",
              fontSize: '12px',
              fontWeight: crumb.active ? 'medium' : 'normal'
            }}
            onClick={crumb.onClick}
          >
            {crumb.label}
          </Link>
        ))}
      </Breadcrumbs>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'projects':
        return (
          <ProjectsList
            projects={projects}
            isLoading={isLoading}
            onProjectClick={handleProjectClick}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            currentPage={currentPage}
            totalPages={Math.ceil(totalProjects / perPageProjects)}
            onPageChange={handleProjectsPageChange}
          />
        )
      case 'folders':
        return (
          <FoldersList
            folders={folders}
            isLoading={isLoadingFolders}
            onFolderClick={handleFolderClick}
            onBackClick={handleBackToProjects}
            currentProject={currentProject}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            currentPage={currentFoldersPage}
            totalPages={Math.ceil(totalFolders / perPageFolders)}
            onPageChange={handleFoldersPageChange}
          />
        )
      case 'panels':
        return (
          <PanelsList
            panels={panels}
            isLoading={isLoadingPanels}
            onBackClick={handleBackToFolders}
            currentFolder={currentFolder}
            dashboardPanels={dashboardPanels}
            onBlockedDrag={handleBlockedDrag}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            currentPage={currentPanelsPage}
            totalPages={Math.ceil(totalPanels / perPagePanels)}
            onPageChange={handlePanelsPageChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ width: "100%", height: "100%", maxHeight: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: "#ffffff",
          padding: 1,
          overflowY: "auto",
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          boxSizing: "border-box"
        }}
      >
        {renderBreadcrumbs()}
        <Paper
          variant="outlined"
          sx={{
            p: 0,
            border: 'none',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}>
          {renderCurrentView()}
        </Paper>
      </Box>
    </Box>
  )
}

const mapStateToProps = state => {
  return {
      user: state.user,
  };
};

export default connect(mapStateToProps)(PanelLibrary)
