import { ModalsProvider } from '../ModalsContext';
import { TabsProvider } from '../TabsContext';
import { ChartProvider } from '../ChartContext';
import { PanelsProvider } from '../PanelsContext';
// import { GeneralPanelProvider } from '../GeneralPanelContext';


const WrapperContext = ({ children }) => {

  return (
    <ModalsProvider>
      <TabsProvider>
        <PanelsProvider>
          {/* <GeneralPanelProvider> */}
            <ChartProvider>
              {children}
            </ChartProvider>
          {/* </GeneralPanelProvider> */}
        </PanelsProvider>
      </TabsProvider>
    </ModalsProvider>
  );
};
export default WrapperContext;