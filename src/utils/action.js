const { execSync } = require("child_process");
const core = require("@actions/core");

function getEnv(name, required = false) {
  const nameUppercase = name.toUpperCase();
  const value = process.env[nameUppercase];
  if (value == null) {
    if (required) {
      throw new Error(`Environment variable "${nameUppercase}" is not defined`);
    }
    return null;
  }
  return value;
}

function run(cmd, options) {
  const defaults = { dir: null, ignoreErrors: false, prefix: "" };
  const optionsWithDefaults = {
    ...defaults,
    ...options,
  };
  core.debug(cmd);

  try {
    const stdout = execSync(cmd, {
      encoding: "utf8",
      cwd: optionsWithDefaults.dir,
      maxBuffer: 20 * 1024 * 1024,
    });
    const output = {
      status: 0,
      stdout: stdout.trim(),
      stderr: "",
    };
    core.debug(`Stdout: ${output.stdout}`);

    return output;
  } catch (err) {
    const output = {
      status: err.status,
      stdout: err.stdout.trim(),
      stderr: err.stderr.trim(),
    };

    core.debug(`Exit code: ${output.status}`);
    core.debug(`Stdout: ${output.stdout}`);
    core.debug(`Stderr: ${output.stderr}`);

    return output;
  }
}

module.exports = {
  getEnv,
  run,
};
