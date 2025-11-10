import HttpService from "@/services/base/http.service";
import type {
  CreateGLAuditLogPayload,
  GLAuditLog,
} from "@/types/models/gl-audit-log";

class GLAuditLogService extends HttpService<GLAuditLog> {
  constructor() {
    super("");
  }

  async createLog(payload: CreateGLAuditLogPayload) {
    return this.post<GLAuditLog>("api_create_gl_audit_log", payload);
  }

  async getLogs(params?: Record<string, any>) {
    return this.getList<GLAuditLog[]>("gl_audit_logs_list", params);
  }
}

const glAuditLogService = new GLAuditLogService();

export default glAuditLogService;

