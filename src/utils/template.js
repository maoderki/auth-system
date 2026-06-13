const fs = require("fs/promises");

async function renderTemplate(templatePath, variables = {}) {
  let html = await fs.readFile(templatePath, "utf8");

  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  }

  return html;
}

module.exports = {
  renderTemplate,
};