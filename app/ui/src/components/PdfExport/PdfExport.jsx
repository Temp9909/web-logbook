import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchSettings } from "../../util/http/settings";
import RestoreDefaultsButton from "./RestoreDefaultsButton";
import PageSettings from "./PageSettings";
import OtherSettings from "./OtherSettings";
import SaveSettingsButton from "./SaveSettingsButton";
import ExportButton from "./ExportButton";
import CustomTitlePreview from "./CustomTitlePreview";
import AddCustomTitleButton from "./AddCustomTitleButton";
import DeleteCustomTitleButton from "./DeleteCustomTitleButton";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const PdfExport = ({ format }) => {
  const [pdfSettings, setPdfSettings] = useState({ columns: {}, headers: {} });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load settings' });

  useEffect(() => {
    if (data) {
      format === "A4" ? setPdfSettings(data.export_a4) : setPdfSettings(data.export_a5);
    }
  }, [data, format]);

  const handleChange = (key, value) => { setPdfSettings((prev) => ({ ...prev, [key]: value })) };
  const handleColumnChange = (key, value) => { setPdfSettings((prev) => ({ ...prev, columns: { ...prev.columns, [key]: value } })) };
  const handleHeaderChange = (key, value) => { setPdfSettings((prev) => ({ ...prev, headers: { ...prev.headers, [key]: value } })) };

  return (
    <section className="apple-legacy-screen apple-export-screen">
      <AppleLegacyHeading title="Export" subtitle={`Configure and export your ${format} logbook.`} />
      {isLoading && <LinearProgress />}
      <div className="apple-split-layout apple-export-layout">
        <div className="apple-stack">
          <ApplePanel
            title="Page settings"
            subtitle="Choose the columns, labels and page layout used in the exported logbook."
            actions={(
              <>
                <ExportButton format={format} />
                <SaveSettingsButton settings={pdfSettings} format={format} />
                <RestoreDefaultsButton format={format} handleChange={handleChange} />
              </>
            )}
          >
            <PageSettings
              format={format}
              pdfSettings={pdfSettings}
              handleChange={handleChange}
              handleColumnChange={handleColumnChange}
              handleHeaderChange={handleHeaderChange}
            />
          </ApplePanel>

          <ApplePanel
            title="Other settings"
            subtitle="Fine-tune the information included in the PDF."
            actions={<SaveSettingsButton settings={pdfSettings} format={format} />}
          >
            <OtherSettings pdfSettings={pdfSettings} handleChange={handleChange} />
          </ApplePanel>
        </div>

        <div className="apple-stack apple-sticky-column">
          <ApplePanel
            title="Custom title page"
            subtitle="Preview the title page that will be included in the export."
            actions={(
              <>
                <AddCustomTitleButton format={format} />
                <DeleteCustomTitleButton format={format} />
              </>
            )}
          >
            <CustomTitlePreview format={format} />
          </ApplePanel>
        </div>
      </div>
    </section>
  );
}

export default PdfExport;
