import React, { useEffect } from "react";
import { message } from "antd";
import { X } from "lucide-react";
import { useLanguageContext } from "../../contexts/LanguageContext";
import "./LanguageModal.css";

function LanguageModal({ open, onClose }) {
  const { language, setLanguage, t, languageOptions, getLanguageNativeLabel } = useLanguageContext();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    message.success(t("language.changed", { language: getLanguageNativeLabel(code) }));
    onClose();
  };

  return (
    <div className="language-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="language-modal-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("language.choose")}
      >
        <div className="language-modal-header">
          <h2>{t("language.choose")}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="language-modal-grid">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`language-modal-option ${language === option.code ? "active" : ""}`}
              onClick={() => handleLanguageSelect(option.code)}
            >
              {option.nativeLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LanguageModal;
