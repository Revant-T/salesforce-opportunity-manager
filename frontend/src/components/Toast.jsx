import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) {
        return null;
    }

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === 'success' ? '✓' : '!'}
                </span>

                <span>{message}</span>
            </div>

            <button
                className="toast-close"
                onClick={onClose}
            >
                ×
            </button>
        </div>
    );
}

export default Toast;