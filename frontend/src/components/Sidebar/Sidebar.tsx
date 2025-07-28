import { Link } from "react-router";
import "./Sidebar.scss";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <h1>Local RAG</h1>
      </div>
      <div className="sidebar__content">
        <Link to="/">Chat</Link>
        <Link to="/files">Files</Link>
        <Link to="/settings">Settings</Link>
      </div>
    </div>
  );
};

export default Sidebar;
