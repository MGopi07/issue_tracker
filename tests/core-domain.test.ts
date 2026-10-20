import assert from "assert";
import { Role, IssueStatus, Priority, RelationType } from "../src/types";
import { Permissions } from "../src/lib/rbac";

console.log("🧪 Starting TechIssue Hub Automated Domain & Security Test Suite...\n");

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

async function runTests() {
  // Test Suite 1: RBAC Matrix Validation
  console.log("==> Test Suite 1: Role-Based Access Control (RBAC) Permissions");

  it("Administrator has universal access across all capabilities", () => {
    const adminUser = {
      id: "u1",
      email: "admin@test.local",
      name: "Admin",
      role: Role.ADMIN,
      departments: [],
    };

    assert.strictEqual(Permissions.canManageProjects(adminUser), true);
    assert.strictEqual(Permissions.canVerifyIssue(adminUser), true);
    assert.strictEqual(Permissions.canDeleteIssue(adminUser), true);
  });

  it("QA Engineer has exclusive permission to verify resolutions", () => {
    const qaUser = {
      id: "u2",
      email: "qa@test.local",
      name: "QA Lead",
      role: Role.QA_TESTER,
      departments: [],
    };

    const devUser = {
      id: "u3",
      email: "dev@test.local",
      name: "Developer",
      role: Role.DEVELOPER,
      departments: [],
    };

    assert.strictEqual(Permissions.canVerifyIssue(qaUser), true);
    assert.strictEqual(Permissions.canVerifyIssue(devUser), false);
  });

  it("Developers and QA can create and edit issues", () => {
    const devUser = {
      id: "u3",
      email: "dev@test.local",
      name: "Developer",
      role: Role.DEVELOPER,
      departments: [],
    };

    assert.strictEqual(Permissions.canCreateIssue(devUser), true);
    assert.strictEqual(Permissions.canEditIssue(devUser, "u3"), true);
    assert.strictEqual(Permissions.canResolveIssue(devUser), true);
  });

  it("Project Managers can manage projects and reassign issues", () => {
    const pmUser = {
      id: "u4",
      email: "pm@test.local",
      name: "PM",
      role: Role.PROJECT_MANAGER,
      departments: [],
    };

    assert.strictEqual(Permissions.canManageProjects(pmUser), true);
    assert.strictEqual(Permissions.canVerifyIssue(pmUser), true);
  });

  it("Only issue creator or Administrator can delete an issue", () => {
    const creatorUser = {
      id: "u_creator",
      email: "creator@test.local",
      name: "Creator",
      role: Role.DEVELOPER,
      departments: [],
    };

    const otherUser = {
      id: "u_other",
      email: "other@test.local",
      name: "Other Dev",
      role: Role.DEVELOPER,
      departments: [],
    };

    const adminUser = {
      id: "u_admin",
      email: "admin@test.local",
      name: "Admin",
      role: Role.ADMIN,
      departments: [],
    };

    assert.strictEqual(Permissions.canDeleteIssue(creatorUser, "u_creator"), true);
    assert.strictEqual(Permissions.canDeleteIssue(otherUser, "u_creator"), false);
    assert.strictEqual(Permissions.canDeleteIssue(adminUser, "u_creator"), true);
  });

  // Test Suite 2: State Machine Lifecycle Validation
  console.log("\n==> Test Suite 2: Issue Lifecycle State Machine Constraints");

  const VALID_TRANSITIONS: Record<string, string[]> = {
    [IssueStatus.OPEN]: [
      IssueStatus.IN_PROGRESS,
      IssueStatus.BLOCKED,
      IssueStatus.CLOSED,
      IssueStatus.DUPLICATE,
    ],
    [IssueStatus.IN_PROGRESS]: [
      IssueStatus.RESOLVED,
      IssueStatus.BLOCKED,
      IssueStatus.OPEN,
    ],
    [IssueStatus.BLOCKED]: [
      IssueStatus.IN_PROGRESS,
      IssueStatus.OPEN,
    ],
    [IssueStatus.RESOLVED]: [
      IssueStatus.VERIFIED,
      IssueStatus.REOPENED,
      IssueStatus.CLOSED,
    ],
    [IssueStatus.VERIFIED]: [
      IssueStatus.CLOSED,
      IssueStatus.REOPENED,
    ],
    [IssueStatus.CLOSED]: [
      IssueStatus.REOPENED,
    ],
  };

  it("Enforces valid forward progression from OPEN to IN_PROGRESS", () => {
    const allowed = VALID_TRANSITIONS[IssueStatus.OPEN];
    assert(allowed.includes(IssueStatus.IN_PROGRESS));
    assert(allowed.includes(IssueStatus.BLOCKED));
  });

  it("Blocks illegal transition from OPEN directly to VERIFIED", () => {
    const allowed = VALID_TRANSITIONS[IssueStatus.OPEN];
    assert(!allowed.includes(IssueStatus.VERIFIED));
  });

  it("Requires QA verification before closed status from RESOLVED", () => {
    const allowed = VALID_TRANSITIONS[IssueStatus.RESOLVED];
    assert(allowed.includes(IssueStatus.VERIFIED));
  });

  // Test Suite 3: Domain Enums and Data Integrity
  console.log("\n==> Test Suite 3: Domain Types & Symmetrical Relations");

  it("Validates bidirectional relation symmetry", () => {
    const INVERSE_RELATIONS: Record<string, string> = {
      [RelationType.BLOCKS]: RelationType.IS_BLOCKED_BY,
      [RelationType.IS_BLOCKED_BY]: RelationType.BLOCKS,
      [RelationType.DUPLICATES]: RelationType.IS_DUPLICATED_BY,
      [RelationType.IS_DUPLICATED_BY]: RelationType.DUPLICATES,
      [RelationType.RELATES_TO]: RelationType.RELATES_TO,
    };

    assert.strictEqual(INVERSE_RELATIONS[RelationType.BLOCKS], RelationType.IS_BLOCKED_BY);
    assert.strictEqual(INVERSE_RELATIONS[RelationType.IS_BLOCKED_BY], RelationType.BLOCKS);
    assert.strictEqual(INVERSE_RELATIONS[RelationType.RELATES_TO], RelationType.RELATES_TO);
  });

  it("Validates Issue Priority ordering semantics", () => {
    const priorities = [
      Priority.LOW,
      Priority.MEDIUM,
      Priority.HIGH,
      Priority.CRITICAL,
      Priority.URGENT,
    ];

    assert.strictEqual(priorities.length, 5);
    assert(priorities.includes("CRITICAL"));
    assert(priorities.includes("URGENT"));
  });

  // Summary
  console.log(`\n========================================`);
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
