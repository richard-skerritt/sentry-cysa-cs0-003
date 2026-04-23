# Cloud Security Operations

## Overview — CS0-003 Domains 1 and 2

Cloud environments introduce a fundamentally different operating model: infrastructure is defined by API calls, credentials are software objects, and misconfigurations are the leading cause of breaches — not zero-days. CySA+ expects you to understand the shared responsibility model, cloud-native detection tooling, and common misconfigurations.

## Shared Responsibility Model

The cloud provider and customer share security responsibility — the dividing line depends on the service model.

| Responsibility | IaaS | PaaS | SaaS |
|---|---|---|---|
| Physical datacenter | Provider | Provider | Provider |
| Hypervisor / host OS | Provider | Provider | Provider |
| Guest OS / runtime | **Customer** | Provider | Provider |
| Application code | **Customer** | **Customer** | Provider |
| Data | **Customer** | **Customer** | **Customer** |
| Identity & Access | **Customer** | **Customer** | **Customer** |
| Network config | **Customer** | Shared | Provider |

**Key point:** The customer is **always** responsible for data classification, IAM configuration, and what they put in the cloud. The provider never manages customer data security.

## Identity and Access Management (IAM)

Misconfigured IAM is the most common cloud breach vector.

### IAM Best Practices

- **Least privilege** — grant only permissions needed for the specific function; review quarterly
- **No long-term access keys** — use IAM roles with short-lived credentials (STS) for applications; rotate keys that must exist
- **MFA on all human accounts** — especially root/admin accounts; never leave root without MFA
- **Disable root account use** — AWS root account should only exist to create the first admin; lock it away
- **Service accounts / roles** — use cloud-native roles (IAM roles in AWS, Managed Identities in Azure) instead of static credentials
- **Permission boundaries** — AWS-specific control that limits maximum permissions any role can have, even if over-permissioned policies are attached
- **Privileged access reviews** — regularly audit who has admin-level access; validate active need

### IAM Indicators of Compromise

- Root account login (should never happen in normal operations)
- New IAM user created without change management ticket
- API calls from unusual geographies or new IP ranges
- Credential access from an EC2 instance that doesn't normally make IAM API calls
- `sts:AssumeRole` from an unexpected account or service

## Cloud Security Tooling

### CSPM — Cloud Security Posture Management

Continuously assesses cloud environment against security benchmarks (CIS, NIST, PCI, SOC 2). Detects misconfigurations before attackers exploit them.

- **Examples:** Prisma Cloud, Wiz, AWS Security Hub, Microsoft Defender for Cloud
- Reports: public storage buckets, open security groups, unencrypted volumes, overly permissive IAM policies
- Provides compliance dashboards against specific frameworks

### CWPP — Cloud Workload Protection Platform

Runtime protection for cloud workloads (VMs, containers, serverless functions).

- Vulnerability scanning of running workloads
- Runtime behavioral detection (file integrity, network anomalies)
- Container image scanning for CVEs before deployment

### CNAPP — Cloud-Native Application Protection Platform

Converged CSPM + CWPP + API security + IaC scanning in a single platform. The current direction of cloud security tooling (Wiz, Prisma Cloud, Lacework).

## Cloud Log Sources

### AWS

| Log Source | What It Contains |
|---|---|
| **CloudTrail** | All API calls — who did what, when, from where; critical for IAM and management plane visibility |
| **VPC Flow Logs** | Network-level flow data for VPC traffic; equivalent to NetFlow |
| **GuardDuty** | Managed threat detection — analyzes CloudTrail, DNS, VPC Flow; generates findings |
| **S3 Server Access Logs** | Object-level access to S3 buckets |
| **CloudWatch Logs** | Application and OS logs from EC2, Lambda, containers |
| **Config** | Configuration change history for all AWS resources; enables point-in-time reconstruction |

```json
// CloudTrail log excerpt — unauthorized S3 access attempt
{
  "eventTime": "2024-03-15T02:31:00Z",
  "eventName": "GetObject",
  "userIdentity": {"type": "IAMUser", "userName": "svc-billing"},
  "sourceIPAddress": "185.220.101.47",
  "requestParameters": {"bucketName": "prod-pii-backup", "key": "customers.csv"},
  "errorCode": "AccessDenied"
}
```

### Azure

| Log Source | What It Contains |
|---|---|
| **Azure Activity Log** | Management plane operations — VM create/delete, RBAC changes, policy modifications |
| **Azure AD Sign-In Logs** | Authentication events, MFA results, conditional access outcomes |
| **Microsoft Defender for Cloud** | Security posture alerts, threat detections across Azure resources |
| **NSG Flow Logs** | Network Security Group traffic — similar to VPC Flow |
| **Azure Monitor / Diagnostic Logs** | Resource-specific logs (storage access, Key Vault operations, SQL audit) |

### GCP

- **Cloud Audit Logs** — Admin Activity (always on), Data Access (optional), System Event
- **VPC Flow Logs** — network flow data
- **Security Command Center** — centralized findings from multiple GCP security services

## Common Cloud Misconfigurations

These are exam favorites and real-world breach causes:

| Misconfiguration | Risk | Detection |
|---|---|---|
| **Public S3 bucket** | Data exposure without authentication | AWS Config rule `s3-bucket-public-read-prohibited`; GuardDuty |
| **Open security group (0.0.0.0/0 inbound)** | Unrestricted inbound access to sensitive ports | CSPM, AWS Config, Defender for Cloud |
| **No MFA on root/admin** | Account takeover leads to full environment compromise | IAM credential report; GuardDuty finding |
| **Overly permissive IAM role** | Privilege escalation via assumed role | IAM Access Analyzer; CSPM |
| **Unencrypted EBS volume / S3 bucket** | Data at rest exposed if AWS account or physical media compromised | AWS Config `encrypted-volumes` rule |
| **CloudTrail disabled** | No audit trail; attacker actions invisible | AWS Config; Security Hub |
| **Secrets in environment variables** | Credentials exposed in instance metadata | Static analysis of IaC; CSPM secrets scanning |
| **Public RDS snapshot** | Database backup accessible to anyone | AWS Config; S3 public access block |

## Container and Kubernetes Security

### Container Security Basics

- **Image scanning** — scan container images for CVEs before deployment (Trivy, Snyk, AWS ECR scanning)
- **Immutable containers** — containers should not be modified after deployment; updates redeploy new images
- **Non-root user** — containers should not run as root; specify `USER` in Dockerfile
- **Read-only filesystem** — where possible, mount filesystems as read-only
- **Secrets management** — inject secrets via environment variables from vault or Kubernetes Secrets (encrypted at rest)

### Kubernetes Security Signals

- Pod running with `privileged: true` — equivalent to root on the host
- Containers mounting the host filesystem or Docker socket — container escape risk
- `kubectl exec` into a running production pod — suspicious interactive access
- New ClusterRoleBinding to `cluster-admin` — privilege escalation indicator
- Outbound connections from pods to unexpected external IPs — C2 indicator

## Key Cloud Security Exam Concepts

- **Shared responsibility**: Customer always owns data and IAM, regardless of service model
- **CloudTrail** is the primary forensic log for AWS — always enable in all regions
- **GuardDuty** provides managed threat detection; it analyzes CloudTrail + DNS + VPC Flow automatically
- **CSPM** detects misconfigurations; **CWPP** protects workloads at runtime; **CNAPP** combines both
- Public S3 buckets and open security groups are the most common misconfiguration findings
- IAM misconfigurations (no MFA on root, excessive permissions) are the most common breach vectors
