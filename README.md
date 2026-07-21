# Multi-Tenant Enterprise Application Framework

Enterprise-grade multi-tenant architecture featuring physical database-per-tenant isolation, dynamic connection pool routing, Super Admin god-mode impersonation, plan-based feature gating, and dynamic React white-labeling.

---

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.11+), Async SQLAlchemy 2.0, Asyncpg / Aiosqlite, PyJWT, Bcrypt, Pytest
- **Frontend**: React (TypeScript), Dynamic CSS Variables Theme Engine, Vite / Nginx
- **Database & Services**: PostgreSQL 16 (Control DB & Isolated Tenant DBs), Redis 7, Docker Compose

---

## 🏗 System Topology

```
+-----------------------------------+
|        React Frontend (SPA)       |
| - Dynamic White-Label Engine      |
| - Feature Gate Components         |
+-----------------------------------+
                  |
                  | HTTP / REST API
                  v
+-----------------------------------+
|          FastAPI Backend          |
| - Tenant Resolution Middleware    |
| - Dynamic Engine Pool Factory     |
| - Feature Flag Dependency Engine  |
+-----------------------------------+
                  |
        +---------+---------+
        |                   |
        v                   v
+---------------+   +---------------+
|  Control DB   |   |   Tenant DB   |
| - Registry    |   | - Accounts    |
| - Connection  |   | - RBAC        |
| - Feature Flags|  | - Isolation   |
+---------------+   +---------------+
```

---

## 🚀 Quick Start

### 1. Run via Docker Compose
```bash
docker-compose up --build -d
```

### 2. Run Local Backend Tests
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/ -v
```

---

## 🧪 Test Suite Results

```text
tests/test_auth_and_context.py::test_create_and_decode_jwt PASSED
tests/test_auth_and_context.py::test_tenant_routing_middleware PASSED
tests/test_auth_flow.py::test_super_admin_login PASSED
tests/test_e2e_flow.py::test_full_lifecycle_e2e PASSED
tests/test_provisioning_and_gating.py::test_super_admin_provision_tenant_creates_database PASSED
tests/test_provisioning_and_gating.py::test_impersonation_generates_audited_jwt PASSED
tests/test_provisioning_and_gating.py::test_feature_gate_dependency PASSED
tests/test_tenant_isolation.py::test_tenant_a_data_isolated_from_tenant_b PASSED
tests/test_tenant_isolation.py::test_cross_tenant_lookup_denied PASSED

======================== 9 passed in 10.02s ========================
```
