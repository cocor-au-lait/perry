# Perry

*Integrate Slack with Tempo and Atlassian Jira to report your worklogs.*

## Overview

Perry is a Slack app that allows you to report your Tempo worklogs directly to a Slack channel by integrating with Atlassian Jira and [Tempo](https://tempo.io) using secure OAuth 2.0 authentication.

## Features

- Secure integration with OAuth 2.0
- Report your Tempo worklogs to a Slack channel

## Getting Started

### Prerequisites

- [Slack CLI](https://tools.slack.dev/slack-cli) installed
- Access to your Slack workspace

### Setup

1. Connect and log in to your workspace:
    ```sh
    slack login
    ```
2. Verify your setup:
    ```sh
    slack doctor
    ```

### Create OAuth 2.0 Apps

This application integrates with two OAuth 2.0 providers: Atlassian and Tempo.

#### Atlassian

1. Go to the [Atlassian Developer Console](https://developer.atlassian.com/console).
2. Create a new OAuth 2.0 integration.
3. Set the required permissions on the Permissions page:
    - User identity API: `read:me`
    - Jira API: `manage:jira-project`, `read:jira-user`
4. On the Authorization page, set the Callback URL to `https://oauth2.slack.com/external/auth/callback`.
5. On the Distribution page, edit the distribution controls and fill in the required fields.
6. Set the Distribution status to "Sharing" to allow integration with other users.
7. You can find the `Client ID` and `Secret` on the Settings page.

#### Tempo

1. Go to `Settings` > `OAuth 2.0 Application` in Tempo.
2. Create a new application:
    - Redirect URI: `https://oauth2.slack.com/external/auth/callback`
    - Client type: Confidential
3. You can find the `Client ID` and `Client Secret` under "Actions" > "Credentials".

### Deploy the Application

1. Install the Slack app to your workspace:
    ```sh
    slack install
    ```
    > You may see a warning like below during installation:
    >
    > ```
    > ⚠️  App manifest contains some components that may require additional information
    >
    > Warning Details:
    >
    > 1: Your app has oauth2 providers. Make sure to add a client secret for each provider via `slack external-auth add-secret` (oauth2_provider_warning)
    > ```
    >
    > `.slack.apps.json` will be created after installation.

2. Add environment variables:
    - `ATLASSIAN_ORGANIZATION_NAME` (from your workspace URL: `<name>.atlassian.net`)
    - `ATLASSIAN_CLIENT_ID`
    - `TEMPO_CLIENT_ID`

    > Note: Client secrets are sensitive data. Be careful not to commit them accidentally.

    ```sh
    slack env add
    ```

3. Add secret variables for each client (`atlassian` and `tempo`):
    ```sh
    slack external-auth add-secret
    ```

4. Deploy the application:
    ```sh
    slack deploy
    ```
    Select `triggers/daily-report.ts` when prompted.

    Setup is complete! 🥳 Great job!

## How to Use

1. `/invite @perry` in your channel
2. Enter `/generate-daily-report` and select "Generate Daily Report" when prompted
3. Integrate the `atlassian` and `tempo` clients (this step may be skipped for now)
4. Start the workflow
5. Select a date > Review reports > Generate the report in your channel!

## Development

1. Copy `.env.example` to `.env` and set environment variables as described above.
2. Start local development and integrate with another Slack application:
    ```sh
    slack run
    ```
    The development application will be named with `(local)`.
    `.slack/apps.dev.json` will also be created.
    > Code changes will be reflected in real time while running.
    > Note: External secrets should also be added for the dev application.

## Troubleshooting

### How to distinguish between the local app and deployed app

Check `.slack/apps.json` and `.slack.dev.json`. These files define the application ID.

### If you see an error with code `missing_client_secret` during integration

You are missing an external auth secret. Please add it using:
```sh
slack external-auth add-secret
```

## 🚧 Architecture

To be documented.
