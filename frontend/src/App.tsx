import { Route, Routes } from "react-router";
import Chat from "./pages/Chat";
import Files from "./pages/Files";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./contexts/AppContext";
import { MenuProvider } from "./contexts/MenuContext";

function App() {
  return (
    <AppProvider>
      <MenuProvider>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/files" element={<Files />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MenuProvider>
    </AppProvider>
  );
}

export default App;
