import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLicense } from "../../util/http/licensing";
import { LICENSE_INITIAL_STATE } from "../../constants/constants";
import LicenseRecordDetails from "./LicenseRecordDetails";
import LicensePreview from "./LicensePreview";
import SaveLicenseRecordButton from "./SaveLicenseRecordButton";
import DeleteLicenseRecordButton from "./DeleteLicenseRecordButton";
import DeleteLicenseRecordButtonAttachment from "./DeleteLicenseRecordAttachmentButton";
import DownloadLicenseAttachmentButton from "./DownloadLicenseRecordAttachmentButton";
import HelpButton from "./HelpButton";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const LicenseRecord = () => {
  const { id } = useParams();
  const [license, setLicense] = useState({ ...LICENSE_INITIAL_STATE, uuid: id });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['license', id],
    queryFn: ({ signal }) => fetchLicense({ signal, id }),
    enabled: id !== "new",
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLicense(data);
    }
  }, [data]);

  const handleChange = useCallback((key, value) => {
    setLicense(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <section className="apple-legacy-screen apple-license-record-screen">
      <AppleLegacyHeading
        title={id === "new" ? "Add a rating" : "Rating details"}
        subtitle={id === "new" ? "Add a licence, rating or certification record." : "Review and update this licensing record."}
      />
      {isLoading && <LinearProgress />}
      <div className="apple-split-layout apple-license-layout">
        <ApplePanel
          title="License & certification record"
          subtitle="Enter the rating details and validity dates."
          actions={(
            <>
              <HelpButton />
              {license.document && <DownloadLicenseAttachmentButton license={license} />}
              <SaveLicenseRecordButton license={license} handleChange={handleChange} />
              <DeleteLicenseRecordButton license={license} />
              <DeleteLicenseRecordButtonAttachment license={license} />
            </>
          )}
        >
          <LicenseRecordDetails license={license} handleChange={handleChange} />
        </ApplePanel>
        <div className="apple-sticky-column">
          <LicensePreview license={license} />
        </div>
      </div>
    </section>
  );
}

export default LicenseRecord;