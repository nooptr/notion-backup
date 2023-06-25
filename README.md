# notion-backup

This is a very simple tool to export a workspace from [Notion](https://www.notion.so/), designed
to work as part of a GitHub workflow.

It's forked from [the original](https://github.com/darobin/notion-backup) (`notion-backup`), and offers additional functionality, such as:

- Choosing export type
- Backing up **multiple spaces** from **multiple users** into nice and neat directories
- Blazingly fast backups, achieved by using asynchronous calls :fire:

It reads `NOTION_ACCESS_TOKEN` and `NOTION_SPACE_ID` from the environment, and outputs the export to both
`html` and `markdown` directories in the current working directory, as well as to `html.zip` and
`markdown.zip`.

## Obtaining tokens

Automatically downloading backups from Notion requires two unique authentication tokens and your individual space ID which must be obtained for the script to work.

1. Log into your Notion account in your browser of choice if you haven't done so already.
2. Open a new tab in your browser and open the development tools. This is usually easiest done by right-click and selecting `Inspect Element` (Chrome, Edge, Safari) or `Inspect` (Firefox). Switch to the Network tab.
3. Open https://notion.so/f/. You must use this specific subdirectory to obtain the right cookies.
4. Insert `getSpaces` into the search filter of the Network tab. This should give you one result. Click on it.
5. In the Preview tab, look for the key `space`. There you should find a list of all the workspaces you have access to. Unless you're part of shared workspaces there should only be one.
6. Copy the UUID of the workspace you want to backup (e.g. `6e560115-7a65-4f65-bb04-1825b43748f1`). This is your `NOTION_SPACE_ID`.
6. Switch to the Application (Chrome, Edge) or Storage (Firefox, Safari) tab on the top.
7. In the left sidebar, select `Cookies` -> `https://www.notion.so` (Chrome, Edge, Firefox) or `Cookies – https://www.notion.so` (Safari).
8. Copy the value of `token_v2` as your `NOTION_ACCESS_TOKEN` and the value of `file_token` as your `NOTION_DOWNLOAD_FILE_TOKEN`.
9. Set the three environment variables as secrets for actions in your GitHub repository.

**NOTE**: if you log out of your account or your session expires naturally, the `NOTION_ACCESS_TOKEN` and `NOTION_DOWNLOAD_FILE_TOKEN` will get invalidated and the backup will fail. In this case you need to obtain new tokens by repeating this process. There is currently no practical way to automize this until Notion decide to add a backup endpoint to their official API, at which point this script will be able to use a proper authentication token.

## Installation

```
npm install
cp .env.example .env
```

Change ```.env``` file

## Run

```
node main.js
```