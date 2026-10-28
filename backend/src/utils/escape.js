function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, '').trim();
}

module.exports = { escapeRegex, stripHtml };
