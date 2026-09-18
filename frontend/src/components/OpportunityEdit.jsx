import { useEffect, useState } from 'react';
import { apiUrl } from '../api';
function OpportunityEdit({
    opportunityId,
    onCancel,
    onSaved
}) {
    const [formData, setFormData] = useState({
        name: '',
        stage: '',
        closeDate: '',
        amount: '',
        probability: '',
        leadSource: '',
        type: '',
        forecastCategory: '',
        nextStep: '',
        description: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadOpportunity = async () => {
            try {
                setLoading(true);

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

                const opportunity = data.opportunity;

                setFormData({
                    name: opportunity.Name || '',
                    stage: opportunity.StageName || '',
                    closeDate: opportunity.CloseDate || '',
                    amount: opportunity.Amount ?? '',
                    probability:
                        opportunity.Probability ?? '',
                    leadSource:
                        opportunity.LeadSource || '',
                    type: opportunity.Type || '',
                    forecastCategory:
                        opportunity.ForecastCategoryName || '',
                    nextStep:
                        opportunity.NextStep || '',
                    description:
                        opportunity.Description || ''
                });

            } catch (error) {
                console.error(
                    'Opportunity load error:',
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

        loadOpportunity();
    }, [opportunityId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (
            !formData.name.trim() ||
            !formData.stage ||
            !formData.closeDate
        ) {
            setError(
                'Name, Stage and Close Date are required.'
            );
            return;
        }

        if (
            formData.amount !== '' &&
            Number(formData.amount) < 0
        ) {
            setError('Amount cannot be negative.');
            return;
        }

        if (
            formData.probability !== '' &&
            (
                Number(formData.probability) < 0 ||
                Number(formData.probability) > 100
            )
        ) {
            setError(
                'Probability must be between 0 and 100.'
            );
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
    apiUrl(`/api/opportunities/${opportunityId}`),
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to update Opportunity.'
                );
            }

            onSaved();

        } catch (error) {
            console.error(
                'Opportunity update error:',
                error
            );

            setError(
                error.message ||
                'Failed to update Opportunity.'
            );
        } finally {
            setSaving(false);
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

    return (
        <div className="detail-card">

            <div className="detail-header">
                <div>
                    <div className="detail-label">
                        EDIT OPPORTUNITY
                    </div>

                    <h2>{formData.name}</h2>
                </div>

                <button
                    type="button"
                    className="close-button"
                    onClick={onCancel}
                >
                    ×
                </button>
            </div>

            {error && (
                <div className="result error edit-error">
                    {error}
                </div>
            )}

            <form
                className="edit-form"
                onSubmit={handleSubmit}
            >

                <div className="edit-grid">

                    <div className="form-field">
                        <label>
                            Opportunity Name *
                        </label>

                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            Stage *
                        </label>

                        <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Stage
                            </option>

                            <option value="Prospecting">
                                Prospecting
                            </option>

                            <option value="Qualification">
                                Qualification
                            </option>

                            <option value="Needs Analysis">
                                Needs Analysis
                            </option>

                            <option value="Value Proposition">
                                Value Proposition
                            </option>

                            <option value="Id. Decision Makers">
                                Id. Decision Makers
                            </option>

                            <option value="Perception Analysis">
                                Perception Analysis
                            </option>

                            <option value="Proposal/Price Quote">
                                Proposal/Price Quote
                            </option>

                            <option value="Negotiation/Review">
                                Negotiation/Review
                            </option>

                            <option value="Closed Won">
                                Closed Won
                            </option>

                            <option value="Closed Lost">
                                Closed Lost
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>
                            Close Date *
                        </label>

                        <input
                            type="date"
                            name="closeDate"
                            value={formData.closeDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            Amount
                        </label>

                        <input
                            type="number"
                            name="amount"
                            min="0"
                            value={formData.amount}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            Probability (%)
                        </label>

                        <input
                            type="number"
                            name="probability"
                            min="0"
                            max="100"
                            value={formData.probability}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            Lead Source
                        </label>

                        <select
                            name="leadSource"
                            value={formData.leadSource}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Lead Source
                            </option>

                            <option value="Web">
                                Web
                            </option>

                            <option value="Phone Inquiry">
                                Phone Inquiry
                            </option>

                            <option value="Partner Referral">
                                Partner Referral
                            </option>

                            <option value="Purchased List">
                                Purchased List
                            </option>

                            <option value="Other">
                                Other
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>
                            Type
                        </label>

                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Type
                            </option>

                            <option value="Existing Business">
                                Existing Business
                            </option>

                            <option value="New Business">
                                New Business
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>
                            Forecast Category
                        </label>

                        <select
                            name="forecastCategory"
                            value={formData.forecastCategory}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Forecast Category
                            </option>

                            <option value="Pipeline">
                                Pipeline
                            </option>

                            <option value="Best Case">
                                Best Case
                            </option>

                            <option value="Commit">
                                Commit
                            </option>

                            <option value="Closed">
                                Closed
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>
                            Next Step
                        </label>

                        <input
                            name="nextStep"
                            value={formData.nextStep}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field full-width">
                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                </div>

                <div className="detail-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={saving}
                    >
                        {saving
                            ? 'Saving...'
                            : 'Save Changes'}
                    </button>

                </div>

            </form>

        </div>
    );
}

export default OpportunityEdit;