import { Modal, message } from "antd";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

function DeleteModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  item = null,
  itemType = "item",
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item?",
  itemDisplayName = "",
  customContent = null,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) {
      message.error("Delete function not provided");
      return;
    }

    setLoading(true);
    try {
      const result = await onDelete(item);

      if (result && result.success === false) {
        message.error(result.error || `Failed to delete ${itemType}`);
      } else {
        message.success(`${itemType} deleted successfully!`);
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      message.error(`Failed to delete ${itemType}`);
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (customContent) {
      return customContent;
    }

    return (
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={22} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 mb-2 m-0">
            {title}
          </h3>
          <div className="text-slate-600 space-y-2 text-sm">
            <p className="m-0">
              {description}
              {itemDisplayName && (
                <>
                  {" "}
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-800">
                    {itemDisplayName}
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-red-600 font-medium m-0">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
    >
      <div className="p-1">
        {renderContent()}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="admin-btn admin-btn-danger min-w-[100px] justify-center"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteModal;
