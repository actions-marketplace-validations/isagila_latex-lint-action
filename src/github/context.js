const { readFileSync } = require("fs");
const core = require("@actions/core");

const { getEnv } = require("../utils/action");

function parseActionEnv() {
  return {
    actor: getEnv("github_actor", true),
    eventName: getEnv("github_event_name", true),
    eventPath: getEnv("github_event_path", true),
    workspace: getEnv("github_workspace", true),
    token: core.getInput("github_token", { required: true }),
  };
}

function parseEnvFile(eventPath) {
  const eventBuffer = readFileSync(eventPath);
  return JSON.parse(eventBuffer);
}

function parseBranch(eventName, event) {
  if (eventName === "push" || eventName === "workflow_dispatch") {
    return event.ref.substring(11);
  }
  if (eventName === "pull_request" || eventName === "pull_request_target") {
    return event.pull_request.head.ref;
  }
  throw Error(`
    LaTeX Lint Action does not support "${eventName}" GitHub events
  `);
}

function parseRepository(eventName, event) {
  const repoName = event.repository.full_name;
  const cloneUrl = event.repository.clone_url;
  let forkName;
  let forkCloneUrl;
  if (eventName === "pull_request" || eventName === "pull_request_target") {
    const headRepoName = event.pull_request.head.repo.full_name;
    forkName = repoName === headRepoName ? undefined : headRepoName;
    const headForkCloneUrl = event.pull_request.head.repo.clone_url;
    forkCloneUrl = cloneUrl === headForkCloneUrl ? undefined : headForkCloneUrl;
  }
  return {
    repoName,
    cloneUrl,
    forkName,
    forkCloneUrl,
    hasFork: forkName != null && forkName !== repoName,
  };
}

function getContext() {
  const { actor, eventName, eventPath, token, workspace } = parseActionEnv();
  const event = parseEnvFile(eventPath);
  return {
    actor,
    branch: parseBranch(eventName, event),
    event,
    eventName,
    repository: parseRepository(eventName, event),
    token,
    workspace,
  };
}

module.exports = {
  getContext,
  parseActionEnv,
  parseBranch,
  parseEnvFile,
  parseRepository,
};
