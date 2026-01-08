
```

-- BELOW: complete, strict EC2 local-only setup (no Docker) --

1) SSH into your Ubuntu EC2 instance:

```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

2) Update OS and install prerequisites:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ca-certificates gnupg lsb-release unzip software-properties-common
```

3) Clone repository and enter it:

```bash
git clone <REPO_GIT_URL> repo
cd repo
```

4) Install MySQL Server and initialize DB from the repo schema:

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
# Wait a few seconds, then import schema:
sudo mysql < database/init.sql
```

5) Install Java 21 (Temurin) and Maven:

```bash
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
echo 'deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb stable main' | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk maven
```

6) Install Python 3.12+ and pip:

```bash
sudo apt install -y python3 python3-pip python3-venv
```

7) Install Node.js (20.x) and npm:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

8) Install Go (latest stable via snap) and set PATH if needed:

```bash
sudo snap install --classic go
export PATH=$PATH:/snap/bin
```

9) Set required environment variables (example values):

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=glacier
export MYSQL_PASSWORD=glacier
export MYSQL_DATABASE=glacier_ai
export JWT_SECRET="change-me-to-a-secure-secret"
```

10) Start Authentication service (open a new terminal or run in background):

```bash
cd ~/repo/authentication-service
# Option A: foreground
mvn spring-boot:run
# Option B: background
# nohup mvn spring-boot:run > ~/auth.log 2>&1 &
```

11) Start Catalog service:

```bash
cd ~/repo/catalog-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# foreground
uvicorn main:app --host 0.0.0.0 --port 3002
# background
# nohup uvicorn main:app --host 0.0.0.0 --port 3002 > ~/catalog.log 2>&1 &
```

12) Start API Gateway:

```bash
cd ~/repo/apigateway-service
go run main.go
# background
# nohup go run main.go > ~/gateway.log 2>&1 &
```

13) Start Frontend (Vite dev) or build & serve:

```bash
cd ~/repo
npm install
# dev
npm run dev
# or build and serve via a static server
# npm run build
# npx serve -s dist -l 80
```

14) Verify Gateway health:

```bash
curl http://localhost:8080/health
```

15) Notes:
- `database/init.sql` creates required schema and sample data. If import fails run `sudo mysql` and inspect errors.
- If Spring Boot cannot connect to MySQL, set `SPRING_DATASOURCE_URL`/`SPRING_DATASOURCE_USERNAME`/`SPRING_DATASOURCE_PASSWORD` environment variables before starting it.



