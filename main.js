require('dotenv').config();
const axios = require('axios');
const dayjs = require('dayjs');
const extract = require('extract-zip');
const { retry, forEachOf } = require('async');
const { createWriteStream, mkdirSync, rmdirSync } = require('fs');
const { join } = require('path');

const notionAPI = "https://www.notion.so/api/v3";
const notionToken = process.env.NOTION_ACCESS_TOKEN || "";
const userId = process.env.NOTION_USER_ID || "";
const spaceId = process.env.NOTION_SPACE_ID || "";
const fileDownloadToken = process.env.NOTION_DOWNLOAD_FILE_TOKEN || "";

async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

const exportFromNotion = async (backupDir, format) => {
  if (!notionToken) {
    throw new Error("Notion token is empty!!!");
  }

  try {
    let client = axios.create({
      baseURL: notionAPI,
      headers: {
        Cookie: `token_v2=${notionToken}; notion_user_id=${userId}; file_token=${fileDownloadToken}`,
        'x-notion-active-user-header': `${userId}`,
      },
    });

    let { data: { taskId } } = await client.post('enqueueTask', {
      task: {
        eventName: 'exportSpace',
        request: {
          spaceId: spaceId,
          exportOptions: {
            exportType: format,
            timeZone: 'America/New_York',
            locale: 'en',
          },
        },
        actor: {
          table: 'notion_user',
          id: userId,
        },
      },
    });

    console.warn(`Enqueued task ${taskId} (${backupDir}/${format})`);

    let failCount = 0 , exportURL;

    // Wait for exported files to generate
    while (true) {
      if (failCount >= 10) break;
      await sleep(10);
      let { data: { results: tasks } } = await retry(
        { times: 10, interval: 2000 },
        async () => client.post('getTasks', { taskIds: [taskId] })
      );

      let task = tasks.find(t => t.id === taskId);

      if (!task) {
        failCount++;
        console.warn(`No task, waiting.`);
        continue;
      }
      if (!task.status) {
        failCount++;
        console.warn(`No task status, waiting. Task was:\n${JSON.stringify(task, null, 2)}`);
        continue;
      }

      if (task.state === 'in_progress') {
        console.warn(`\nWait... Export generating...: ${task.status.pagesExported} `
          + `(${backupDir}/${format})\n`);
      }
      if (task.state === 'failure') {
        failCount++;
        console.warn(`Task error: ${task.error}`);
        continue;
      }
      if (task.state === 'success') {
        exportURL = task.status.exportURL;
        console.warn(`*** DONE *** | Pages exported: ${task.status.pagesExported} `
          + `(${backupDir}/${format})`);
        break;
      }
    }

    let res = await client({
      method: 'GET',
      url: exportURL,
      responseType: 'stream'
    });

    const now = dayjs();
    const yyyymmdd = now.format('YYYY-MM-DD');
    const fileName = `${format}-${yyyymmdd}.zip`;

    let stream = res.data.pipe(createWriteStream(join(process.cwd(),
      `${backupDir}/${fileName}`)));

    await new Promise((resolve, reject) => {
      stream.on('close', resolve);
      stream.on('error', reject);
    });
  }
  catch (err) {
    console.warn(err);
  }
}

const main = async () => {
  const backupDir = `backups`;
  let cwd = process.cwd();
  mkdirSync(join(cwd, backupDir), { recursive: true });

  const format = "markdown";
  await exportFromNotion(backupDir, format);
}

main();
