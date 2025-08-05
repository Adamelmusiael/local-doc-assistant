import { Route, Routes } from "react-router";
import Chat from "./pages/Chat";
import Files from "./pages/Files";
import Settings from "./pages/Settings";
import { AppProvider } from "./contexts/AppContext";

function App() {
  return (
    <AppProvider>
      {}
      {}
      
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/files" element={<Files />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
