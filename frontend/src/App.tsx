import { Route, Routes } from "react-router";
import Chat from "./pages/Chat";
import Files from "./pages/Files";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/files" element={<Files />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
