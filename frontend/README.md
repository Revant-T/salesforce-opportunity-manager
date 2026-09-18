# Salesforce Opportunity Manager

A full-stack Salesforce application built with React, Node.js, Express, jsforce, and Salesforce Platform Events.

The application allows users to authenticate with Salesforce, create and manage Opportunities, search Accounts, and receive real-time Opportunity updates through Salesforce Platform Events.

## Features

* Salesforce OAuth 2.0 authentication with PKCE
* Session-based Salesforce authentication
* Create Opportunities
* View Opportunities
* Search Opportunities by name
* Filter Opportunities by Stage
* Pagination
* View Opportunity details
* Edit Opportunities
* Delete Opportunities
* Account autocomplete/search
* Salesforce record links
* Toast notifications
* Salesforce Platform Event integration
* Real-time Opportunity updates
* Server-Sent Events (SSE) from Node.js to React
* Responsive UI

## Architecture


React + Vite
     |
     | HTTP / SSE
     v
Node.js + Express
     |
     | jsforce / Salesforce REST API
     v
Salesforce
     |
     | Apex Trigger
     v
OpportunityEvent__e
     |
     | Streaming API
     v
Node.js
     |
     | Server-Sent Events
     v
React


## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express
* Axios
* jsforce
* express-session
* CORS

### Salesforce

* Salesforce OAuth 2.0
* Apex
* Opportunity
* Account
* High Volume Platform Event
* Salesforce Streaming API

## Project Structure


sf-platform-events/
│
├── backend/
│   ├── app.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── OpportunityForm.jsx
│   │   │   ├── OpportunityList.jsx
│   │   │   ├── OpportunityDetail.jsx
│   │   │   ├── OpportunityEdit.jsx
│   │   │   └── Toast.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── .gitignore
└── README.md


## Local Setup

### 1. Clone the repository


git clone <your-repository-url>
cd sf-platform-events


### 2. Install backend dependencies


cd backend
npm install

Create `backend/.env` using the values from `.env.example`.

### 3. Install frontend dependencies

cd ../frontend
npm install

Create `frontend/.env`:

VITE_API_URL=http://localhost:3000

### 4. Start the backend

cd backend
node app.js

Backend:

http://localhost:3000

### 5. Start the frontend

Open another terminal:

cd frontend
npm run dev

Frontend:

http://localhost:5173

## Salesforce OAuth

The Salesforce Connected App must contain the backend callback URL.

For local development:

http://localhost:3000/callback

The application uses Authorization Code OAuth with PKCE.

## Platform Event

The application uses the Salesforce Platform Event:

OpportunityEvent__e

The event contains:

OpportunityName__c
Stage__c

An Apex trigger publishes the event when an Opportunity is inserted or updated.

Node.js subscribes to the Platform Event using jsforce Streaming API.

The event is then forwarded to the React application through Server-Sent Events.

## Real-Time Flow

Opportunity Created/Updated
          |
          v
Apex Trigger
          |
          v
OpportunityEvent__e
          |
          v
Salesforce Streaming API
          |
          v
Node.js / jsforce
          |
          v
Server-Sent Events
          |
          v
React
          |
          v
Toast + Opportunity List Refresh

## Environment Variables

Never commit real Salesforce credentials.

### Backend

SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_REDIRECT_URI=
SF_LOGIN_URL=
SESSION_SECRET=
FRONTEND_URL=

### Frontend

VITE_API_URL=

## Future Deployment

The planned production setup is:

React / Vercel
      |
      v
Node.js / Render
      |
      v
Salesforce

The Salesforce OAuth callback URL and frontend/backend environment variables must be updated for the deployed URLs.
