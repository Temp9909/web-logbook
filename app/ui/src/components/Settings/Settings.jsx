import { useCallback, useEffect, useState } from "react";
import LinearProgress from '@mui/material/LinearProgress';
import GeneralSettings from "./GeneralSettings/GeneralSettings";
import LogbookSignature from "./Signature/LogbookSignature";
import StandardFields from "./StandardFields/StandardFields";
import useSettings from "../../hooks/useSettings";
import CustomFieldsTable from "./CustomFields/CustomFieldsTable";
import PreviousExperience from "./PreviousExperience/PreviousExperience";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";

export const Settings = () => {
  const { data, isLoading } = useSettings();
  const [settings, setSettings] = useState(data);

  useEffect(() => {
    if (!isLoading && data) setSettings(data);
  }, [isLoading, data]);

  const handleChange = useCallback((key, value) => {
    setSettings((settings) => {
      const keys = key.split('.');
      const updatedsettings = { ...settings };
      let current = updatedsettings;
      keys.forEach((k, index) => {
        if (index === keys.length - 1) current[k] = value;
        else {
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });
      return updatedsettings;
    });
  }, []);

  return (
    <section className="apple-legacy-screen apple-settings-screen">
      <AppleLegacyHeading title="Settings" subtitle="Configure your logbook, fields, signature and previous experience." />
      {isLoading && <LinearProgress />}
      <div className="apple-settings-grid">
        <div className="apple-stack">
          <GeneralSettings settings={settings} handleChange={handleChange} />
          <LogbookSignature settings={settings} handleChange={handleChange} />
          <PreviousExperience settings={settings} handleChange={handleChange} />
        </div>
        <div className="apple-stack">
          <StandardFields settings={settings} handleChange={handleChange} />
          <CustomFieldsTable />
        </div>
      </div>
    </section>
  );
};

export default Settings;
