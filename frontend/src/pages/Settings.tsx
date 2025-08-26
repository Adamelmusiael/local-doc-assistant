import Layout from "../components/Layout/Layout";

const Settings = () => {
  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-page__header">
          <h1 className="settings-page__title">Settings</h1>
          <p className="settings-page__subtitle">
            Manage your account preferences and application settings
          </p>
        </div>
        <div className="settings-page__content">
          <div className="settings-page__placeholder">
            <p>Settings content will be implemented here.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
