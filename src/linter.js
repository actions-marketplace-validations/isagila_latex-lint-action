const core = require("@actions/core");
const fs = require("fs");
const process = require('process');

const { run } = require("./utils/action");
const { initLintResult } = require("./utils/lint-result");

class Linter {

  static lint(dir, files) {
    run("sudo apt-get update");
    run("sudo apt-get install -y chktex");
    let result = "";
    process.chdir(`${dir}`);
    files.forEach((file) => {
      let logs = "";
      if (fs.existsSync(".chktexrc")) {
        logs = run(`chktex -q -f%f:%k:%l:%m -l .chktexrc -I1 ${file}`).stdout;
      } else {
        logs = run(`chktex -q -f%f:%k:%l:%m -I1 ${file}`).stdout;
      }
      result += "\n" + logs.trim();
    });
    return result.trim();
  }

  static parseOutput(dir, output) {
    const lintResult = initLintResult();
    if (output.length == 0) {
      return lintResult;
    }

    const lines = output.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(":");
      const file = `${dir}/${parts[0]}`;
      const kind = parts[1];
      const line = parseInt(parts[2]);
      const message = parts[3];
      if (kind === "Warning") {
        lintResult.warning.push({
          path: file,
          firstLine: line,
          lastLine: line,
          message
        });
        if (lintResult.status === "success") {
          lintResult.status = "neutral";
        }
      } else if (kind === "Error") {
        lintResult.error.push({
          path: file,
          firstLine: line,
          lastLine: line,
          message
        });
        if (lintResult.status !== "failure") {
          lintResult.status = "failure";
        }
      }
    }

    return lintResult;
  }
}

module.exports = Linter;
