function stripHtml(html) {
  if (!html) return null;
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

module.exports = { stripHtml };
