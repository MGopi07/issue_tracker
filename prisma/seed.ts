import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Role, IssueStatus, Priority } from "../src/types";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting TechIssue Hub Database Seed...");

  // 1. Seed Core Engineering Departments
  const departments = [
    {
      name: "Frontend Development",
      code: "FE",
      description: "Next.js, React, TypeScript, UI Components, State Management, and CSS/Tailwind rendering.",
      categories: [
        { name: "UI Component Bug", code: "FE_UI" },
        { name: "State Management & Redux/Zustand", code: "FE_STATE" },
        { name: "Hydration Mismatch", code: "FE_HYDRATION" },
        { name: "Browser Compatibility & Polyfills", code: "FE_COMPAT" },
        { name: "Responsive Layout Breakage", code: "FE_RESPONSIVE" },
        { name: "API Client & Data Fetching", code: "FE_FETCH" },
      ],
    },
    {
      name: "Backend Development",
      code: "BE",
      description: "Node.js microservices, REST APIs, GraphQL, Authentication, and Business Logic.",
      categories: [
        { name: "REST API Endpoint Failure", code: "BE_REST" },
        { name: "Authentication & JWT Session Expiry", code: "BE_AUTH" },
        { name: "Database & ORM Queries", code: "BE_DB" },
        { name: "Microservice RPC Communication", code: "BE_RPC" },
        { name: "Third-Party Webhook / Payment Gateway", code: "BE_INTEGRATION" },
        { name: "Rate Limiting & Throttling", code: "BE_THROTTLE" },
      ],
    },
    {
      name: "SEO & Search Crawling",
      code: "SEO",
      description: "Robots.txt, Sitemap.xml, Canonical URLs, Structured Data (Schema.org), and Core Web Vitals.",
      categories: [
        { name: "Robots.txt & Sitemap Indexing", code: "SEO_INDEX" },
        { name: "Canonical & Duplicate Content", code: "SEO_CANONICAL" },
        { name: "OpenGraph & Social Meta Tags", code: "SEO_OG" },
        { name: "Schema.org Structured Data", code: "SEO_SCHEMA" },
        { name: "Redirect Loops & Broken Links", code: "SEO_REDIRECT" },
      ],
    },
    {
      name: "Performance & Optimization",
      code: "PERF",
      description: "Core Web Vitals (LCP, FID, CLS, INP), Bundle Size, Caching, and Server Response Times.",
      categories: [
        { name: "Large Contentful Paint (LCP) Delay", code: "PERF_LCP" },
        { name: "Cumulative Layout Shift (CLS)", code: "PERF_CLS" },
        { name: "Interaction to Next Paint (INP)", code: "PERF_INP" },
        { name: "Memory Leaks & V8 GC Spikes", code: "PERF_MEMORY" },
        { name: "Redis & Edge Cache Miss Invalidation", code: "PERF_CACHE" },
      ],
    },
    {
      name: "DevOps & Infrastructure",
      code: "OPS",
      description: "CI/CD pipelines, Docker containers, Kubernetes, Cloudflare, and Database Migrations.",
      categories: [
        { name: "Docker Container Crash & Healthcheck", code: "OPS_DOCKER" },
        { name: "CI/CD Pipeline Failure", code: "OPS_CICD" },
        { name: "SSL Certificate & DNS Resolution", code: "OPS_DNS" },
        { name: "Database Migration Lock / Timeout", code: "OPS_MIGRATION" },
        { name: "Kubernetes Pod OOMKilled", code: "OPS_K8S" },
      ],
    },
    {
      name: "Quality Assurance & Testing",
      code: "QA",
      description: "Automated end-to-end testing, Playwright, Cypress, Regression testing, and Staging validation.",
      categories: [
        { name: "Playwright / E2E Flaky Test", code: "QA_E2E" },
        { name: "Regression in Release Candidate", code: "QA_REGRESSION" },
        { name: "Staging Data Sync Mismatch", code: "QA_STAGING" },
        { name: "Cross-Device Verification Failure", code: "QA_DEVICE" },
      ],
    },
    {
      name: "Desktop & Electron Applications",
      code: "DESK",
      description: "Electron builds, native OS integration, auto-updaters, and SQLite offline databases.",
      categories: [
        { name: "Auto-Updater & Code Signing", code: "DESK_UPDATE" },
        { name: "IPC Channel IPC_SEND Timeout", code: "DESK_IPC" },
        { name: "Native Window Lifecycle Crash", code: "DESK_CRASH" },
        { name: "Local SQLite Storage Corruption", code: "DESK_SQLITE" },
      ],
    },
  ];

  console.log("  -> Seeding Departments & Categories...");
  const departmentMap = new Map<string, string>();
  const categoryMap = new Map<string, string>();

  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: {
        name: dept.name,
        code: dept.code,
        description: dept.description,
      },
    });
    departmentMap.set(dept.code, d.id);

    for (const cat of dept.categories) {
      const c = await prisma.category.upsert({
        where: { departmentId_code: { departmentId: d.id, code: cat.code } },
        update: { name: cat.name },
        create: {
          name: cat.name,
          code: cat.code,
          departmentId: d.id,
        },
      });
      categoryMap.set(cat.code, c.id);
    }
  }

  // 2. Hash default seed password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("ChangeMeOnFirstLogin2026!", salt);

  // 3. Seed Default System Administrator
  console.log("  -> Seeding Administrator Account...");
  const adminEmail = "admin@techissuehub.local";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: "System Administrator",
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
  });

  // Link admin to all departments
  for (const deptId of Array.from(departmentMap.values())) {
    await prisma.userDepartment.upsert({
      where: { userId_departmentId: { userId: adminUser.id, departmentId: deptId } },
      update: {},
      create: { userId: adminUser.id, departmentId: deptId },
    });
  }

  // 4. Seed Standard Team Roles for testing
  console.log("  -> Seeding Sample Team Members for Testing...");
  const sampleUsers = [
    { email: "pm@techissuehub.local", name: "Sarah Chen (Lead PM)", role: Role.PROJECT_MANAGER, dept: "FE" },
    { email: "dev@techissuehub.local", name: "Alex Rivera (Senior Dev)", role: Role.DEVELOPER, dept: "BE" },
    { email: "qa@techissuehub.local", name: "Elena Rostova (QA Lead)", role: Role.QA_TESTER, dept: "QA" },
    { email: "devops@techissuehub.local", name: "Marcus Brody (DevOps Eng)", role: Role.DEVOPS, dept: "OPS" },
    { email: "seo@techissuehub.local", name: "Priya Patel (SEO Specialist)", role: Role.SEO_TEAM, dept: "SEO" },
  ];

  const userMap = new Map<string, string>();
  userMap.set("ADMIN", adminUser.id);

  for (const u of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
      },
    });
    userMap.set(u.role, user.id);

    const deptId = departmentMap.get(u.dept);
    if (deptId) {
      await prisma.userDepartment.upsert({
        where: { userId_departmentId: { userId: user.id, departmentId: deptId } },
        update: {},
        create: { userId: user.id, departmentId: deptId },
      });
    }
  }

  // 5. Seed Initial Project
  console.log("  -> Seeding Initial Project (Acme E-Commerce Platform)...");
  const pmId = userMap.get(Role.PROJECT_MANAGER) || adminUser.id;
  const devId = userMap.get(Role.DEVELOPER) || adminUser.id;
  const qaId = userMap.get(Role.QA_TESTER) || adminUser.id;

  const project = await prisma.project.upsert({
    where: { code: "ACME" },
    update: {},
    create: {
      name: "Acme E-Commerce Platform",
      code: "ACME",
      description: "High-scale enterprise next-gen retail store built with Next.js, GraphQL, and microservices.",
      projectUrl: "https://store.acme-corp.demo",
      projectType: "Web",
      status: "ACTIVE",
      managerId: pmId,
    },
  });

  // Link members to project
  for (const userId of Array.from(userMap.values())) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: {},
      create: { projectId: project.id, userId, role: "MEMBER" },
    });
  }

  // 6. Seed Demonstration Verified Issues & Knowledge Base Articles
  console.log("  -> Seeding Verified Issues & Knowledge Base Articles...");

  // Issue 1: Hydration Mismatch (Verified + KB)
  const feDeptId = departmentMap.get("FE")!;
  const feHydrationCatId = categoryMap.get("FE_HYDRATION")!;

  const existingIssue1 = await prisma.issue.findFirst({
    where: { issueNumber: "ISS-2026-0001" },
  });

  if (!existingIssue1) {
    const issue1 = await prisma.issue.create({
      data: {
        issueNumber: "ISS-2026-0001",
        title: "Next.js hydration mismatch on checkout cart badge count",
        description:
          "During page reload on /checkout, React throws Error #418 / #423: Text content does not match server-rendered HTML. Badge displays '0' during SSR and instantly flickers to '3' on client hydration.",
        environment: "Production",
        priority: Priority.HIGH,
        status: IssueStatus.VERIFIED,
        isKnowledgeBase: true,
        kbSummary:
          "Cart count read from window.localStorage during initial render creates SSR/client mismatch. Resolved using useSyncExternalStore with server-side snapshot defaulting to 0 and mounting deferred client listener.",
        projectId: project.id,
        departmentId: feDeptId,
        categoryId: feHydrationCatId,
        createdById: pmId,
        assigneeId: devId,
        expectedBehavior: "Checkout header badge renders seamlessly without console warnings or layout shift.",
        actualBehavior: "Console warning: Hydration failed because initial UI does not match what was rendered on the server.",
        reproSteps: "1. Add 2 items to cart\n2. Navigate to /checkout\n3. Hard refresh (Ctrl+Shift+R)",
        errorMessages: "Hydration failed because the server-rendered HTML didn't match the client. As a result this tree will be regenerated on the client.",
        gitBranch: "fix/fe-cart-hydration",
        resolvedAt: new Date(),
      },
    });

    // Add Diagnostic Investigation
    await prisma.issueInvestigation.create({
      data: {
        issueId: issue1.id,
        investigatorId: devId,
        observation: "Badge HTML rendered by server has <span>0</span>, but client bundle directly reads window.localStorage in component body, emitting <span>3</span> before mount.",
        hypothesis: "Direct localStorage access in useState initializer during initial component execution.",
        toolsUsed: "React DevTools Profiler, Chrome Console Breakpoints",
        findings: "Direct read of client storage during render phase breaks deterministic React 18 hydration contracts.",
        failedAttempts: "Attempted checking typeof window !== 'undefined' inside useState, but this still produces differing server/client markup.",
        conclusion: "Use React 18 useSyncExternalStore or useEffect isMounted pattern.",
      },
    });

    // Add Resolution
    await prisma.issueResolution.create({
      data: {
        issueId: issue1.id,
        resolverId: devId,
        rootCause: "Component state was initialized with window.localStorage.getItem('cart_count') during SSR execution, causing React hydration DOM mismatch.",
        permanentSolution: "Refactored cart count hook to utilize React's useSyncExternalStore with getServerSnapshot returning 0. Mounted subscriber triggers re-render after client hydration without hydration errors.",
        workaround: "Wrap <CartBadge /> with dynamic(() => import('./cart-badge'), { ssr: false })",
        filesChanged: "src/components/cart/cart-badge.tsx\nsrc/hooks/use-cart-count.ts",
        regressionPrevention: "Added Playwright console warning assertion in CI pipeline to fail any PR with React hydration errors.",
        verificationChecklist: "[x] No console warnings on hard refresh\n[x] Zero layout shift observed in Lighthouse\n[x] Works in incognito mode with clean storage",
        verifierId: qaId,
        verifiedAt: new Date(),
        verificationPassed: true,
        verificationNotes: "Verified in staging build #512 across Chromium, Firefox, and WebKit. Zero console hydration errors detected.",
      },
    });

    // Add Comment
    await prisma.issueComment.create({
      data: {
        issueId: issue1.id,
        authorId: pmId,
        content: "Verified that cart checkout abandonment decreased by 4% after this fix landed. Excellent resolution documentation!",
        isInternal: false,
      },
    });
  }

  // Issue 2: Prisma Connection Pool Exhaustion (Backend / DB, Verified + KB)
  const beDeptId = departmentMap.get("BE")!;
  const beDbCatId = categoryMap.get("BE_DB")!;

  const existingIssue2 = await prisma.issue.findFirst({
    where: { issueNumber: "ISS-2026-0002" },
  });

  if (!existingIssue2) {
    const issue2 = await prisma.issue.create({
      data: {
        issueNumber: "ISS-2026-0002",
        title: "Prisma client connection pool exhaustion under API traffic spikes",
        description:
          "Under high concurrent API load (>500 req/s), backend microservices encounter PrismaClientInitializationError: Timed out fetching a new connection from the connection pool.",
        environment: "Staging",
        priority: Priority.CRITICAL,
        status: IssueStatus.VERIFIED,
        isKnowledgeBase: true,
        kbSummary:
          "Serverless route handlers instantiating new PrismaClient() on hot reloads exhausted PostgreSQL max_connections. Resolved via global singleton pattern and PgBouncer connection pooling string with connection_limit=20.",
        projectId: project.id,
        departmentId: beDeptId,
        categoryId: beDbCatId,
        createdById: devId,
        assigneeId: userMap.get(Role.DEVOPS) || adminUser.id,
        expectedBehavior: "PostgreSQL connections pool smoothly and recycle within 5000ms timeout.",
        actualBehavior: "Postgres server reached max_connections (100) and dropped incoming query requests.",
        errorMessages: "Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool (Current connection limit: 10)",
        gitBranch: "perf/be-prisma-pgbouncer-pool",
        resolvedAt: new Date(),
      },
    });

    await prisma.issueInvestigation.create({
      data: {
        issueId: issue2.id,
        investigatorId: userMap.get(Role.DEVOPS) || adminUser.id,
        observation: "Active PostgreSQL connection count spiked to 100 within 45 seconds of load test initiation.",
        hypothesis: "Prisma clients not sharing global instance across Node.js runtime workers.",
        toolsUsed: "pg_stat_activity, Datadog APM, k6 load testing suite",
        findings: "Multiple modules instantiated 'new PrismaClient()' directly instead of importing global singleton client.",
        conclusion: "Enforce singleton client pattern and configure connection_limit & pool_timeout query params.",
      },
    });

    await prisma.issueResolution.create({
      data: {
        issueId: issue2.id,
        resolverId: userMap.get(Role.DEVOPS) || adminUser.id,
        rootCause: "Uncached PrismaClient constructors in serverless endpoints created 10 connections per lambda invocation, quickly exhausting PostgreSQL database connection limit.",
        permanentSolution: "Enforced src/lib/prisma.ts singleton with globalThis caching across hot reloads. Added PgBouncer connection pooling with ?pgbouncer=true&connection_limit=20.",
        filesChanged: "src/lib/prisma.ts\n.env.production\nk8s/pgbouncer-deployment.yaml",
        regressionPrevention: "Set up Datadog alert triggering when database connections exceed 70% of max capacity.",
        verifierId: qaId,
        verifiedAt: new Date(),
        verificationPassed: true,
        verificationNotes: "Ran k6 benchmark with 1,200 virtual users. Peak connection count remained steady at 24. Zero timeouts.",
      },
    });
  }

  // Issue 3: Open / In-Progress Investigation (DevOps)
  const opsDeptId = departmentMap.get("OPS")!;
  const opsDockerCatId = categoryMap.get("OPS_DOCKER")!;

  const existingIssue3 = await prisma.issue.findFirst({
    where: { issueNumber: "ISS-2026-0003" },
  });

  if (!existingIssue3) {
    const issue3 = await prisma.issue.create({
      data: {
        issueNumber: "ISS-2026-0003",
        title: "Docker container SIGTERM timeout during rolling blue/green deployment",
        description:
          "During automated Kubernetes deployment, old pods are terminated forcefully with SIGKILL after 30s grace period instead of gracefully finishing in-flight GraphQL requests.",
        environment: "Staging",
        priority: Priority.HIGH,
        status: IssueStatus.IN_PROGRESS,
        projectId: project.id,
        departmentId: opsDeptId,
        categoryId: opsDockerCatId,
        createdById: pmId,
        assigneeId: userMap.get(Role.DEVOPS) || adminUser.id,
        expectedBehavior: "Node.js HTTP server receives SIGTERM, stops accepting new connections, and exits 0 within 5 seconds.",
        actualBehavior: "Pods stay in Terminating state for 30s until hard killed by Kubernetes kubelet.",
        reproSteps: "1. Trigger rolling update via kubectl rollout restart\n2. Inspect pod termination logs",
        gitBranch: "fix/ops-graceful-shutdown",
      },
    });

    await prisma.issueInvestigation.create({
      data: {
        issueId: issue3.id,
        investigatorId: userMap.get(Role.DEVOPS) || adminUser.id,
        observation: "Process runs as PID 1 without an init system (like dumb-init or tini), preventing Node.js from catching SIGTERM.",
        hypothesis: "Docker container ENTRYPOINT using shell form instead of exec form, causing /bin/sh to swallow signals.",
        toolsUsed: "kubectl logs, strace, docker inspect",
        findings: "Dockerfile line 42 had 'CMD npm start' which starts /bin/sh as PID 1, which ignores SIGTERM.",
        conclusion: "Switch Dockerfile to exec form: CMD ['node', 'server.js'] or use dumb-init.",
      },
    });
  }

  console.log("✅ Database seeding complete!");
  console.log(`   Admin Login: ${adminEmail}`);
  console.log("   Password:    ChangeMeOnFirstLogin2026!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
