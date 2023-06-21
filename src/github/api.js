const core = require("@actions/core");

const request = require("../utils/request");
const { capitalizeFirstLetter } = require("../utils/string");

async function createCheck(sha, context, lintResult, summary) {
  let annotations = [];
  for (const level of ["error", "warning"]) {
    annotations = [
      ...annotations,
      ...lintResult[level].map((result) => ({
        path: result.path,
        start_line: result.firstLine,
        end_line: result.lastLine,
        annotation_level: level === "warning" ? "warning" : "failure",
        message: result.message,
      })),
    ];
  }

  if (annotations.length > 50) {
    core.info(`
      There are more than 50 errors/warnings.
      Annotations are created for the first 50 issues only.
    `);
    annotations = annotations.slice(0, 50);
  }

  const body = {
    name: "LaTeX Lint",
    head_sha: sha,
    conclusion : lintResult.status,
    output: {
      title: capitalizeFirstLetter(summary),
      summary: `LaTeX Lint found ${summary}`,
      annotations,
    },
  };
  try {
    core.info(`
      Creating GitHub check with ${lintResult.status} conclusion and
      ${annotations.length} annotations
    `);
    await request(`${process.env.GITHUB_API_URL}/repos/${context.repository.repoName}/check-runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${context.token}`,
          "User-Agent": "LaTeX Lint Action",
        },
        body,
      });
    core.info("Check created successfully");
  } catch (err) {
    let errorMessage = err.message;
    if (err.data) {
      try {
        const errorData = JSON.parse(err.data);
        if (errorData.message) {
          errorMessage += `. ${errorData.message}`;
        }
        if (errorData.documentation_url) {
          errorMessage += ` ${errorData.documentation_url}`;
        }
      } catch (e) { }
    }
    core.error(errorMessage);

    throw new Error(`Error trying to create GitHub check: ${errorMessage}`);
  }
}

module.exports = { createCheck };
