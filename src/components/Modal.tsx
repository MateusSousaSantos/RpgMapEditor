export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div>
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}>
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};