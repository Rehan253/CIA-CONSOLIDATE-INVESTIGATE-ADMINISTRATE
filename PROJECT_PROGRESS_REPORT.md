# CIA Project — Progress Report
## Consolidate · Investigate · Administrate

**Student:** Rehan Shafique  
**Email:** rehan.shafique.253@gmail.com  
**Date Started:** May 2026

---

## Project Overview

The CIA project requires building and securing a multi-tier web application composed of 4 virtual machines:

| VM | Role | Technology |
|----|------|-----------|
| Machine 1 | Frontend (React dashboard) | React + TypeScript + Redux |
| Machine 2 | Backend API | Node.js + Express + TypeORM |
| Machine 3 | Database | MySQL 5.7 |
| Machine 4 | Monitoring | Portainer (Docker UI) |

**Core Requirements:**
- Functional inventory/product management system (not only user management)
- All services must run in Docker containers as user `service-web`
- Proper HTTP request logging with Morgan
- GitLab CI/CD pipeline for automated builds
- Security hardening (Docker non-root user, JWT auth, Helmet middleware)

---

## Architecture Diagram

```
Browser (port 3000)
    |
    v
[Machine 1] React Frontend
    | HTTP requests with JWT token
    v
[Machine 2] Node.js API (port 3001)
    | TypeORM queries
    v
[Machine 3] MySQL Database (port 3306)

[Machine 4] Portainer — monitors all Docker containers
```

---

## Step-by-Step Progress Log

---

### STEP 1 — Environment Setup (WSL + Docker)

**What we did:**
- Identified that Machine 3 (MySQL) could not be imported due to insufficient disk space in WSL
- WSL stores all Linux files in a `.vhdx` virtual disk file on Windows — it does NOT auto-shrink when files are deleted
- Used Windows `diskpart` utility to compact the VHDX file after `wsl --shutdown`

**Command used to compact WSL disk:**
```
# In Windows Command Prompt (run as Administrator):
diskpart
select vdisk file="C:\Users\LENOVO\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu_79rhkp1fndgsc\LocalState\ext4.vhdx"
attach vdisk readonly
compact vdisk
detach vdisk
exit
```

**Result:** Recovered ~20 GB of disk space. WSL now has enough space to work.

**Key concept learned:** A VHDX file is a virtual hard disk. When Linux deletes files inside WSL, the VHDX doesn't shrink automatically — `compact vdisk` physically reclaims the unused space on the Windows side.

---

### STEP 2 — Install Docker Engine in WSL

**Why:** Docker Desktop was not properly integrated with WSL2. We installed Docker Engine directly inside WSL for reliability.

**Commands used:**
```bash
# Remove old Docker versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Add Docker's official GPG key
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo service docker start

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker
```

**Result:** Docker Engine 28.4.0 running successfully in WSL.

**Key concept learned:** Docker runs as a daemon (background service). Your user needs to be in the `docker` group to run Docker commands without `sudo`.

---

### STEP 3 — Start MySQL Database (Machine 3)

**What we did:** Instead of importing Machine 3 VM, we ran MySQL in a Docker container directly in WSL.

**Command used:**
```bash
docker run --name mysql-cia \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=dev_db \
  -p 3306:3306 \
  -d mysql:5.7
```

**What this means:**
- `--name mysql-cia` → container is named "mysql-cia"
- `-e MYSQL_ROOT_PASSWORD=root` → sets root password to "root"
- `-e MYSQL_DATABASE=dev_db` → creates a database called "dev_db" automatically
- `-p 3306:3306` → exposes port 3306 from the container to WSL host
- `-d mysql:5.7` → runs MySQL version 5.7 in detached (background) mode

**Verify it's running:**
```bash
docker ps
```

**Result:** MySQL running on port 3306, database `dev_db` created automatically.

---

### STEP 4 — Node.js Version Upgrade

**Why:** The project originally required Node v12, but Docker and modern tools work better with Node 18+.

**Commands used:**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node 18
nvm install 18
nvm use 18

# Verify
node --version  # should show v18.x.x
```

**Result:** Node 18 installed and active.

---

### STEP 5 — Start the Backend API (Machine 2)

**What we did:** 
- Installed backend dependencies
- Fixed a port conflict (changed from port 3000 to 3001)
- Fixed sqlite3 native compilation issue by skipping native scripts

**Commands to start backend (run these every time):**
```bash
cd /home/rehan/projects/CIA-CONSOLIDATE-INVESTIGATE-ADMINISTRATE/back_student/back_student/back_student

# First time only — install dependencies
yarn install --ignore-scripts

# Start the backend (every time)
DB_HOST=localhost yarn start
```

**What `DB_HOST=localhost` does:** Tells TypeORM (the database library) to connect to MySQL at `localhost:3306` (our Docker container).

**Port change made:** In [src/index.ts](back_student/back_student/back_student/src/index.ts), changed `app.listen(3000)` to `app.listen(3001)` to avoid conflict with the frontend.

**Result:** Backend API running on `http://localhost:3001`
- TypeORM auto-creates the `user` table in MySQL on first run
- Migration automatically creates `admin` user with password `admin`

---

### STEP 6 — Start the Frontend (Machine 1)

**Why the special NODE_OPTIONS:** The frontend uses `react-scripts 3.2.0` which uses an old version of webpack. Node 18+ uses OpenSSL 3 which is incompatible. The flag `--openssl-legacy-provider` tells Node to use the old OpenSSL behavior.

**Commands to start frontend (run these every time):**
```bash
cd /home/rehan/projects/CIA-CONSOLIDATE-INVESTIGATE-ADMINISTRATE/front_student/front_student

# First time only — install dependencies
yarn install

# Start the frontend (every time)
REACT_APP_API_URL=localhost:3001 NODE_OPTIONS=--openssl-legacy-provider yarn start
```

**What `REACT_APP_API_URL=localhost:3001` does:** Tells the React app where the backend API is. It's used in [src/store/actions/account.actions.ts](front_student/front_student/src/store/actions/account.actions.ts) as `http://${process.env.REACT_APP_API_URL}`.

**Result:** Frontend running on `http://localhost:3000`  
Login with: `admin` / `admin`

---

### STEP 7 — Verified Login Works End-to-End

**What we verified:**
1. Frontend at `http://localhost:3000` shows login page
2. Enter username: `admin`, password: `admin`
3. Frontend POSTs to `http://localhost:3001/auth/login`
4. Backend validates credentials against MySQL database
5. Backend returns a JWT token
6. Frontend stores JWT in a cookie named `token`
7. All future API requests include this token in the `auth` header
8. Dashboard loads successfully

**JWT explained:** A JSON Web Token is a signed string that proves who you are without the server needing to store session data. It has 3 parts separated by dots: `header.payload.signature`. The server can verify it's genuine using a secret key.

---

## Current State of the Application

### What EXISTS in the app right now:

**Backend API endpoints:**
| Method | URL | What it does | Protected? |
|--------|-----|-------------|-----------|
| POST | `/auth/login` | Login, returns JWT token | No |
| POST | `/auth/register` | Create new account | No |
| GET | `/auth/me` | Get current user info | Yes (JWT) |
| POST | `/auth/change-password` | Change password | Yes (JWT) |
| GET | `/user/` | List all users | Yes (Admin only) |
| GET | `/user/:id` | Get one user | Yes (Admin only) |
| POST | `/user/` | Create user | Yes (Admin only) |
| PATCH | `/user/:id` | Edit user | Yes (Admin only) |
| DELETE | `/user/:id` | Delete user | Yes (Admin only) |

**Frontend pages:**
| Page | Status |
|------|--------|
| Login | Working, connected to real API |
| Register | Working, connected to real API |
| Dashboard/Home | Working (shows stats) |
| Products | UI exists but uses LOCAL state only (NOT connected to API) |
| Orders | UI exists but uses LOCAL state only (NOT connected to API) |
| Users | UI exists (uses local state) |

### What is MISSING (needs to be built):

1. **Backend: Product entity** — No `product` table in the database yet
2. **Backend: ProductController** — No CRUD logic for products
3. **Backend: Product routes** — No `/product` API endpoints
4. **Frontend: Connect Products to API** — Currently products only exist in browser memory (lost on page refresh)
5. **Logging improvements** — Morgan logging has minor issues
6. **Docker: service-web user** — Dockerfiles need to run as non-root `service-web` user
7. **GitLab CI/CD** — Automated build pipeline

---

## Quick Start Commands (Every Session)

Open 3 terminal tabs in WSL:

**Terminal 1 — MySQL (only if container is stopped):**
```bash
docker start mysql-cia
# OR if it's already running, this does nothing harmful
docker ps  # check if mysql-cia is in the list
```

**Terminal 2 — Backend:**
```bash
cd /home/rehan/projects/CIA-CONSOLIDATE-INVESTIGATE-ADMINISTRATE/back_student/back_student/back_student
DB_HOST=localhost yarn start
```

**Terminal 3 — Frontend:**
```bash
cd /home/rehan/projects/CIA-CONSOLIDATE-INVESTIGATE-ADMINISTRATE/front_student/front_student
REACT_APP_API_URL=localhost:3001 NODE_OPTIONS=--openssl-legacy-provider yarn start
```

Then open browser: `http://localhost:3000`  
Login: `admin` / `admin`

---

## Next Steps (Pending Work)

### STEP 8 — Add Product Backend API (TODO)
- Create `src/entity/Product.ts` — defines the `product` table in MySQL
- Create `src/controller/ProductController.ts` — CRUD operations
- Create `src/routes/product.ts` — REST endpoint definitions
- Update `src/routes/index.ts` — mount the new routes

### STEP 9 — Connect Frontend Products to API (TODO)
- Update `src/store/actions/products.action.ts` — add API calls with axios
- Update `src/components/Products/Products.tsx` — fetch products on load
- Update `src/components/Products/ProductsForm.tsx` — save to API on submit

### STEP 10 — Fix Morgan Logging (TODO)
- Remove invalid `true` argument from `morgan()` calls in `src/index.ts`
- Ensure logs are properly formatted and captured

### STEP 11 — Docker Configuration (TODO)
- Create `Dockerfile` for backend with `service-web` user
- Create `Dockerfile` for frontend with `service-web` user
- Create `docker-compose.yml` to orchestrate all services

### STEP 12 — GitLab CI/CD (TODO)
- Create `.gitlab-ci.yml` pipeline file
- Configure build, test, and deploy stages
