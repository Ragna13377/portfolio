import { execFileSync } from 'node:child_process';

// Use the existing Git credential helper in memory; never print or persist credentials.
const lines = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
})
  .trim()
  .split('\n');
const credentials = Object.fromEntries(
  lines.map((line) => {
    const equal = line.indexOf('=');
    return [line.slice(0, equal), line.slice(equal + 1)];
  }),
);
if (!credentials.password)
  throw new Error('No existing GitHub credentials available');
const base = '/repos/Ragna13377/portfolio';
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credentials.password}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}
const mode = process.argv[2] ?? 'status';
if (mode === 'status') {
  const repo = await api(base);
  const pages = await api(`${base}/pages`);
  const runs = await api(`${base}/actions/runs?per_page=3`);
  console.log(
    JSON.stringify({
      repoStatus: repo.status,
      defaultBranch: repo.data.default_branch,
      visibility: repo.data.visibility,
      pagesStatus: pages.status,
      pages:
        pages.status === 200
          ? {
              url: pages.data.html_url,
              buildType: pages.data.build_type,
              status: pages.data.status,
            }
          : pages.data.message,
      runs: runs.data.workflow_runs?.map((run) => ({
        id: run.id,
        sha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        event: run.event,
      })),
    }),
  );
} else if (mode === 'configure') {
  const pages = await api(`${base}/pages`);
  const result = await api(
    `${base}/pages`,
    pages.status === 404 ? 'POST' : 'PUT',
    { build_type: 'workflow' },
  );
  console.log(
    JSON.stringify({
      status: result.status,
      url: result.data?.html_url,
      buildType: result.data?.build_type,
      message: result.data?.message,
    }),
  );
  if (result.status >= 300) process.exitCode = 1;
} else if (mode === 'dispatch') {
  const result = await api(
    `${base}/actions/workflows/pages.yml/dispatches`,
    'POST',
    { ref: 'main', inputs: { publish: 'true' } },
  );
  console.log(
    JSON.stringify({ status: result.status, message: result.data?.message }),
  );
  if (result.status >= 300) process.exitCode = 1;
} else if (mode === 'jobs') {
  const runId = process.argv[3];
  if (!/^\d+$/.test(runId ?? ''))
    throw new Error('Pass a numeric workflow run ID');
  const result = await api(`${base}/actions/runs/${runId}/jobs`);
  console.log(
    JSON.stringify({
      status: result.status,
      jobs: result.data.jobs?.map((job) => ({
        id: job.id,
        name: job.name,
        conclusion: job.conclusion,
        status: job.status,
        steps: job.steps?.map((step) => ({
          name: step.name,
          status: step.status,
          conclusion: step.conclusion,
        })),
      })),
    }),
  );
} else {
  throw new Error('Use status, configure, dispatch, or jobs RUN_ID');
}
