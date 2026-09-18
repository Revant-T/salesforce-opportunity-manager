import { useEffect, useState } from 'react';
import OpportunityForm from './components/OpportunityForm';
import OpportunityList from './components/OpportunityList';
import Toast from './components/Toast';
import { apiUrl } from './api';

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('list');

    const [toast, setToast] = useState({
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({
            message,
            type
        });
    };

    const closeToast = () => {
        setToast({
            message: '',
            type: 'success'
        });
    };
    const [opportunityRefreshKey, setOpportunityRefreshKey] = useState(0);

    useEffect(() => {
        fetch(apiUrl('/api/auth/status'), {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                setAuthenticated(data.authenticated);
                setLoading(false);
            })
            .catch(error => {
                console.error(
                    'Authentication check failed:',
                    error
                );

                setLoading(false);
            });
    }, []);
useEffect(() => {
    if (!authenticated) {
        return;
    }

    console.log(
        'Starting Platform Event connection...'
    );

    const eventSource = new EventSource(
        apiUrl('/api/opportunity-events'),
        {
            withCredentials: true
        }
    );

    eventSource.onopen = () => {
        console.log(
            'Connected to Salesforce Platform Events'
        );
    };

    eventSource.onmessage = event => {
        console.log(
            'Raw Platform Event:',
            event.data
        );

        try {
            const data = JSON.parse(event.data);

            console.log(
                'Salesforce Platform Event:',
                data
            );

            showToast(
                `Opportunity "${data.opportunityName}" updated to ${data.stage}`,
                'success'
            );
            setOpportunityRefreshKey(
    previous => previous + 1
);
        } catch (error) {
            console.error(
                'Failed to process Platform Event:',
                error
            );
        }
    };

    eventSource.onerror = error => {
        console.error(
            'Platform Event connection error:',
            error
        );
    };

    return () => {
        console.log(
            'Closing Platform Event connection...'
        );

        eventSource.close();
    };
}, [authenticated]);

    const handleLogin = () => {
        window.location.href =
            apiUrl('/auth/login');
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(
                apiUrl('/auth/logout'),
                {
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error('Logout failed.');
            }

            setAuthenticated(false);

            showToast(
                'Logged out successfully.'
            );

        } catch (error) {
            console.error(
                'Logout failed:',
                error
            );

            showToast(
                error.message ||
                'Logout failed.',
                'error'
            );
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    Checking Salesforce connection...
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            <header className="app-header">
                <div>
                    <div className="app-title">
                        Salesforce Opportunity Manager
                    </div>
                </div>

                {authenticated && (
                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                )}
            </header>

            <main>
                {!authenticated ? (
                    <div className="login-card">
                        <h1>
                            Connect Salesforce
                        </h1>

                        <p>
                            Connect your Salesforce
                            account to create and
                            manage Opportunity
                            records.
                        </p>

                        <button
                            className="login-button"
                            onClick={handleLogin}
                        >
                            Login with Salesforce
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="tab-container">
                            <button
                                type="button"
                                className={
                                    activeTab === 'list'
                                        ? 'tab-button active'
                                        : 'tab-button'
                                }
                                onClick={() =>
                                    setActiveTab('list')
                                }
                            >
                                Opportunities
                            </button>

                            <button
                                type="button"
                                className={
                                    activeTab === 'create'
                                        ? 'tab-button active'
                                        : 'tab-button'
                                }
                                onClick={() =>
                                    setActiveTab('create')
                                }
                            >
                                Create Opportunity
                            </button>
                        </div>

                        {activeTab === 'create' && (
                            <OpportunityForm
                                showToast={showToast}
                            />
                        )}

                        {activeTab === 'list' && (
                            <OpportunityList
    showToast={showToast}
    refreshKey={opportunityRefreshKey}
/>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;