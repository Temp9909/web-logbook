import ImportTable from "./ImportTable";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const Import = () => (
  <section className="apple-legacy-screen apple-import-screen">
    <AppleLegacyHeading title="Import" subtitle="Import flight records from a CSV file." />
    <ApplePanel
      title="CSV import"
      subtitle="Open a CSV file, review the rows and run the import when everything looks correct."
    >
      <ImportTable embedded />
    </ApplePanel>
  </section>
);

export default Import;
