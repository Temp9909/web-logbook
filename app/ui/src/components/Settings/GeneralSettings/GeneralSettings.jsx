import SaveSettingsButton from "../SaveSettingsButton";
import OwnerInfoFields from "./OwnerInfoFields";
import OtherSettings from "./OtherSettings";
import AuthSettings from "./AuthSettings";
import LicensesExpiration from "./LicensesExpiration";
import DBActionsMenu from "./DBControl/DBActionsMenu";
import HelpButton from "./HelpButton";
import ApplePanel, { AppleSeparator, AppleSectionLabel } from "../../UIElements/ApplePanel";

const ActionButtons = ({ settings }) => (
  <>
    <HelpButton />
    <DBActionsMenu />
    <SaveSettingsButton settings={settings} />
  </>
);

export const GeneralSettings = ({ settings, handleChange }) => (
  <ApplePanel
    title="General"
    subtitle="Owner information, application options and authentication."
    actions={<ActionButtons settings={settings} />}
  >
    <AppleSectionLabel>Owner</AppleSectionLabel>
    <OwnerInfoFields settings={settings} handleChange={handleChange} />
    <AppleSeparator />
    <AppleSectionLabel>Logbook</AppleSectionLabel>
    <OtherSettings settings={settings} handleChange={handleChange} />
    <LicensesExpiration settings={settings} handleChange={handleChange} />
    <AppleSeparator />
    <AppleSectionLabel>Security</AppleSectionLabel>
    <AuthSettings settings={settings} handleChange={handleChange} />
  </ApplePanel>
);

export default GeneralSettings;
