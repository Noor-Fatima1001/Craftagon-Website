const AuditLog = require('../models/AuditLog');

async function audit(admin, action, entity, entityId, details) {
  await AuditLog.create({
    admin: admin?._id,
    action,
    entity,
    entityId: entityId ? String(entityId) : '',
    details: details || '',
  });
}

module.exports = { audit };
