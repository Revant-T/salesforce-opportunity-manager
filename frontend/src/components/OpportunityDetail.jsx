import { useEffect, useState } from 'react';
import OpportunityEdit from './OpportunityEdit';
import { apiUrl } from '../api';
function OpportunityDetail({
    opportunityId,
    onClose,
    onDeleted,
    showToast
}) {
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);

    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const loadOpportunity = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(
    apiUrl(`/api/opportunities/${opportunityId}`),
                {
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to load Opportunity.'
                );
            }

            setOpportunity(data.opportunity);

        } catch (error) {
            console.error(
                'Opportunity detail error:',
                error
            );

            setError(
                error.message ||
                'Failed to load Opportunity.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOpportunity();
    }, [opportunityId]);

    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) {
            return '-';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);

            const response = await fetch(
    apiUrl(`/api/opportunities/${opportunityId}`),
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to delete Opportunity.'
                );
            }

            setShowDeleteConfirm(false);

            if (showToast) {
                showToast(
                    'Opportunity deleted successfully.'
                );
            }

            if (onDeleted) {
                onDeleted();
            }

        } catch (error) {
            console.error(
                'Opportunity delete error:',
                error
            );

            setShowDeleteConfirm(false);

            if (showToast) {
                showToast(
                    error.message ||
                    'Failed to delete Opportunity.',
                    'error'
                );
            }
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="detail-card">
                <div className="detail-loading">
                    Loading Opportunity...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-card">
                <div className="result error">
                    {error}
                </div>

                <div className="detail-actions">
                    <button
                        className="secondary-button"
                        onClick={onClose}
                    >
                        Back to List
                    </button>

                    <button
                        className="primary-button"
                        onClick={loadOpportunity}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!opportunity) {
        return null;
    }

    if (editing) {
        return (
            <OpportunityEdit
                opportunityId={opportunityId}
                onCancel={() =>
                    setEditing(false)
                }
                onSaved={async () => {
                    setEditing(false);

                    await loadOpportunity();

                    if (showToast) {
                        showToast(
                            'Opportunity updated successfully.'
                        );
                    }
                }}
            />
        );
    }

    return (
        <div className="detail-card">
            <div className="detail-header">
                <div>
                    <div className="detail-label">
                        OPPORTUNITY
                    </div>

                    <h2>{opportunity.Name}</h2>
                </div>

                <button
                    className="close-button"
                    onClick={onClose}
                >
                    ×
                </button>
            </div>

            <div className="detail-grid">
                <div className="detail-item">
                    <span>Stage</span>
                    <strong>
                        {opportunity.StageName || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Amount</span>
                    <strong>
                        {formatAmount(
                            opportunity.Amount
                        )}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Probability</span>
                    <strong>
                        {opportunity.Probability !== null &&
                        opportunity.Probability !== undefined
                            ? `${opportunity.Probability}%`
                            : '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Close Date</span>
                    <strong>
                        {opportunity.CloseDate || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Account</span>
                    <strong>
                        {opportunity.Account?.Name || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Owner</span>
                    <strong>
                        {opportunity.Owner?.Name || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Lead Source</span>
                    <strong>
                        {opportunity.LeadSource || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Type</span>
                    <strong>
                        {opportunity.Type || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Forecast Category</span>
                    <strong>
                        {opportunity.ForecastCategoryName || '-'}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>Next Step</span>
                    <strong>
                        {opportunity.NextStep || '-'}
                    </strong>
                </div>
            </div>

            <div className="detail-description">
                <span>Description</span>

                <p>
                    {opportunity.Description || '-'}
                </p>
            </div>

            <div className="detail-actions">
                <button
                    className="secondary-button"
                    onClick={onClose}
                >
                    Back to List
                </button>

                <button
                    className="primary-button"
                    onClick={() => setEditing(true)}
                >
                    Edit Opportunity
                </button>

                <button
                    className="delete-button"
                    onClick={() =>
                        setShowDeleteConfirm(true)
                    }
                    disabled={deleting}
                >
                    Delete Opportunity
                </button>

                <a
                    href={opportunity.salesforceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="salesforce-button"
                >
                    Open in Salesforce
                </a>
            </div>

            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Opportunity?</h3>

                        <p>
                            Are you sure you want to delete
                            <strong>
                                {' '}
                                {opportunity.Name}
                            </strong>
                            ?
                        </p>

                        <p className="delete-warning">
                            This action will delete the
                            Opportunity from Salesforce.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setShowDeleteConfirm(false)
                                }
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                className="delete-confirm-button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OpportunityDetail;