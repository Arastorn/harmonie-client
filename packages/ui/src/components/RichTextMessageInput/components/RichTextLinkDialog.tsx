import { Button } from '../../Button/Button';
import { Input } from '../../Input/Input';
import { Modal } from '../../Modal/Modal';

interface RichTextLinkDialogProps {
  cancelLabel: string;
  closeLabel: string;
  linkText: string;
  linkTextLabel: string;
  linkUrl: string;
  linkUrlLabel: string;
  onClose: () => void;
  onRemove: () => void;
  onSave: () => void;
  setLinkText: (value: string) => void;
  setLinkUrl: (value: string) => void;
  title: string;
  removeLabel: string;
  saveLabel: string;
}

export const RichTextLinkDialog = ({
  cancelLabel,
  closeLabel,
  linkText,
  linkTextLabel,
  linkUrl,
  linkUrlLabel,
  onClose,
  onRemove,
  onSave,
  removeLabel,
  saveLabel,
  setLinkText,
  setLinkUrl,
  title,
}: RichTextLinkDialogProps) => (
  <Modal title={title} onClose={onClose} closeLabel={closeLabel} maxWidth="max-w-2xl">
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <Input
        label={linkTextLabel}
        value={linkText}
        onChange={(event) => setLinkText(event.target.value)}
        autoFocus
      />
      <Input
        label={linkUrlLabel}
        value={linkUrl}
        onChange={(event) => setLinkUrl(event.target.value)}
        placeholder="https://"
      />
      <div className="flex justify-end gap-3">
        {linkUrl.trim() && (
          <Button type="button" variant="danger" onClick={onRemove}>
            {removeLabel}
          </Button>
        )}
        <Button type="button" variant="tertiary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={!linkText.trim() || !linkUrl.trim()}>
          {saveLabel}
        </Button>
      </div>
    </form>
  </Modal>
);
