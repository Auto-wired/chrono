# Chrono: 스마트 일정 관리 앱

Chrono는 Next.js, MariaDB, Prisma, NextAuth를 기반으로 구축된 현대적인 일정 관리 애플리케이션입니다.

## CI/CD 및 배포 가이드

이 문서는 GitHub Actions와 Docker Watchtower를 활용하여 Chrono 애플리케이션의 자동 빌드, 배포 및 업데이트 파이프라인을 구축하는 방법을 설명합니다.

### 1. GitHub Actions Secrets 설정
GitHub Repository에서 다음 Secret들을 설정해야 합니다. 이 Secret들은 `.github/workflows/deploy.yml` 파일에서 Docker 이미지 빌드 및 푸시 과정에 사용됩니다.

*   `GITHUB_TOKEN`: (필수) GitHub Actions에 기본 제공되는 토큰으로, `packages: write` 권한이 자동으로 부여됩니다. 별도로 생성할 필요 없습니다.

### 2. 운영 서버 설정 (docker-compose.yml)
운영 서버의 `/home/your-username/apps/chrono-app/` 경로에 다음 `docker-compose.yml` 파일을 생성합니다.

이 설정은 이미 독립적으로 구동 중인 전역 MariaDB (`global-mariadb` 컨테이너) 및 전역 Watchtower 서비스와 연동됩니다. Nginx Proxy Manager가 사용하는 `npm_default` 공용 네트워크를 재사용합니다.

```yaml
version: '3.8'

services:
  chrono-app:
    image: ghcr.io/your-github-username/your-repository-name:latest # GitHub Container Registry에 푸시될 Docker 이미지 경로로 변경
    container_name: chrono-app
    restart: always
    ports:
      - "3000:3000" # Nginx Proxy Manager가 이 포트로 매핑할 예정
    environment:
      DATABASE_URL: "mysql://chrono_user:chrono_pass@global-mariadb:3306/chrono_db"
      AUTH_SECRET: your-secret-key-at-least-32-chars-long # .env의 AUTH_SECRET과 동일하게 설정
      NEXTAUTH_URL: http://your-domain.com # 운영 환경의 실제 도메인으로 변경
      NODE_ENV: production
    labels:
      - "com.centurylinklabs.watchtower.enable=true" # 외부 Watchtower가 이 컨테이너를 감시하도록 설정
    networks:
      - npm_default

networks:
  npm_default:
    external: true # Nginx Proxy Manager가 사용하는 외부 네트워크를 재사용
```

**설정 시 주의사항:**
*   `your-github-username/your-repository-name`: 실제 GitHub 사용자 이름과 저장소 이름으로 변경하세요.
*   `AUTH_SECRET`: `src/auth.ts` 및 `.env` 파일에 설정한 것과 동일하게 32자 이상의 강력한 시크릿 키를 사용하세요.
*   `NEXTAUTH_URL`: 운영 서버의 실제 도메인 (예: `http://chrono.your-domain.com`)으로 변경해야 합니다.
*   MariaDB 컨테이너 이름은 `global-mariadb`여야 합니다. (`DATABASE_URL` 호스트 부분)

### 3. 서버 배포 및 자동 업데이트

1.  **프로젝트 폴더 생성**: 운영 서버의 홈 디렉토리 내에 `/apps/chrono-app/` 경로를 생성하고 이동합니다.
    ```bash
    mkdir -p ~/apps/chrono-app
    cd ~/apps/chrono-app
    ```
2.  **`docker-compose.yml` 생성**: 위에 제시된 `docker-compose.yml` 내용을 해당 경로에 붙여넣어 파일을 생성합니다.

3.  **Docker Compose 실행**: 다음 명령어를 실행하여 `chrono-app` 서비스를 시작합니다.
    ```bash
    docker compose up -d
    ```
    *   `chrono-app`: GitHub Container Registry에서 최신 이미지를 가져와 애플리케이션 컨테이너를 실행합니다. 이미지는 `ghcr.io/your-github-username/your-repository-name:latest` 경로에서 가져옵니다.
    *   외부에서 구동 중인 전역 Watchtower 서비스가 `chrono-app` 컨테이너의 Docker 라벨 `com.centurylinklabs.watchtower.enable=true`를 감지하고, 새 버전이 GHCR에 푸시되면 자동으로 `chrono-app` 컨테이너를 재시작하여 업데이트합니다.

### 4. Nginx Proxy Manager 설정
Nginx Proxy Manager를 사용하여 `chrono-app` 서비스 (내부 포트 3000)를 외부 도메인에 연결합니다.

1.  Nginx Proxy Manager 웹 UI에 접속합니다.
2.  **Proxy Hosts**를 추가합니다.
3.  **Domain Names**: `chrono.your-domain.com` (실제 도메인으로 변경)
4.  **Scheme**: `http`
5.  **Forward Hostname / IP**: `chrono-app` (Docker Compose 파일에 설정한 `container_name`과 동일하게)
6.  **Forward Port**: `3000`
7.  SSL 인증서를 설정하고 저장합니다.

이제 `main` 브랜치에 코드를 푸시하면 GitHub Actions가 자동으로 Docker 이미지를 GHCR에 푸시하고, 운영 서버의 전역 Watchtower가 이를 감지하여 최신 버전으로 자동 배포합니다. Nginx Proxy Manager를 통해 설정된 도메인으로 접속하면 업데이트된 애플리케이션을 확인할 수 있습니다.
