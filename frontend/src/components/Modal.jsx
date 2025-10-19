const Modal = ({ title, children, onClose, actions, contentClassName }) => {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" onClick={onClose} />
      <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className={`bg-mg-cream text-mg-brown rounded-xl shadow-xl max-w-lg w-full p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto ${contentClassName || ''}`}>
          {title && <h2 className="text-xl sm:text-2xl font-extrabold mb-3">{title}</h2>}
          <div className="mb-4 text-sm sm:text-base">{children}</div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
