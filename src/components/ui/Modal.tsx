import React from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const getModalRoot = () => {
  if (typeof window === 'undefined') return null;
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  }
  return modalRoot;
};

export const VerticalModal: React.FC<ModalProps> = ({ open, onClose, children, className }) => {
  if (!open) return null;
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className={`bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative animate-fade-in ${className || ''}`}>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
  const root = getModalRoot();
  return root ? ReactDOM.createPortal(modalContent, root) : null;
};

export const HorizontalModal: React.FC<ModalProps> = ({ open, onClose, children, className }) => {
  if (!open) return null;
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className={`bg-white rounded-lg shadow-lg max-w-5xl w-full p-6 relative animate-fade-in ${className || ''}`}>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
  const root = getModalRoot();
  return root ? ReactDOM.createPortal(modalContent, root) : null;
};

export default VerticalModal; 