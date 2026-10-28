const AuditLog = require("../models/AuditLog");

async function logAudit({ admin, action, entity, entityId, details }) {
  await AuditLog.create({
    admin: admin?._id || admin,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    details,
  });
}

module.exports = { logAudit };
