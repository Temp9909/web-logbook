import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
// Custom components
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { uploadAttachement } from "../../util/http/attachment";

export const AddAttachmentButton = ({ id }) => {
  const fileInputRef = useRef(null);
  const { mutateAsync: upload, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadAttachement({ payload: data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments'] });
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload attachment' });
  useSuccessNotification({ isSuccess, message: 'Attachment uploaded' });

  const handleFileChange = useCallback(async (event) => {
    for (const file of event.target.files) {
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('id', id);

        await upload({ data: formData });
      }
    }
  }, [upload, id]);

  return (
    <>
      <input ref={fileInputRef} hidden type="file" name="document" onChange={handleFileChange} multiple />
      <button
        type="button"
        className="btn primary exact-primary-action"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {isPending ? 'Adding…' : '＋ Add attachment'}
      </button>
    </>
  );
}

export default AddAttachmentButton;
