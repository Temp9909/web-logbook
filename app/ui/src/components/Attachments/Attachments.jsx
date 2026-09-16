import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
// MUI
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { fetchAttachments } from '../../util/http/attachment';
import AttachmentsTable from './AttachmentsTable';
import AttachmentPreview from './AttachmentPreview';
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const Attachments = () => {
  const [selectedAttachment, setSelectedAttachment] = useState({});

  const { data: attachments, isLoading, isError, error } = useQuery({
    queryKey: ['attachments'],
    queryFn: ({ signal }) => fetchAttachments({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  })
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load attachments' });

  return (
    <section className="apple-legacy-screen apple-attachments-screen">
      <AppleLegacyHeading title="Attachments" subtitle="Browse and manage documents attached to your logbook." />
      <div className="apple-split-layout apple-attachments-layout">
        <ApplePanel title="Files" subtitle="Select an attachment to preview it.">
          {isLoading && <LinearProgress />}
          <AttachmentsTable attachments={attachments} setSelectedAttachment={setSelectedAttachment} embedded />
        </ApplePanel>
        <div className="apple-sticky-column">
          <AttachmentPreview attachment={selectedAttachment} />
        </div>
      </div>
    </section>
  );
}

export default Attachments;