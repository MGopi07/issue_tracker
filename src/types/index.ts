// Master Domain Types & Role Enums for TechIssue Hub

export const Role = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  SEO_TEAM: "SEO_TEAM",
  QA_TESTER: "QA_TESTER",
  DEVOPS: "DEVOPS",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  URGENT: "URGENT",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const IssueStatus = {
  OPEN: "OPEN",
  TRIAGED: "TRIAGED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  FIX_READY: "FIX_READY",
  IN_VERIFICATION: "IN_VERIFICATION",
  RESOLVED: "RESOLVED",
  VERIFIED: "VERIFIED",
  CLOSED: "CLOSED",
  REOPENED: "REOPENED",
  DUPLICATE: "DUPLICATE",
} as const;

export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export const RelationType = {
  BLOCKS: "BLOCKS",
  IS_BLOCKED_BY: "IS_BLOCKED_BY",
  DUPLICATES: "DUPLICATES",
  IS_DUPLICATED_BY: "IS_DUPLICATED_BY",
  RELATES_TO: "RELATES_TO",
} as const;

export type RelationType = (typeof RelationType)[keyof typeof RelationType];
