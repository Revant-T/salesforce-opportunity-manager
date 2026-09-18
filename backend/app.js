const express = require('express');
const axios = require('axios');
const jsforce = require('jsforce');
const crypto = require('crypto');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Platform Event subscriber
let streamingConn = null;

// React clients listening for Platform Events
const eventClients = new Set();
// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

// ======================================================
// SESSION
// ======================================================

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite:
            process.env.NODE_ENV === 'production'
                ? 'none'
                : 'lax'
    }
}));

function startPlatformEventListener(accessToken, instanceUrl) {
    try {
        // Create a Salesforce Streaming connection
        streamingConn = new jsforce.Connection({
            instanceUrl,
            accessToken
        });

        const topic = '/event/OpportunityEvent__e';

        console.log(`Subscribing to ${topic}...`);

  streamingConn.streaming.topic(topic).subscribe(
    message => {
        console.log('\n================================');
        console.log('Platform Event Received');
        console.log(JSON.stringify(message, null, 2));
        console.log('================================\n');

        const payload =
            message?.payload ||
            message?.data?.payload ||
            {};

        const eventData = {
            opportunityName:
                payload.OpportunityName__c || '',
            stage:
                payload.Stage__c || ''
        };

        for (const client of eventClients) {
            client.write(
                `data: ${JSON.stringify(eventData)}\n\n`
            );
        }
    },
    {
        replayId: -1
    }
);

        console.log(
            'Platform Event listener started'
        );

    } catch (error) {
        console.error(
            'Failed to start Platform Event listener:',
            error
        );
    }
}

// ======================================================
// STEP 1 - SALESFORCE LOGIN
// ======================================================

app.get('/auth/login', (req, res) => {
    try {
        const codeVerifier = crypto
            .randomBytes(32)
            .toString('base64url');

        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');

        req.session.code_verifier = codeVerifier;

        const loginUrl =
            `${process.env.SF_LOGIN_URL}/services/oauth2/authorize` +
            `?response_type=code` +
            `&client_id=${encodeURIComponent(process.env.SF_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(process.env.SF_REDIRECT_URI)}` +
            `&code_challenge=${encodeURIComponent(codeChallenge)}` +
            `&code_challenge_method=S256`;

        console.log('Redirecting to Salesforce...');

        res.redirect(loginUrl);

    } catch (error) {
        console.error('OAuth login error:', error);
        res.status(500).send('Unable to start Salesforce login');
    }
});

// ======================================================
// STEP 2 - SALESFORCE CALLBACK
// ======================================================

app.get('/callback', async (req, res) => {
    try {

        console.log('\nOAuth callback received');

        if (!req.query.code) {
            return res
                .status(400)
                .send('Authorization code missing');
        }

        if (!req.session.code_verifier) {
            return res
                .status(400)
                .send('PKCE verifier missing from session');
        }

        const response = await axios.post(
            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    code: req.query.code,
                    client_id: process.env.SF_CLIENT_ID,
                    client_secret: process.env.SF_CLIENT_SECRET,
                    redirect_uri: process.env.SF_REDIRECT_URI,
                    code_verifier: req.session.code_verifier
                }
            }
        );

        const {
            access_token,
            instance_url
        } = response.data;

        console.log('OAuth successful!');
        console.log('Instance URL:', instance_url);

        // Store Salesforce connection in the session
        req.session.salesforce = {
            accessToken: access_token,
            instanceUrl: instance_url
        };
        startPlatformEventListener(
    access_token,
    instance_url
);

        // Remove PKCE verifier after successful OAuth
        delete req.session.code_verifier;

        console.log('Salesforce connection stored in session');
console.log(
    'Redirecting to frontend:',
    process.env.FRONTEND_URL
);
        // Redirect back to React
        res.redirect(process.env.FRONTEND_URL);

    } catch (error) {

        console.error(
            'OAuth callback error:',
            error.response?.data || error.message
        );

        res.status(500).send(
            'Error during Salesforce authentication'
        );
    }
});

app.get('/api/opportunity-events', (req, res) => {
    if (!req.session.salesforce) {
        return res.status(401).json({
            message: 'Not authenticated'
        });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader(
        'Access-Control-Allow-Origin',
        process.env.FRONTEND_URL
    );
    res.setHeader(
        'Access-Control-Allow-Credentials',
        'true'
    );

    res.flushHeaders();

    eventClients.add(res);

    console.log(
        `React event client connected. Total clients: ${eventClients.size}`
    );

    // Keep connection alive
    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
        clearInterval(keepAlive);

        eventClients.delete(res);

        console.log(
            `React event client disconnected. Total clients: ${eventClients.size}`
        );
    });
});
// ======================================================
// AUTH STATUS
// ======================================================

app.get('/api/auth/status', (req, res) => {

    if (!req.session.salesforce) {
        return res.json({
            authenticated: false
        });
    }

    res.json({
        authenticated: true
    });
});

// ======================================================
// LOGOUT
// ======================================================

app.get('/auth/logout', (req, res) => {

    req.session.destroy(error => {

        if (error) {
            console.error('Logout error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to logout'
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is running'
    });
});

app.get('/api/accounts/search', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce.'
            });
        }

        const searchTerm = req.query.q?.trim();

        if (!searchTerm || searchTerm.length < 2) {
            return res.json({
                success: true,
                accounts: []
            });
        }

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        // Escape single quotes for SOQL
        const escapedSearchTerm = searchTerm.replace(/'/g, "\\'");

        const accounts = await conn.query(`
            SELECT Id, Name
            FROM Account
            WHERE Name LIKE '%${escapedSearchTerm}%'
            ORDER BY Name
            LIMIT 10
        `);

        res.json({
            success: true,
            accounts: accounts.records
        });

    } catch (error) {
        console.error('Account search error:', error);

        res.status(500).json({
            success: false,
            message: error?.message || 'Error searching Accounts.'
        });
    }
});

app.get('/api/opportunities', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce.'
            });
        }

        const searchTerm = req.query.search?.trim();
        const stage = req.query.stage?.trim();

        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const pageSize = 10;

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        const conditions = [];

        if (searchTerm) {
            const escapedSearchTerm = searchTerm.replace(/'/g, "\\'");

            conditions.push(
                `Name LIKE '%${escapedSearchTerm}%'`
            );
        }

        if (stage) {
            const escapedStage = stage.replace(/'/g, "\\'");

            conditions.push(
                `StageName = '${escapedStage}'`
            );
        }

        let query = `
            SELECT
                Id,
                Name,
                StageName,
                Amount,
                CloseDate,
                Account.Id,
                Account.Name
            FROM Opportunity
        `;

        if (conditions.length > 0) {
            query += `
                WHERE ${conditions.join(' AND ')}
            `;
        }

        query += `
            ORDER BY CreatedDate DESC
        `;

        const result = await conn.query(query);

        const totalRecords = result.totalSize;
        const totalPages = Math.max(
            Math.ceil(totalRecords / pageSize),
            1
        );

        const safePage = Math.min(page, totalPages);

        const startIndex = (safePage - 1) * pageSize;

        const paginatedRecords = result.records.slice(
            startIndex,
            startIndex + pageSize
        );

        const opportunities = paginatedRecords.map(
            (opportunity) => ({
                ...opportunity,
                salesforceUrl:
                    `${req.session.salesforce.instanceUrl}/${opportunity.Id}`
            })
        );

        res.json({
            success: true,
            opportunities,
            pagination: {
                currentPage: safePage,
                pageSize,
                totalRecords,
                totalPages
            }
        });

    } catch (error) {
        console.error('Opportunity fetch error:', error);

        res.status(500).json({
            success: false,
            message:
                error?.message ||
                'Error fetching Opportunities.'
        });
    }
});

app.get('/api/opportunities/:id', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce.'
            });
        }

        const opportunityId = req.params.id;

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        const result = await conn.query(`
            SELECT
                Id,
                Name,
                StageName,
                Amount,
                Probability,
                CloseDate,
                LeadSource,
                Type,
                NextStep,
                ForecastCategoryName,
                Description,
                CreatedDate,
                Account.Id,
                Account.Name,
                Owner.Id,
                Owner.Name
            FROM Opportunity
            WHERE Id = '${opportunityId}'
            LIMIT 1
        `);

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found.'
            });
        }

        res.json({
            success: true,
            opportunity: {
                ...result.records[0],
                salesforceUrl:
                    `${req.session.salesforce.instanceUrl}/${result.records[0].Id}`
            }
        });

    } catch (error) {
        console.error('Opportunity detail error:', error);

        res.status(500).json({
            success: false,
            message:
                error?.message ||
                'Error fetching Opportunity details.'
        });
    }
});

app.put('/api/opportunities/:id', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce.'
            });
        }

        const opportunityId = req.params.id;

        const {
            name,
            stage,
            closeDate,
            amount,
            probability,
            description,
            leadSource,
            type,
            nextStep,
            forecastCategory,
            accountId
        } = req.body;

        if (!name || !stage || !closeDate) {
            return res.status(400).json({
                success: false,
                message: 'Name, Stage and Close Date are required.'
            });
        }

        if (
            amount !== '' &&
            amount !== null &&
            amount !== undefined &&
            Number(amount) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Amount cannot be negative.'
            });
        }

        if (
            probability !== '' &&
            probability !== null &&
            probability !== undefined
        ) {
            const probabilityValue = Number(probability);

            if (
                probabilityValue < 0 ||
                probabilityValue > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Probability must be between 0 and 100.'
                });
            }
        }

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        const opportunityData = {
            Name: name,
            StageName: stage,
            CloseDate: closeDate
        };

        if (amount !== '' && amount !== null && amount !== undefined) {
            opportunityData.Amount = Number(amount);
        }

        if (
            probability !== '' &&
            probability !== null &&
            probability !== undefined
        ) {
            opportunityData.Probability = Number(probability);
        }

        opportunityData.Description = description || null;
        opportunityData.LeadSource = leadSource || null;
        opportunityData.Type = type || null;
        opportunityData.NextStep = nextStep || null;
        opportunityData.ForecastCategoryName =
            forecastCategory || null;

        if (accountId) {
            opportunityData.AccountId = accountId;
        }

        await conn
            .sobject('Opportunity')
            .update({
                Id: opportunityId,
                ...opportunityData
            });

        res.json({
            success: true,
            message: 'Opportunity updated successfully.',
            opportunityId
        });

    } catch (error) {
        console.error(
            'Opportunity update error:',
            error
        );

        let message = 'Error updating Opportunity.';

        if (error?.body?.message) {
            message = error.body.message;
        } else if (error?.message) {
            message = error.message;
        }

        res.status(500).json({
            success: false,
            message
        });
    }
});

app.delete('/api/opportunities/:id', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce.'
            });
        }

        const opportunityId = req.params.id;

        if (!opportunityId) {
            return res.status(400).json({
                success: false,
                message: 'Opportunity ID is required.'
            });
        }

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        await conn
            .sobject('Opportunity')
            .destroy(opportunityId);

        res.json({
            success: true,
            message: 'Opportunity deleted successfully.',
            opportunityId
        });

    } catch (error) {
        console.error(
            'Opportunity delete error:',
            error
        );

        let message = 'Error deleting Opportunity.';

        if (error?.body?.message) {
            message = error.body.message;
        } else if (error?.message) {
            message = error.message;
        }

        res.status(500).json({
            success: false,
            message
        });
    }
});
// ======================================================
// CREATE OPPORTUNITY
// ======================================================

app.post('/api/opportunities', async (req, res) => {
    try {
        if (!req.session.salesforce) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with Salesforce. Please login first.'
            });
        }

        const {
            name,
            stage,
            closeDate,
            amount,
            probability,
            description,
            leadSource,
            type,
            nextStep,
            forecastCategory,
            accountId
        } = req.body;

        // Required field validation
        if (!name || !stage || !closeDate) {
            return res.status(400).json({
                success: false,
                message: 'Name, Stage and Close Date are required.'
            });
        }

        // Amount validation
        if (amount !== '' && amount !== null && amount !== undefined) {
            if (Number(amount) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount cannot be negative.'
                });
            }
        }

        // Probability validation
        if (probability !== '' && probability !== null && probability !== undefined) {
            const probabilityValue = Number(probability);

            if (probabilityValue < 0 || probabilityValue > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Probability must be between 0 and 100.'
                });
            }
        }

        const conn = new jsforce.Connection({
            instanceUrl: req.session.salesforce.instanceUrl,
            accessToken: req.session.salesforce.accessToken
        });

        const opportunityData = {
            Name: name,
            StageName: stage,
            CloseDate: closeDate
        };

        if (amount !== '' && amount !== null && amount !== undefined) {
            opportunityData.Amount = Number(amount);
        }

        if (probability !== '' && probability !== null && probability !== undefined) {
            opportunityData.Probability = Number(probability);
        }

        if (description) {
            opportunityData.Description = description;
        }

        if (accountId) {
            opportunityData.AccountId = accountId;
        }

        if (leadSource) {
            opportunityData.LeadSource = leadSource;
        }

        if (type) {
            opportunityData.Type = type;
        }

        if (nextStep) {
            opportunityData.NextStep = nextStep;
        }

        if (forecastCategory) {
            opportunityData.ForecastCategoryName = forecastCategory;
        }

        const result = await conn
            .sobject('Opportunity')
            .create(opportunityData);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Salesforce could not create the Opportunity.',
                errors: result.errors
            });
        }

        res.json({
            success: true,
            message: 'Opportunity created successfully.',
            opportunityId: result.id
        });

    } catch (error) {
        console.error('Opportunity creation error:', error);

        let message = 'Error creating Opportunity.';

        if (error?.body?.message) {
            message = error.body.message;
        } else if (error?.message) {
            message = error.message;
        }

        res.status(500).json({
            success: false,
            message
        });
    }
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 3000;

process.on('unhandledRejection', reason => {
    console.error(
        '\nUnhandled Promise Rejection:'
    );
    console.error(reason);
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});