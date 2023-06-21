const { existsSync } = require("fs");
const core = require("@actions/core");

const git = require("./git");
const Linter = require("./linter");
const { createCheck } = require("./github/api");
const { getContext } = require("./github/context");
const { getSummary } = require("./utils/lint-result");

async function runAction() {
  const context = getContext();
  const workingDirectory = core.getInput("working_directory");
  const files = core.getInput("files").split(", ");
  const isPullRequest =
    context.eventName === "pull_request"
    || context.eventName === "pull_request_target";

  if (context.eventName === "pull_request" && context.repository.hasFork) {
    core.error(
      "This action does not have permission to create annotations on forks"
    );
  }
  if (isPullRequest) {
    git.checkOutRemoteBranch(context);
  }

  core.startGroup(`Run LaTeX Lint`);
  if (!existsSync(workingDirectory)) {
    throw new Error(`Directory ${workingDirectory} doesn't exist`);
  }

  const lintOutput = Linter.lint(workingDirectory, files);
  const lintResult = Linter.parseOutput(workingDirectory, lintOutput);
  const summary = getSummary(lintResult);
  const sha = git.getHeadSha();

  core.info(`LaTeX Lint found ${summary} (${lintResult.status})`);
  core.endGroup();

  core.startGroup("Create check runs with commit annotations");
  let groupClosed = false;
  try {
    await createCheck(sha, context, lintResult, summary);
  } catch (err) {
    core.endGroup();
    groupClosed = true;
    core.warning(`
      Some check runs could not be created.
      Error: ${err}
    `);
  }
  if (!groupClosed) {
    core.endGroup();
  }
  if (lintResult.status === "failure") {
    core.setFailed(`
      Linting failures detected.
      See check runs with annotations for details.
    `);
  }
}

runAction().catch((error) => {
  core.debug(error.stack || "No error stack trace");
  core.setFailed(error.message);
});
