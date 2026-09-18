import { useState } from 'react';
import { apiUrl } from '../api';
function OpportunityForm({ showToast }) {
    const [formData, setFormData] = useState({
        name: '',
        stage: '',
        closeDate: '',
        amount: '',
        probability: '',
        description: '',
        leadSource: '',
        type: '',
        nextStep: '',
        forecastCategory: ''
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [accountSearch, setAccountSearch] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchingAccounts, setSearchingAccounts] = useState(false);
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            return 'Opportunity Name is required.';
        }

        if (!formData.stage) {
            return 'Stage is required.';
        }

        if (!formData.closeDate) {
            return 'Close Date is required.';
        }

        if (formData.amount !== '' && Number(formData.amount) < 0) {
            return 'Amount cannot be negative.';
        }

        if (
            formData.probability !== '' &&
            (Number(formData.probability) < 0 ||
                Number(formData.probability) > 100)
        ) {
            return 'Probability must be between 0 and 100.';
        }

        return null;
    };

const searchAccounts = async (value) => {
    setAccountSearch(value);
    setSelectedAccount(null);

    if (value.trim().length < 2) {
        setAccounts([]);
        return;
    }

    setSearchingAccounts(true);

    try {
        const response = await fetch(
    apiUrl(
        `/api/accounts/search?q=${encodeURIComponent(value)}`
    ),
            {
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to search Accounts.'
            );
        }

        setAccounts(data.accounts || []);

    } catch (error) {
        console.error('Account search error:', error);
        setAccounts([]);
    } finally {
        setSearchingAccounts(false);
    }
};

const handleSubmit = async (event) => {
    event.preventDefault();

    setResult(null);

    const validationError = validateForm();

    if (validationError) {
        setResult({
            type: 'error',
            message: validationError
        });

        if (showToast) {
            showToast(validationError, 'error');
        }

        return;
    }

    setLoading(true);

    try {
        const response = await fetch(
    apiUrl('/api/opportunities'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    accountId: selectedAccount?.Id || null
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to create Opportunity.'
            );
        }

        setFormData({
            name: '',
            stage: '',
            closeDate: '',
            amount: '',
            probability: '',
            description: '',
            leadSource: '',
            type: '',
            nextStep: '',
            forecastCategory: ''
        });

        setAccountSearch('');
        setAccounts([]);
        setSelectedAccount(null);

        setResult(null);

        if (showToast) {
            showToast(
                'Opportunity created successfully.'
            );
        }

    } catch (error) {
        setResult({
            type: 'error',
            message: error.message
        });

        if (showToast) {
            showToast(
                error.message ||
                'Failed to create Opportunity.',
                'error'
            );
        }

    } finally {
        setLoading(false);
    }
};

    const handleReset = () => {
        setFormData({
            name: '',
            stage: '',
            closeDate: '',
            amount: '',
            probability: '',
            description: '',
            leadSource: '',
            type: '',
            nextStep: '',
            forecastCategory: ''
        });

        setResult(null);
    };

    return (
        <div className="form-card">
            <div className="form-header">
                <div>
                    <h2>Create Opportunity</h2>
                    <p>
                        Create a Salesforce Opportunity from this web
                        application.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group account-search-container">
                        <label>Account</label>

                        <div className="account-search">
                            <input
                                type="text"
                                value={
                                    selectedAccount
                                        ? selectedAccount.Name
                                        : accountSearch
                                }
                                onChange={(event) =>
                                    searchAccounts(event.target.value)
                                }
                                placeholder="Search Salesforce Accounts..."
                            />

                            {searchingAccounts && (
                                <div className="search-status">
                                    Searching...
                                </div>
                            )}

                            {!searchingAccounts && accounts.length > 0 && !selectedAccount && (
                                <div className="account-results">
                                    {accounts.map((account) => (
                                        <button
                                            type="button"
                                            key={account.Id}
                                            className="account-result"
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setAccountSearch(account.Name);
                                                setAccounts([]);
                                            }}
                                        >
                                            <span className="account-name">
                                                {account.Name}
                                            </span>

                                            <span className="account-id">
                                                {account.Id}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedAccount && (
                            <div className="selected-account">
                                Selected: <strong>{selectedAccount.Name}</strong>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>
                            Opportunity Name
                            <span className="required">*</span>
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter opportunity name"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Stage
                            <span className="required">*</span>
                        </label>

                        <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                        >
                            <option value="">Select Stage</option>
                            <option value="Prospecting">Prospecting</option>
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
                            <option value="Closed Won">Closed Won</option>
                            <option value="Closed Lost">Closed Lost</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            Close Date
                            <span className="required">*</span>
                        </label>

                        <input
                            type="date"
                            name="closeDate"
                            value={formData.closeDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Amount</label>

                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Probability (%)</label>

                        <input
                            type="number"
                            name="probability"
                            value={formData.probability}
                            onChange={handleChange}
                            placeholder="0 - 100"
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Lead Source</label>

                        <select
                            name="leadSource"
                            value={formData.leadSource}
                            onChange={handleChange}
                        >
                            <option value="">Select Lead Source</option>
                            <option value="Web">Web</option>
                            <option value="Phone Inquiry">
                                Phone Inquiry
                            </option>
                            <option value="Partner Referral">
                                Partner Referral
                            </option>
                            <option value="Purchased List">
                                Purchased List
                            </option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Type</label>

                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="">Select Type</option>
                            <option value="Existing Customer - Upgrade">
                                Existing Customer - Upgrade
                            </option>
                            <option value="Existing Customer - Replacement">
                                Existing Customer - Replacement
                            </option>
                            <option value="Existing Customer - Downgrade">
                                Existing Customer - Downgrade
                            </option>
                            <option value="New Customer">New Customer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Forecast Category</label>

                        <select
                            name="forecastCategory"
                            value={formData.forecastCategory}
                            onChange={handleChange}
                        >
                            <option value="">Select Category</option>
                            <option value="Pipeline">Pipeline</option>
                            <option value="BestCase">Best Case</option>
                            <option value="Commit">Commit</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Next Step</label>

                        <input
                            type="text"
                            name="nextStep"
                            value={formData.nextStep}
                            onChange={handleChange}
                            placeholder="Example: Schedule demo"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Description</label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter opportunity description"
                            rows="4"
                        />
                    </div>

                </div>

                {result && (
                    <div
                        className={
                            result.type === 'success'
                                ? 'result success'
                                : 'result error'
                        }
                    >
                        {result.message}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? 'Creating...'
                            : 'Create Opportunity'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default OpportunityForm;
