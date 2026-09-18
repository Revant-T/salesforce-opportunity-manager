import { useEffect, useState } from 'react';
import { apiUrl } from '../api';
import OpportunityDetail from './OpportunityDetail';
function OpportunityList({ showToast, refreshKey }) {
    const [opportunities, setOpportunities] = useState([]);

    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('');

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);

    const fetchOpportunities = async (
        searchValue = search,
        stageValue = stage,
        pageValue = page
    ) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            if (searchValue.trim()) {
                params.append(
                    'search',
                    searchValue.trim()
                );
            }

            if (stageValue) {
                params.append('stage', stageValue);
            }

            params.append('page', pageValue);

            const response = await fetch(
    apiUrl(`/api/opportunities?${params.toString()}`),
                {
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to load Opportunities.'
                );
            }

            setOpportunities(
                data.opportunities || []
            );

            setPagination(
                data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalRecords: 0
                }
            );

        } catch (error) {
    setError(error.message);

    showToast(
        error.message ||
        'Failed to load Opportunities.',
        'error'
    );
} finally {
            setLoading(false);
        }
    };

useEffect(() => {
    fetchOpportunities('', '', 1);
}, []);

useEffect(() => {
    if (refreshKey === 0) {
        return;
    }

    fetchOpportunities(
        search,
        stage,
        page
    );
}, [refreshKey]);

    const handleSearch = (event) => {
        event.preventDefault();

        setPage(1);

        fetchOpportunities(
            search,
            stage,
            1
        );
    };

    const handleStageChange = (event) => {
        const newStage = event.target.value;

        setStage(newStage);
        setPage(1);

        fetchOpportunities(
            search,
            newStage,
            1
        );
    };

    const handleRefresh = () => {
        setSearch('');
        setStage('');
        setPage(1);

        fetchOpportunities('', '', 1);
    };

    const handlePrevious = () => {
        if (page <= 1) {
            return;
        }

        const newPage = page - 1;

        setPage(newPage);

        fetchOpportunities(
            search,
            stage,
            newPage
        );
    };

    const handleNext = () => {
        if (page >= pagination.totalPages) {
            return;
        }

        const newPage = page + 1;

        setPage(newPage);

        fetchOpportunities(
            search,
            stage,
            newPage
        );
    };

    const formatAmount = (amount) => {
        if (
            amount === null ||
            amount === undefined
        ) {
            return '-';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div>
        {selectedOpportunityId ? (
 <OpportunityDetail
    opportunityId={selectedOpportunityId}
    onClose={() =>
        setSelectedOpportunityId(null)
    }
    onDeleted={() => {
        setSelectedOpportunityId(null);
        fetchOpportunities(
            search,
            stage,
            page
        );
    }}
    showToast={showToast}
/>
        ) : (
        <div className="opportunity-list-card">

            <div className="list-header">

                <div>
                    <h2>Opportunities</h2>

                    <p>
                        View Opportunities currently
                        stored in Salesforce.
                    </p>
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    Refresh
                </button>

            </div>

            <form
                className="opportunity-search"
                onSubmit={handleSearch}
            >

                <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    placeholder="Search by Opportunity name..."
                />

                <select
                    value={stage}
                    onChange={handleStageChange}
                >
                    <option value="">
                        All Stages
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

                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >
                    Search
                </button>

            </form>

            {loading && (
                <div className="list-message">
                    Loading Opportunities...
                </div>
            )}

            {!loading && error && (
                <div className="result error">
                    {error}
                </div>
            )}

            {!loading &&
                !error &&
                opportunities.length === 0 && (
                    <div className="list-message">
                        No Opportunities found.
                    </div>
                )}

            {!loading &&
                !error &&
                opportunities.length > 0 && (

                    <div className="table-container">

                        <table className="opportunity-table">

                            <thead>
                                <tr>
                                    <th>
                                        Opportunity
                                    </th>

                                    <th>
                                        Account
                                    </th>

                                    <th>
                                        Stage
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Close Date
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {opportunities.map(
                                    (opportunity) => (

                                        <tr
                                            key={
                                                opportunity.Id
                                            }
                                        >

                                            <td>
                                                <button
                                                    className="opportunity-name-button"
                                                    onClick={() =>
                                                        setSelectedOpportunityId(opportunity.Id)
                                                    }
                                                >
                                                    {opportunity.Name}
                                                </button>
                                            </td>

                                            <td>
                                                {
                                                    opportunity
                                                        .Account
                                                        ?.Name || '-'
                                                }
                                            </td>

                                            <td>
                                                <span className="stage-badge">
                                                    {
                                                        opportunity.StageName
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {formatAmount(
                                                    opportunity.Amount
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    opportunity.CloseDate ||
                                                    '-'
                                                }
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )
            }

            {!loading &&
    !error &&
    pagination.totalRecords > 0 && (

        <div className="list-footer">

            <div className="record-count">
                {pagination.totalRecords}{' '}
                {pagination.totalRecords === 1
                    ? 'Opportunity'
                    : 'Opportunities'}
            </div>

            <div className="pagination">

                <button
                    type="button"
                    className="secondary-button"
                    onClick={handlePrevious}
                    disabled={
                        page <= 1 || loading
                    }
                >
                    ← Previous
                </button>

                <span className="page-info">
                    Page {pagination.currentPage}
                    {' '}of{' '}
                    {pagination.totalPages}
                </span>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleNext}
                    disabled={
                        page >=
                        pagination.totalPages ||
                        loading
                    }
                >
                    Next →
                </button>

            </div>

        </div>
    )}

        </div>
        )}
        </div>
    );
}

export default OpportunityList;
