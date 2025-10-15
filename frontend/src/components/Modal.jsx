import React from 'react';

const Modal = ({ title, children, onClose, actions, contentClassName }) => {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" onClick={onClose} />
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className={`bg-mg-cream text-mg-brown rounded-xl shadow-xl max-w-lg w-full p-6 ${contentClassName || ''}`}>
          {title && <h2 className="text-2xl font-extrabold mb-3">{title}</h2>}
          <div className="mb-4">{children}</div>
          {actions && (
            <div className="flex gap-3 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
