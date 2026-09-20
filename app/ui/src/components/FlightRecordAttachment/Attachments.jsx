import { useQuery } from "@tanstack/react-query";
import ApplePanel from "../UIElements/ApplePanel";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchFlightRecordAttachments } from "../../util/http/attachment";
import Attachment from "./Attachment";
import AddAttachmentButton from "./AddAttachmentButton";

const ActionButtons = ({ id }) => <AddAttachmentButton id={id} />;

export const Attachments = ({ id }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attachments', id],
    queryFn: ({ signal }) => fetchFlightRecordAttachments({ signal, id }),
    enabled: id !== "new",
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load attachments' });

  if (id === "new") return null;

  return (
    <ApplePanel title="Attachments" subtitle="Documents and tracks attached to this flight." actions={<ActionButtons id={id} />}>
      <div className="apple-list-stack">
        {(Array.isArray(data) ? data : []).map((attachment) => (
          <Attachment key={attachment.uuid} attachment={attachment} />
        ))}
        {!isLoading && (!Array.isArray(data) || data.length === 0) ? <div className="apple-empty-state">No attachments</div> : null}
      </div>
    </ApplePanel>
  );
}

export default Attachments;
