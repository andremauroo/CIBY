import { useEffect, useRef, type ReactNode } from "react";
export const asset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/${name}`;
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`button ${secondary ? "secondary" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    ref.current
      ?.querySelector<HTMLInputElement>("input:not([type=checkbox])")
      ?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Chiudi finestra"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function FoodImage({
  file,
  size = 48,
}: {
  file: string;
  size?: number;
}) {
  return (
    <span
      className="food-art"
      style={{ width: size, height: file === "e9eda.svg" ? 144 : size }}
    >
      <img src={asset(file)} alt="" />
    </span>
  );
}
