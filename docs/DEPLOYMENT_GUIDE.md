# Rasodu POS — AWS Deployment Guide

> **Engineering Deployment Documentation**
> Version 1.0 | Project: Rasodu POS | Author: Engineering Team
> Last Updated: July 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
   - 2.1 [High-Level Architecture](#21-high-level-architecture)
   - 2.2 [Traffic Flow Diagram](#22-traffic-flow-diagram)
   - 2.3 [Networking Diagram](#23-networking-diagram)
3. [AWS Services Used](#3-aws-services-used)
   - 3.1 [EC2 — Elastic Compute Cloud](#31-ec2--elastic-compute-cloud)
   - 3.2 [Security Groups](#32-security-groups)
   - 3.3 [VPC — Virtual Private Cloud](#33-vpc--virtual-private-cloud)
   - 3.4 [Application Load Balancer (ALB)](#34-application-load-balancer-alb)
   - 3.5 [Target Groups](#35-target-groups)
   - 3.6 [ACM — AWS Certificate Manager](#36-acm--aws-certificate-manager)
   - 3.7 [CloudFront](#37-cloudfront)
   - 3.8 [S3 — Simple Storage Service](#38-s3--simple-storage-service)
   - 3.9 [PM2 — Process Manager](#39-pm2--process-manager)
   - 3.10 [Namecheap DNS](#310-namecheap-dns)
4. [Prerequisites](#4-prerequisites)
5. [Backend Deployment — EC2](#5-backend-deployment--ec2)
   - 5.1 [Launch EC2 Instance](#51-launch-ec2-instance)
   - 5.2 [Connect to EC2](#52-connect-to-ec2)
   - 5.3 [Install Node.js](#53-install-nodejs)
   - 5.4 [Install PM2](#54-install-pm2)
   - 5.5 [Clone Repository](#55-clone-repository)
   - 5.6 [Install Dependencies](#56-install-dependencies)
   - 5.7 [Configure Environment Variables](#57-configure-environment-variables)
   - 5.8 [Run with PM2](#58-run-with-pm2)
   - 5.9 [PM2 Command Reference](#59-pm2-command-reference)
6. [VPC and Networking Setup](#6-vpc-and-networking-setup)
7. [Security Groups Configuration](#7-security-groups-configuration)
   - 7.1 [ALB Security Group](#71-alb-security-group)
   - 7.2 [EC2 Security Group](#72-ec2-security-group)
   - 7.3 [Security Group Referencing](#73-security-group-referencing)
8. [Application Load Balancer Setup](#8-application-load-balancer-setup)
   - 8.1 [Create the ALB](#81-create-the-alb)
   - 8.2 [HTTP Listener — Port 80](#82-http-listener--port-80)
   - 8.3 [HTTPS Listener — Port 443](#83-https-listener--port-443)
9. [Target Group Configuration](#9-target-group-configuration)
10. [TLS / SSL — Understanding and Configuration](#10-tls--ssl--understanding-and-configuration)
    - 10.1 [HTTP vs HTTPS](#101-http-vs-https)
    - 10.2 [SSL vs TLS](#102-ssl-vs-tls)
    - 10.3 [Certificates and Certificate Authorities](#103-certificates-and-certificate-authorities)
    - 10.4 [TLS Handshake](#104-tls-handshake)
    - 10.5 [TLS Termination at the ALB](#105-tls-termination-at-the-alb)
11. [ACM — Certificate Provisioning](#11-acm--certificate-provisioning)
    - 11.1 [Request Certificate for the ALB (ap-south-1)](#111-request-a-certificate-for-the-alb-ap-south-1)
    - 11.2 [Request Certificate for CloudFront (us-east-1)](#112-request-a-certificate-for-cloudfront-us-east-1)
    - 11.3 [DNS Validation](#113-dns-validation)
    - 11.4 [Wildcard Certificates](#114-wildcard-certificates)
12. [Frontend Deployment — S3 + CloudFront](#12-frontend-deployment--s3--cloudfront)
    - 12.1 [Build the React App](#121-build-the-react-app)
    - 12.2 [Create and Configure S3 Bucket](#122-create-and-configure-s3-bucket)
    - 12.3 [Upload Build Artifacts to S3](#123-upload-build-artifacts-to-s3)
    - 12.4 [Create CloudFront Distribution](#124-create-cloudfront-distribution)
    - 12.5 [CloudFront Invalidations](#125-cloudfront-invalidations)
13. [DNS Configuration — Namecheap](#13-dns-configuration--namecheap)
    - 13.1 [Frontend CNAME Record](#131-frontend-cname-record)
    - 13.2 [Backend CNAME Record](#132-backend-cname-record)
    - 13.3 [ACM DNS Validation Records](#133-acm-dns-validation-records)
    - 13.4 [DNS Propagation](#134-dns-propagation)
14. [Neon PostgreSQL](#14-neon-postgresql)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Final Architecture Summary](#16-final-architecture-summary)
17. [Troubleshooting](#17-troubleshooting)
    - 17.1 [Mixed Content Error](#171-mixed-content-error)
    - 17.2 [Target Group Unhealthy](#172-target-group-unhealthy)
    - 17.3 [ERR_CONNECTION_TIMED_OUT in Chrome](#173-err_connection_timed_out-in-chrome)
    - 17.4 [Certificate Warning on ALB DNS](#174-certificate-warning-on-alb-dns)
    - 17.5 [Port 0 Mistake in Security Group](#175-port-0-mistake-in-security-group)
    - 17.6 [Health Check Timeout](#176-health-check-timeout)
18. [Resource Cleanup — Deletion Order](#18-resource-cleanup--deletion-order)
19. [Best Practices Summary](#19-best-practices-summary)
20. [Glossary](#20-glossary)
- [Appendix A: Quick Reference Card](#appendix-a-quick-reference-card)

---

## 1. Project Overview

**Rasodu POS** is a full-stack Restaurant Point-of-Sale system built for real-world restaurant operations. It supports three distinct user roles — Admin, Cashier, and Kitchen Staff — and provides real-time order management, kitchen display integration, inventory tracking, and AI-powered analytics.

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React + Vite | React 19, Vite 7 |
| State Management | Zustand | 5.x |
| HTTP Client | Axios | 1.x |
| Real-time | Socket.IO Client | 4.x |
| Charts | Recharts | 3.x |
| CSS Framework | TailwindCSS | 4.x |
| Backend Framework | Express.js | 4.x |
| Runtime | Node.js | >= 18 |
| ORM | Prisma | 5.x |
| Database | Neon PostgreSQL | Serverless |
| Process Manager | PM2 | Latest |

### Application Roles

| Role | Access Path | Description |
|------|------------|-------------|
| Admin | `/admin/*` | Full management: products, categories, users, reports, AI analytics |
| Cashier | `/pos/*` | Order entry, payment, session management |
| Kitchen | `/kitchen/*` | Real-time kitchen display, ticket status updates |

### Live URLs

| Environment | URL |
|-------------|-----|
| Frontend | `https://rasodu.parth10.me` |
| Backend API | `https://api.parth10.me` |
| Health Check | `https://api.parth10.me/api/health` |

> [!NOTE]
> All URLs in this guide that contain `parth10.me`, specific AWS resource IDs (e.g., `restaurant-pos-alb-xxxx`), or IP addresses are **project-specific values**. Replace them with your own domain and resource identifiers when recreating this infrastructure.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

The Rasodu POS deployment uses a **decoupled architecture** — the frontend and backend are deployed independently and communicate over HTTPS. This is a "SPA + API" architecture where the React app is a static site served by CloudFront, and the Express.js backend is a traditional server process running on EC2.

```
INTERNET / USERS
     |
     +-- rasodu.parth10.me (HTTPS) --> CloudFront --> S3 (React Build)
     |
     +-- api.parth10.me (HTTPS) --> ALB --> Target Group --> EC2 (Express:3000) --> Neon PostgreSQL
```

**Key Design Decisions:**

1. **Frontend on S3 + CloudFront** — not EC2. Static files don't need a running server.
2. **Backend on EC2 with PM2** — not Lambda. Socket.IO requires persistent connections.
3. **ALB in front of EC2** — EC2's port 3000 is never public. ALB handles TLS.
4. **Two ACM certificates** — one per region (ap-south-1 for ALB, us-east-1 for CloudFront).
5. **Wildcard certificate** (`*.parth10.me`) — covers all subdomains with one certificate.

### 2.2 Traffic Flow Diagram

```mermaid
flowchart TD
    User(["fa:fa-user End User Browser"])

    subgraph Frontend_Layer["Frontend — Static Assets (Global)"]
        CF["fa:fa-cloud AWS CloudFront\nGlobal CDN\nHTTPS Termination\nACM *.parth10.me (us-east-1)"]
        S3["fa:fa-database AWS S3 Bucket\nrasodu-pos-frontend\nReact Build Files\n(index.html, JS, CSS, Assets)"]
        CF -->|"Fetch cached assets"| S3
    end

    subgraph Backend_Layer["Backend — API Server (ap-south-1, Mumbai)"]
        ALB["fa:fa-balance-scale Application Load Balancer\nrestaurant-pos-alb\nPort 80 → 301 Redirect to HTTPS\nPort 443 → TLS Terminate + Forward\nACM *.parth10.me (ap-south-1)"]
        TG["fa:fa-bullseye Target Group\nrestaurant-pos-tg\nProtocol: HTTP, Port: 3000\nHealth Check: GET /api/health → 200"]
        EC2["fa:fa-server EC2 Instance\nAmazon Linux 2023\nNode.js v18 + Express.js\nPort 3000 (Internal Only)\nManaged by PM2"]
        Neon["fa:fa-database Neon PostgreSQL\nServerless Cloud Database\nPrisma ORM\nSSL Required"]

        ALB --> TG
        TG --> EC2
        EC2 -->|"Prisma + SSL"| Neon
    end

    User -->|"https://rasodu.parth10.me\n(Page Load)"| CF
    User -->|"https://api.parth10.me\n(API Calls from React)"| ALB
    ALB -->|"HTTP Response"| User
```

### 2.3 Networking Diagram

```mermaid
flowchart TD
    Internet["fa:fa-globe Internet"]

    subgraph VPC["AWS VPC — ap-south-1 (Mumbai) | CIDR: 172.31.0.0/16"]
        direction TB
        IGW["Internet Gateway\n(Attached to VPC)"]

        subgraph Subnets["Public Subnets (ALB spans both AZs)"]
            Subnet1["Public Subnet\nap-south-1a\n172.31.0.0/20"]
            Subnet2["Public Subnet\nap-south-1b\n172.31.16.0/20"]
        end

        subgraph ALB_Box["restaurant-pos-alb\nSG: restaurant-pos-alb-sg\nAllows: Port 80 + 443 from 0.0.0.0/0"]
            ALB_Res["Application Load Balancer"]
        end

        subgraph EC2_Box["EC2 Instance\nSG: launch-wizard-1\nAllows: Port 3000 ONLY from restaurant-pos-alb-sg\nAllows: Port 22 ONLY from My IP"]
            EC2_Res["Express.js :3000\nManaged by PM2"]
        end

        IGW --> Subnets
        Subnets --> ALB_Box
        ALB_Box -->|"Port 3000 (Internal VPC)\nNever Public"| EC2_Box
    end

    Neon_DB["Neon PostgreSQL\n(External Cloud)\nPort 5432 + SSL"]

    Internet --> IGW
    EC2_Box -->|"Port 5432 / SSL\n(Outbound via IGW)"| Neon_DB
```

---

## 3. AWS Services Used

This section provides a detailed explanation of every AWS service used in the Rasodu POS deployment. Each service is explained from first principles so a developer new to AWS can understand the decisions made.

---

### 3.1 EC2 — Elastic Compute Cloud

#### What is EC2?

Amazon EC2 (Elastic Compute Cloud) is AWS's virtual machine service. It provides resizable compute capacity in the cloud. Think of it as renting a computer (server) from AWS — you get a virtual machine with a CPU, RAM, disk, and network connection, and you control the operating system and software installed on it.

Unlike shared hosting or PaaS services, EC2 gives you **full root access** to the operating system. You are responsible for installing software, managing security, and keeping the system updated.

#### Why We Used EC2

The Express.js backend has specific requirements that make EC2 the right choice:

| Requirement | Why EC2 Satisfies It |
|-------------|---------------------|
| Long-running process | EC2 instances are always on (unlike Lambda which spins up per request) |
| Socket.IO WebSockets | Requires persistent TCP connections — not possible with Lambda |
| SSH access | EC2 gives full SSH access for debugging and deployment |
| Custom software | Node.js v18, PM2, Prisma CLI can all be installed |
| Port flexibility | Can listen on port 3000 exactly as Express expects |

#### Configuration

| Parameter | Value |
|-----------|-------|
| Region | `ap-south-1` (Mumbai) |
| Operating System | Amazon Linux 2023 |
| Architecture | x86_64 (64-bit) |
| Application | Node.js v18 + Express.js |
| Process Manager | PM2 |
| Application Port | `3000` |
| Health Endpoint | `/api/health` |
| Public Access on Port 3000 | **None** — only ALB Security Group |

#### Why Mumbai (ap-south-1)?

- The restaurant's users are located in India
- Lower network latency for API calls (typically under 50ms for Mumbai users)
- Data stays within Indian AWS infrastructure

> [!TIP]
> Always choose an AWS region geographically close to your end users. For Indian deployments, `ap-south-1` (Mumbai) is the standard choice. For US deployments, `us-east-1` (N. Virginia) or `us-west-2` (Oregon) are common.

#### Alternatives Considered

| Alternative | Why Not Chosen |
|-------------|---------------|
| AWS Lambda | No persistent WebSocket support for Socket.IO |
| AWS Fargate (ECS) | Higher complexity; overkill for single-service |
| AWS Elastic Beanstalk | Less configuration control; opinionated |
| Self-hosted VPS | Not AWS-native; no ALB/ACM integration |

#### Best Practices

- Use **IAM roles** instead of hardcoding AWS credentials on the instance
- Enable **CloudWatch Logs** for instance-level monitoring
- Use **Elastic IPs** if you need a static public IP (default EC2 IP changes on stop/start)
- Restrict SSH access to **your specific IP address** only, never `0.0.0.0/0`
- Keep the OS updated: `sudo yum update -y` regularly
- Set up automated **EBS snapshots** for disaster recovery

---

### 3.2 Security Groups

#### What are Security Groups?

Security Groups are **virtual stateful firewalls** for AWS resources. They define what network traffic is allowed to enter (inbound) and exit (outbound) a resource like an EC2 instance or ALB.

**Stateful** means: if an inbound connection is allowed, the response traffic is automatically permitted outbound — you don't need a separate outbound rule for the response.

#### Why We Used Them

Security Groups are **mandatory** in AWS — every EC2 instance and load balancer must have at least one Security Group. We used them to:

- Allow the internet to reach the ALB on ports 80 and 443
- Allow only the ALB (and nothing else) to reach EC2's port 3000
- Restrict SSH (port 22) to a known, trusted IP address

#### The Two Security Groups in This Deployment

**Security Group 1: `restaurant-pos-alb-sg`** — Attached to the ALB

| Direction | Protocol | Port Range | Source | Reason |
|-----------|----------|------------|--------|--------|
| Inbound | TCP | 80 | `0.0.0.0/0` | HTTP from anywhere (redirected to HTTPS) |
| Inbound | TCP | 443 | `0.0.0.0/0` | HTTPS from anywhere |
| Outbound | All | All | `0.0.0.0/0` | ALB forwards requests to EC2 |

**Security Group 2: `launch-wizard-1`** — Attached to EC2

| Direction | Protocol | Port Range | Source | Reason |
|-----------|----------|------------|--------|--------|
| Inbound | TCP | 22 | `YOUR_IP/32` | SSH — your machine only |
| Inbound | TCP | 3000 | `restaurant-pos-alb-sg` | App port — ALB only (SG reference) |
| Outbound | All | All | `0.0.0.0/0` | Allow outbound (DB, npm, updates) |

> [!WARNING]
> **Never** set the source for port 3000 to `0.0.0.0/0`. This would expose your raw Express.js server to the entire internet, bypassing the ALB, TLS termination, and all security controls. Always use Security Group referencing.

---

### 3.3 VPC — Virtual Private Cloud

#### What is a VPC?

A Virtual Private Cloud (VPC) is a logically isolated section of the AWS cloud where you define your own virtual network. Think of it as having your own private data center within AWS — you control the IP address ranges, subnets, routing tables, and gateways.

Every AWS account comes with a **default VPC** in each region, pre-configured with public subnets and an Internet Gateway. This is what we used.

#### Key VPC Concepts

| Concept | Definition |
|---------|-----------|
| CIDR Block | IP address range for the VPC (default: `172.31.0.0/16` = 65,536 IPs) |
| Subnet | A division of the VPC's IP range tied to one Availability Zone |
| Internet Gateway (IGW) | Enables internet access for VPC resources |
| Route Table | Controls where network traffic is directed |
| Availability Zone (AZ) | A physically separate data center within a region |
| Public Subnet | A subnet whose route table directs `0.0.0.0/0` to the IGW |

#### Default VPC Structure in ap-south-1

```
Default VPC: 172.31.0.0/16
|
+-- Internet Gateway (attached automatically)
|
+-- Route Table
|   +-- 0.0.0.0/0 → Internet Gateway (all internet traffic)
|   +-- 172.31.0.0/16 → local (internal VPC traffic)
|
+-- Public Subnet: ap-south-1a  (e.g., 172.31.0.0/20)
+-- Public Subnet: ap-south-1b  (e.g., 172.31.16.0/20)
+-- Public Subnet: ap-south-1c  (e.g., 172.31.32.0/20)
```

#### Understanding CIDR Notation

`172.31.0.0/16` means:
- Starting IP: `172.31.0.0`
- The `/16` means the first 16 bits are fixed (the `172.31` part)
- Variable bits: the last 16 bits, giving `2^16 = 65,536` addresses
- Range: `172.31.0.0` to `172.31.255.255`

#### Why the ALB Must Be in the Same VPC as EC2

The ALB routes traffic to EC2 instances using their **private IP addresses** (e.g., `172.31.x.x`). Private IP addresses are only reachable within the same VPC. If the ALB and EC2 were in different VPCs, the ALB could not communicate with EC2 without setting up complex VPC peering.

#### Why the ALB Requires 2 Availability Zones

AWS requires Application Load Balancers to span at least 2 AZs. This ensures:
- **High Availability**: If one data center (AZ) has an outage, the ALB continues from the other
- **Fault Tolerance**: Traffic is automatically routed to healthy AZs

This is a hard AWS requirement — you cannot create an ALB in fewer than 2 AZs.

---

### 3.4 Application Load Balancer (ALB)

#### What is an ALB?

An Application Load Balancer is an AWS-managed reverse proxy that operates at **Layer 7** (HTTP/HTTPS level). It:

- Receives incoming HTTP/HTTPS traffic from the internet
- **Terminates TLS/SSL connections** (decrypts HTTPS, then forwards plain HTTP internally)
- Distributes requests across EC2 instances in the Target Group
- Performs health checks and removes unhealthy instances
- Can apply routing rules based on host, path, headers, etc.
- Can redirect HTTP to HTTPS automatically

#### Why We Used the ALB Instead of Exposing EC2 Directly

| Reason | Explanation |
|--------|-------------|
| **TLS Termination** | ALB handles SSL certificates. Express.js speaks plain HTTP internally — simpler and more efficient. |
| **Health Checks** | ALB automatically removes unhealthy EC2 instances from rotation. |
| **Fixed DNS Name** | ALB has a stable DNS name even when EC2 instances are replaced or IPs change. |
| **Security Isolation** | EC2's port 3000 is never exposed to the internet. All traffic flows through the ALB. |
| **Scalability** | Multiple EC2 instances can be added behind one ALB as traffic grows. |
| **Protocol Redirect** | HTTP→HTTPS redirect without changing Express.js code. |
| **SSL Certificate Management** | ACM handles cert renewal — no code changes required. |

#### Configuration

| Parameter | Value |
|-----------|-------|
| Name | `restaurant-pos-alb` |
| Type | Application Load Balancer |
| Scheme | Internet-facing |
| IP Address Type | IPv4 |
| Availability Zones | `ap-south-1a`, `ap-south-1b` (2 public subnets) |
| Security Group | `restaurant-pos-alb-sg` |

#### Alternatives

| Alternative | Reason Not Chosen |
|-------------|------------------|
| Directly expose EC2 | No TLS, no health checks, port 3000 public |
| AWS API Gateway | No WebSocket/Socket.IO support in standard mode |
| Network Load Balancer (NLB) | Layer 4 only — cannot perform HTTP redirects or path routing |
| Nginx on EC2 | Valid but adds complexity; ALB is fully managed |

---

### 3.5 Target Groups

#### What is a Target Group?

A Target Group is a logical grouping of resources (EC2 instances, IP addresses, or Lambda functions) that an ALB routes traffic to. Think of it as the ALB's "address book" for where to send requests.

**Key insight:** The ALB doesn't send traffic directly to EC2 instances. It sends traffic to the Target Group, which:
1. Maintains a list of registered instances
2. Continuously health-checks each instance
3. Routes traffic only to healthy instances

#### Why Target Groups Exist (Decoupling)

```
Without Target Groups:        With Target Groups:
ALB ──hard-coded──▶ EC2      ALB ──▶ Target Group ──▶ EC2(s)

Problems without TG:          Benefits with TG:
- Tied to specific IPs        - Dynamic registration/deregistration
- Manual health management    - Automatic health checking
- Hard to scale               - Easy to add/remove instances
- No blue-green deploys       - Blue-green: swap TG reference
```

#### How ALB Communicates with Target Groups

```
HTTPS Request arrives at ALB (Port 443)
     |
     v
Listener Rule: "Forward to restaurant-pos-tg"
     |
     v
Target Group: restaurant-pos-tg
     |
     v (only to healthy instances)
EC2 Instance: HTTP:3000 → /api/auth/login
     |
     v
Response flows back through Target Group → ALB → Browser
```

#### Configuration

| Parameter | Value |
|-----------|-------|
| Name | `restaurant-pos-tg` |
| Target Type | Instances |
| Protocol | HTTP |
| Port | `3000` |
| VPC | Default VPC |
| Health Check Protocol | HTTP |
| Health Check Path | `/api/health` |
| Health Check Port | Traffic Port (3000) |
| Healthy Threshold | 5 consecutive successes |
| Unhealthy Threshold | 2 consecutive failures |
| Health Check Interval | 30 seconds |
| Health Check Timeout | 5 seconds |
| Success Response Codes | `200` |

#### Health Check State Machine

```mermaid
stateDiagram-v2
    [*] --> Initial: EC2 registered to Target Group
    Initial --> Healthy: 5 consecutive HTTP 200 responses
    Healthy --> Unhealthy: 2 consecutive failures or timeouts
    Unhealthy --> Healthy: 5 consecutive HTTP 200 responses
    Unhealthy --> Draining: Instance deregistered
    Draining --> [*]: In-flight requests complete
```

| State | Description | Traffic Received? |
|-------|-------------|------------------|
| Initial | Just registered; health checks running | No |
| Healthy | Passed required consecutive checks | Yes |
| Unhealthy | Failed consecutive checks | No |
| Draining | Deregistered; completing existing connections | No new |

> [!NOTE]
> After registering an EC2 instance, it takes up to **2.5 minutes** (5 checks × 30 second interval) to become Healthy. This is normal. The instance shows "Initial" state during this period.

---

### 3.6 ACM — AWS Certificate Manager

#### What is ACM?

AWS Certificate Manager (ACM) is a service that provisions, manages, and automatically renews SSL/TLS certificates for AWS services. It eliminates the need to manually purchase certificates, install them on servers, or handle renewals.

#### Why We Used ACM

| Benefit | Details |
|---------|---------|
| **Free** | ACM certificates for AWS services cost nothing |
| **Auto-renewal** | ACM renews certificates automatically before they expire (90 days before expiry) |
| **AWS integration** | Certificates attach to ALBs and CloudFront with a few clicks in the console |
| **No private key management** | AWS securely stores the private key; you never handle it |
| **Validation via DNS** | Validation persists as long as the DNS record exists — no annual revalidation needed |

#### Two Certificates Are Required

> [!IMPORTANT]
> This deployment requires **two separate ACM certificates** in **two different AWS regions**:

| Certificate | Region | Used By | Why This Region? |
|-------------|--------|---------|-----------------|
| `*.parth10.me` | `ap-south-1` | Application Load Balancer | ALB is a regional service in ap-south-1 |
| `*.parth10.me` | `us-east-1` | CloudFront Distribution | CloudFront is a global service managed from us-east-1; **it can only use ACM certs from us-east-1** |

If you create only one certificate in `ap-south-1`, it will not appear in CloudFront's certificate dropdown. This is a hard AWS limitation, not a configuration choice.

---

### 3.7 CloudFront

#### What is CloudFront?

Amazon CloudFront is AWS's **Content Delivery Network (CDN)**. A CDN is a globally distributed network of proxy servers (called "edge locations") that cache your content close to end users.

When a user in Delhi requests `rasodu.parth10.me`, instead of fetching files from S3 in `ap-south-1` (which might be in a different city), CloudFront serves them from the nearest edge location — potentially in Delhi, reducing latency.

CloudFront has **400+ edge locations** across 90+ cities worldwide.

#### Why We Used CloudFront Instead of Direct S3

| Feature | S3 Website Endpoint | S3 + CloudFront |
|---------|-------------------|-----------------|
| HTTPS with Custom Domain | ❌ Not possible | ✅ Full support |
| ACM Certificate Attachment | ❌ Not supported | ✅ Fully supported |
| Global Performance | ❌ Single region | ✅ 400+ edge locations |
| CDN Caching | ❌ No caching layer | ✅ Assets cached at edge |
| S3 Bucket Privacy | ❌ Bucket must be public | ✅ Bucket stays private (OAC) |
| DDoS Protection | Basic | ✅ AWS Shield Standard included |

**The fundamental limitation:** You **cannot** attach an ACM certificate to an S3 website endpoint. Therefore, you **cannot** serve HTTPS on a custom domain directly from S3. CloudFront is the mandatory layer for HTTPS + custom domain.

#### Caching Strategy

| File Type | Cache Duration | Reasoning |
|-----------|---------------|-----------|
| `index.html` | Short (no-cache) | Must be fresh — HTML references new JS/CSS |
| `assets/*.js` | 365 days (immutable) | Vite generates content-hash filenames — unique per build |
| `assets/*.css` | 365 days (immutable) | Same as JS |
| Images, fonts | 30-365 days | Rarely change |

> [!NOTE]
> **Content Hashing** is Vite's strategy for cache-busting. Every build generates filenames like `index-Bh3k9qpl.js` where `Bh3k9qpl` is derived from the file's content. If the code changes, the hash changes, and the filename changes — so browsers download the new file. This means JS and CSS files can be cached forever safely.

#### CloudFront Invalidations

When you deploy new frontend code, edge locations may still have old cached files. An **invalidation** tells CloudFront to discard cached files and fetch fresh ones from S3.

```bash
# Invalidate all files (use after every deployment)
aws cloudfront create-invalidation \
  --distribution-id E1EXAMPLE12345 \
  --paths "/*"
```

> [!TIP]
> Invalidating `/*` takes 1-3 minutes and is included in the free quota of 1,000 invalidation paths per month. Always run invalidation after deploying a new frontend build.

---

### 3.8 S3 — Simple Storage Service

#### What is S3?

Amazon S3 (Simple Storage Service) is AWS's object storage service. It stores files (called "objects") in containers (called "buckets"). Unlike a traditional file system, S3 is a flat key-value store where the key is the file path (e.g., `assets/index-Bh3k9qpl.js`) and the value is the file's binary content.

#### Why S3 for the Frontend

After running `npm run build`, the React application is a collection of static files:
- `index.html` — the HTML shell
- `assets/*.js` — bundled JavaScript
- `assets/*.css` — bundled CSS
- Images, fonts, and other static assets

These files don't require any server-side processing. Any service that can serve files over HTTP is sufficient. S3 is the natural choice because:

- **Infinitely scalable**: S3 can serve millions of concurrent users
- **No server management**: No EC2 to maintain, patch, or scale
- **Highly available**: 99.999999999% (11 nines) object durability
- **Cost effective**: Pay only for storage used and data transfer
- **CloudFront integration**: Native integration with no configuration overhead

#### Bucket Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Block Public Access | Enabled (all blocked) | CloudFront uses OAC — no public access needed |
| Static Website Hosting | Enabled | Allows serving `index.html` as root |
| Index Document | `index.html` | Serve this file at the root URL |
| Error Document | `index.html` | React Router handles routing in-browser |
| Versioning | Enabled (recommended) | Rollback capability |

> [!IMPORTANT]
> Setting the **Error Document** to `index.html` is critical for React Router (single-page apps). When a user navigates directly to `https://rasodu.parth10.me/admin/products`, S3 has no file at that path. By returning `index.html` for 404 errors, React Router intercepts the URL and renders the correct component.

---

### 3.9 PM2 — Process Manager

#### What is PM2?

PM2 is a production-grade process manager for Node.js applications. It runs your Node.js process in the background and keeps it alive.

Without PM2, if you start your Express server with `node src/server.js`:
- The process runs in the foreground of your SSH session
- When you close the SSH terminal, the process dies
- If the app crashes, it stays dead until you manually restart it
- No log files are maintained

PM2 solves all of these problems.

#### Why We Used PM2

| PM2 Feature | Problem It Solves |
|-------------|------------------|
| Background execution | Process survives SSH session disconnect |
| Auto-restart on crash | If Express.js crashes, PM2 restarts it within seconds |
| Startup on reboot | EC2 instance restart? PM2 starts the app automatically |
| Log management | Captures stdout + stderr to log files with rotation |
| Process monitoring | Real-time CPU/memory dashboard via `pm2 monit` |
| Named processes | Reference by name instead of PID |
| Environment variables | Manage env vars per process |

#### Alternatives

| Alternative | Problem |
|-------------|---------|
| `nohup node server.js &` | No restart on crash, poor logs, can't easily manage |
| `screen` / `tmux` | No process management, session-based |
| systemd (directly) | More complex configuration; PM2 wraps systemd anyway |
| Docker | Valid alternative, adds container overhead |

---

### 3.10 Namecheap DNS

#### What is DNS?

The Domain Name System (DNS) is the internet's phone book. When a user types `rasodu.parth10.me` in their browser, their computer performs a DNS lookup to translate that human-readable name into a machine-usable address (IP address or another hostname).

**DNS Lookup Flow:**

```
User types: rasodu.parth10.me
     |
     v
Browser checks local DNS cache
     |
     v (cache miss)
Query: Recursive DNS Resolver (ISP or 8.8.8.8)
     |
     v
Query: .me TLD nameservers
     |
     v
Query: parth10.me nameservers (Namecheap)
     |
     v
Response: CNAME → d1abc123.cloudfront.net
     |
     v
Query: cloudfront.net for d1abc123.cloudfront.net
     |
     v
Response: A record → 13.x.x.x (CloudFront IP)
     |
     v
Browser connects to 13.x.x.x on port 443
```

#### DNS Record Types Used

**CNAME (Canonical Name)** — Maps one domain name to another domain name.

| Subdomain | Full Domain | Type | Points To |
|-----------|------------|------|-----------|
| `rasodu` | `rasodu.parth10.me` | CNAME | CloudFront Distribution Domain |
| `api` | `api.parth10.me` | CNAME | ALB DNS Name |

> [!NOTE]
> CNAME records can only be created for **subdomains**, not the root domain (`parth10.me`). The root domain requires an A record or ALIAS record. This is a DNS standard limitation, not a Namecheap or AWS limitation.

#### Why CNAME Instead of A Record?

An **A record** maps a domain to a specific IP address.
A **CNAME** maps a domain to another domain name.

We use CNAMEs for both the ALB and CloudFront because:
- **ALBs use dynamic IPs** — the IP addresses of an ALB can change without notice (they are managed by AWS). An A record would become invalid if the IP changes. A CNAME pointing to the ALB's DNS name always resolves correctly.
- **CloudFront's IPs are dynamic** — CloudFront uses many global IPs that change over time. Same reasoning applies.

---

## 4. Prerequisites

Before starting deployment, ensure the following are ready:

### AWS Prerequisites

- [ ] AWS Account created at [aws.amazon.com](https://aws.amazon.com)
- [ ] IAM user with EC2, S3, CloudFront, ACM, ELB permissions (or use root for learning)
- [ ] AWS CLI v2 installed: [docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [ ] AWS CLI configured: `aws configure` (enter Access Key ID, Secret, region: `ap-south-1`, format: `json`)
- [ ] SSH key pair created in EC2 → Key Pairs in `ap-south-1`

### Domain Prerequisites

- [ ] Domain registered (e.g., `parth10.me` on Namecheap)
- [ ] Access to Namecheap DNS control panel (Advanced DNS)

### Local Machine Prerequisites

- [ ] Git installed
- [ ] Node.js ≥ 18 installed (for building frontend)
- [ ] npm or yarn available

### Third-Party Services

- [ ] GitHub account with the project repository
- [ ] Neon account at [neon.tech](https://neon.tech) with a PostgreSQL project created

---

## 5. Backend Deployment — EC2

### 5.1 Launch EC2 Instance

Navigate to **AWS Console → EC2 → Instances → Launch Instances**

**Configuration Settings:**

| Setting | Value |
|---------|-------|
| Name | `rasodu-pos-backend` |
| AMI | Amazon Linux 2023 AMI |
| Architecture | 64-bit (x86) |
| Instance Type | `t2.micro` (free tier) / `t3.small` (production) |
| Key Pair | Select existing or create new `.pem` |
| VPC | Default VPC |
| Subnet | Any public subnet in `ap-south-1` |
| Auto-assign Public IP | **Enable** |
| Security Group | `launch-wizard-1` (configure per Section 7.2) |
| Storage | 8 GB gp3 (root volume) |

> [!NOTE]
> **Instance Type Guide:**
> - `t2.micro` — 1 vCPU, 1 GB RAM. Fine for testing and low traffic. Free Tier eligible.
> - `t3.small` — 2 vCPU, 2 GB RAM. Recommended for production. ~$15/month.
> - `t3.medium` — 2 vCPU, 4 GB RAM. Better if running AI scheduler (`ENABLE_AI_SCHEDULER=true`).

After the instance launches:
1. Note the **Public IPv4 address** (shown in instance details)
2. Note the **Private IPv4 address** (used by the ALB internally)
3. Wait for **Instance State** to show "running" and **Status Checks** to show "2/2 checks passed"

### 5.2 Connect to EC2

```bash
# Step 1: Set correct permissions on your .pem key file (macOS/Linux)
chmod 400 /path/to/your-key.pem

# Step 2: Connect via SSH
ssh -i /path/to/your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Example (replace with your actual IP):
ssh -i rasodu-key.pem ec2-user@13.206.250.23
```

> [!NOTE]
> The default SSH username for Amazon Linux is **`ec2-user`**.
> For Ubuntu AMIs: `ubuntu`. For Debian: `admin`. For RHEL: `ec2-user`.

**On Windows**, use PuTTY or Windows Terminal with OpenSSH:
```powershell
# Windows PowerShell / Command Prompt (OpenSSH must be installed)
ssh -i C:\Users\You\Downloads\rasodu-key.pem ec2-user@13.206.250.23
```

### 5.3 Install Node.js

We use **nvm (Node Version Manager)** to install and manage Node.js versions. This makes it easy to install specific versions and switch between them.

```bash
# Step 1: Update system packages
sudo yum update -y

# Step 2: Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Step 3: Load nvm into current shell session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Step 4: Make nvm available in all future sessions
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc

# Step 5: Verify nvm
nvm --version  # Should print version like 0.39.7

# Step 6: Install Node.js v18 (Long-Term Support)
nvm install 18

# Step 7: Set v18 as default
nvm use 18
nvm alias default 18

# Step 8: Verify
node --version   # Should print v18.x.x
npm --version    # Should print 9.x.x or 10.x.x
```

> [!IMPORTANT]
> After installing nvm, you **must** add the initialization lines to `~/.bashrc` (done in Step 4 above). Without this, nvm (and therefore `node` and `npm`) will not be available the next time you SSH into the instance or when PM2 starts on boot.

### 5.4 Install PM2

```bash
# Install PM2 globally using npm
npm install -g pm2

# Verify PM2 is installed
pm2 --version  # Should print PM2 version (e.g., 5.3.0)
```

### 5.5 Clone Repository

```bash
# Install git (usually pre-installed on Amazon Linux 2023)
sudo yum install git -y

# Navigate to home directory
cd /home/ec2-user

# Clone your repository (replace with your actual GitHub URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Navigate into the backend directory
cd YOUR_REPO_NAME/restaurant-pos-backend

# Confirm you're in the right place
ls  # Should show: src/ prisma/ package.json .env (if exists)
```

**For Private Repositories:**

Option 1 — GitHub Personal Access Token (PAT):
```bash
# Generate a PAT at: GitHub → Settings → Developer Settings → Tokens
git clone https://YOUR_PAT_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
```

Option 2 — SSH Deploy Key:
```bash
# Generate SSH key on EC2
ssh-keygen -t ed25519 -C "ec2-deploy-key"
cat ~/.ssh/id_ed25519.pub
# Add the public key to GitHub repo → Settings → Deploy Keys
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### 5.6 Install Dependencies

```bash
# Install all npm packages defined in package.json
npm install

# CRITICAL: Generate Prisma Client
# This reads prisma/schema.prisma and generates type-safe database client
npx prisma generate
```

> [!IMPORTANT]
> **`npx prisma generate` is mandatory.** It generates the Prisma Client code from your schema file. Without running this, the application will fail at startup with an error like "Cannot find module '@prisma/client'" or "PrismaClient is unable to run in this browser environment."

**Verify the installation:**
```bash
ls node_modules/@prisma/client  # Should exist after generate
```

### 5.7 Configure Environment Variables

```bash
# Create the .env file in the backend directory
nano .env
```

Paste and fill in the following:

```bash
# =========================================
# Database Configuration
# =========================================
# Get from: Neon Console → Your Project → Connection Details → Prisma format
DATABASE_URL="postgresql://USER:PASSWORD@ep-cool-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# =========================================
# Authentication
# =========================================
# Strong random secret — minimum 32 characters
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="your-very-long-cryptographically-random-secret-key-here"

# =========================================
# Server Configuration
# =========================================
PORT=3000
NODE_ENV=production

# =========================================
# AI Service (Optional)
# =========================================
AI_SERVICE_URL=http://localhost:8000
ENABLE_AI_SCHEDULER=true
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Outputs: a9f3d8b2c1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

> [!CAUTION]
> **Never commit `.env` to Git.** Your `DATABASE_URL` contains your Neon credentials. If exposed, anyone can access, modify, or delete all your data. The `.gitignore` should already exclude `.env`. Verify: `cat .gitignore | grep .env`

Save the file: `Ctrl+O` → `Enter` → `Ctrl+X` (in nano)

### 5.8 Run with PM2

```bash
# Start the Express.js application with PM2
# --name gives the process a human-readable name
pm2 start src/server.js --name rasodu-backend

# Expected output:
# [PM2] Spawning PM2 daemon with pm2_home=/home/ec2-user/.pm2
# [PM2] PM2 Successfully daemonized
# [PM2] Starting /home/ec2-user/.../src/server.js in fork_mode (1 instance)
# [PM2] Done.
# +----+------------------+------+--...--+
# | id | name             | mode | status |
# +----+------------------+------+--...--+
# |  0 | rasodu-backend   | fork | online |
# +----+------------------+------+--...--+
```

**Save the PM2 process list and configure startup:**

```bash
# Save current process list (survives PM2 daemon restart)
pm2 save

# Generate startup script for system boot
# Run the command EXACTLY as PM2 outputs it (it will be a long sudo command)
pm2 startup

# PM2 outputs something like:
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v18.20.0/bin \
#   /home/ec2-user/.nvm/versions/node/v18.20.0/lib/node_modules/pm2/bin/pm2 \
#   startup systemd -u ec2-user --hp /home/ec2-user

# Copy and run that exact command (it varies per system)
```

> [!IMPORTANT]
> You must run the `sudo env PATH=...` command that PM2 outputs from `pm2 startup`. This registers PM2 as a systemd service, ensuring your application starts automatically every time the EC2 instance boots or restarts.

**Verify the application:**
```bash
# 1. Check PM2 process status
pm2 status
# Should show: rasodu-backend | online | ...

# 2. Test health endpoint locally (should return 200 + JSON)
curl http://localhost:3000/api/health

# 3. View application logs
pm2 logs rasodu-backend --lines 30
# Should show: Database connected successfully, Server running on port 3000
```

### 5.9 PM2 Command Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Show all processes and their status |
| `pm2 list` | Alias for `pm2 status` |
| `pm2 logs rasodu-backend` | Stream logs in real-time (stdout + stderr) |
| `pm2 logs rasodu-backend --lines 100` | View last 100 log lines |
| `pm2 logs rasodu-backend --err` | Show only error logs |
| `pm2 logs rasodu-backend --out` | Show only stdout logs |
| `pm2 restart rasodu-backend` | Restart process (brief downtime) |
| `pm2 reload rasodu-backend` | Zero-downtime restart (cluster mode only) |
| `pm2 stop rasodu-backend` | Stop the process (keeps it in PM2 list) |
| `pm2 start rasodu-backend` | Start a stopped process |
| `pm2 delete rasodu-backend` | Remove from PM2 list entirely |
| `pm2 monit` | Real-time CPU, memory, and log dashboard |
| `pm2 describe rasodu-backend` | Detailed process information |
| `pm2 flush` | Clear all log files |
| `pm2 save` | Save process list to disk |
| `pm2 startup` | Generate system startup configuration |
| `pm2 unstartup` | Remove startup configuration |
| `pm2 update` | Update PM2 daemon |

**Updating the Application (Redeployment):**

```bash
# SSH into EC2
ssh -i rasodu-key.pem ec2-user@YOUR_EC2_IP

# Navigate to backend directory
cd /home/ec2-user/YOUR_REPO/restaurant-pos-backend

# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Regenerate Prisma client if schema changed
npx prisma generate

# Apply database migrations if any
npx prisma db push

# Restart the application
pm2 restart rasodu-backend

# Verify it's running
pm2 status
curl http://localhost:3000/api/health
```

---

## 6. VPC and Networking Setup

### Using the Default VPC

For this deployment, we use the **default VPC** that AWS automatically creates in every region. No manual VPC creation is required.

**To verify the default VPC exists:**
1. Go to **VPC → Your VPCs**
2. Look for the VPC with the "Default VPC" column showing "Yes"
3. Note its CIDR: should be `172.31.0.0/16`

### Identifying Public Subnets for the ALB

The ALB requires two public subnets in different Availability Zones.

**To find subnets:**
1. Go to **VPC → Subnets**
2. Filter by your default VPC
3. Look for subnets in `ap-south-1a` and `ap-south-1b`
4. Confirm they have an Internet Gateway route (check Route Table)

**Default subnet CIDR ranges:**

| AZ | Subnet CIDR | Subnet ID |
|----|------------|-----------|
| `ap-south-1a` | `172.31.0.0/20` | `subnet-xxxxxxxx` |
| `ap-south-1b` | `172.31.16.0/20` | `subnet-yyyyyyyy` |
| `ap-south-1c` | `172.31.32.0/20` | `subnet-zzzzzzzz` |

### Internet Gateway

The default VPC has an Internet Gateway automatically attached. To verify:
1. Go to **VPC → Internet Gateways**
2. There should be one attached to your default VPC

Without the Internet Gateway:
- EC2 instances cannot be reached from the internet
- EC2 instances cannot make outbound internet connections (needed for npm install, DB connections)

---

## 7. Security Groups Configuration

### 7.1 ALB Security Group

Navigate to **EC2 → Security Groups → Create Security Group**

| Field | Value |
|-------|-------|
| Security Group Name | `restaurant-pos-alb-sg` |
| Description | `Allows internet traffic to the Rasodu POS ALB` |
| VPC | Default VPC |

**Inbound Rules:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| HTTP | TCP | 80 | `0.0.0.0/0` | Internet HTTP (will redirect to HTTPS) |
| HTTP | TCP | 80 | `::/0` | IPv6 HTTP |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Internet HTTPS |
| HTTPS | TCP | 443 | `::/0` | IPv6 HTTPS |

**Outbound Rules:**

| Type | Protocol | Port Range | Destination | Description |
|------|----------|------------|-------------|-------------|
| All Traffic | All | All | `0.0.0.0/0` | Allow ALB to reach EC2 |

Click **Create Security Group** and note the Security Group ID (e.g., `sg-0abc123def456789a`).

### 7.2 EC2 Security Group

Navigate to **EC2 → Security Groups → Create Security Group**

| Field | Value |
|-------|-------|
| Security Group Name | `launch-wizard-1` *(or `rasodu-pos-ec2-sg` for clarity)* |
| Description | `EC2 Security Group for Rasodu POS backend` |
| VPC | Default VPC |

**Inbound Rules:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | `YOUR_IP_ADDRESS/32` | Your machine only |
| Custom TCP | TCP | 3000 | `sg-0abc123def456789a` (ALB SG ID) | App traffic from ALB only |

> [!CAUTION]
> For the port 3000 rule, the Source **must be the Security Group ID** of `restaurant-pos-alb-sg` (e.g., `sg-0abc123def456789a`). Never use `0.0.0.0/0` for this rule. Using `0.0.0.0/0` exposes your Express.js server to the entire internet.

**Outbound Rules:**

| Type | Protocol | Port Range | Destination | Description |
|------|----------|------------|-------------|-------------|
| All Traffic | All | All | `0.0.0.0/0` | Allow outbound (Neon DB, npm, updates) |

### 7.3 Security Group Referencing

**Security Group Referencing** is a powerful AWS feature: instead of specifying an IP address as the source/destination for a rule, you reference another Security Group by its ID.

**How it works:**

```
Rule in EC2 Security Group:
  Inbound: Custom TCP, Port 3000, Source: sg-0abc123def456789a (ALB SG)

Effect:
  Any resource that has "sg-0abc123def456789a" attached
  → CAN reach this EC2 on port 3000

  Any resource WITHOUT that SG (including random internet users)
  → BLOCKED on port 3000
```

**Why this is better than IP-based rules:**

1. **ALBs use dynamic IPs** — An ALB does not have a fixed IP address. AWS dynamically assigns IPs to ALBs from a pool and may change them. A Security Group reference always works regardless of what IP the ALB is using.

2. **No management overhead** — When you add more EC2 instances to the target group, or replace them, the Security Group rule automatically applies without any changes.

3. **Clearer audit trail** — Looking at the rule, it's clear that "only the ALB" (identified by its Security Group) can reach port 3000, not some arbitrary IP range.

**Stateful Firewall Explained:**

```
Request (Inbound):
  ALB → [SG checks: TCP 3000 from ALB SG? ALLOWED] → EC2 :3000

Response (Outbound):
  EC2 → [SG: This is a RESPONSE to an established connection. Auto-allowed] → ALB
```

With a stateful firewall, you never need an outbound rule to "allow response traffic." The security group tracks the connection state and automatically permits responses.

---

## 8. Application Load Balancer Setup

### 8.1 Create the ALB

Navigate to **EC2 → Load Balancers → Create Load Balancer → Application Load Balancer**

**Step 1: Basic Configuration**

| Setting | Value |
|---------|-------|
| Load Balancer Name | `restaurant-pos-alb` |
| Scheme | Internet-facing |
| IP Address Type | IPv4 |

**Step 2: Network Mapping**

| Setting | Value |
|---------|-------|
| VPC | Default VPC |
| Availability Zones | Select `ap-south-1a` AND `ap-south-1b` |
| Subnets | Select one public subnet per AZ |

**Step 3: Security Groups**

- Remove the default Security Group if pre-selected
- Select `restaurant-pos-alb-sg`

**Step 4: Listeners and Routing**

| Listener Protocol | Port | Default Action |
|------------------|------|----------------|
| HTTP | 80 | *(Configure redirect after creation)* |
| HTTPS | 443 | Forward to `restaurant-pos-tg` |

For the HTTPS listener, select the ACM certificate: `*.parth10.me` (from `ap-south-1` region).

**Step 5: Create**

Click **Create Load Balancer**.

After creation, find and note the **DNS Name** from the ALB details page:
```
restaurant-pos-alb-1234567890.ap-south-1.elb.amazonaws.com
```
This DNS name is what you'll set as the CNAME value for `api.parth10.me` in Namecheap.

### 8.2 HTTP Listener — Port 80

The HTTP listener's only purpose is to redirect all HTTP traffic to HTTPS.

**Navigate to:** EC2 → Load Balancers → `restaurant-pos-alb` → Listeners tab → Select Port 80 listener → Edit

**Configure Default Action:**

| Setting | Value |
|---------|-------|
| Action Type | Redirect to URL |
| Protocol | HTTPS |
| Port | 443 |
| Status Code | **301** - Permanently moved |
| Path, Query, Host | Keep original (#{path}?#{query}) |

```mermaid
sequenceDiagram
    actor User
    participant ALB as ALB (restaurant-pos-alb)
    participant EC2 as EC2 (Express :3000)

    User->>ALB: GET http://api.parth10.me/api/health
    Note over ALB: HTTP Listener: Port 80
    Note over ALB: Action: Redirect to HTTPS
    ALB-->>User: 301 Moved Permanently → https://api.parth10.me/api/health
    User->>ALB: GET https://api.parth10.me/api/health
    Note over ALB: HTTPS Listener: Port 443
    Note over ALB: TLS Termination happens here
    Note over ALB: Action: Forward to restaurant-pos-tg
    ALB->>EC2: GET http://172.31.x.x:3000/api/health
    EC2-->>ALB: 200 OK {"status":"ok"}
    ALB-->>User: 200 OK {"status":"ok"} (encrypted HTTPS)
```

**Why 301 instead of 302?**

| Code | Type | Browser Caches? | Search Engine Effect |
|------|------|----------------|---------------------|
| 301 | Permanent | Yes | Passes SEO ranking to HTTPS |
| 302 | Temporary | No | Does not transfer SEO |

Use 301 for permanent HTTP → HTTPS redirects. Browsers cache 301 redirects, meaning subsequent visits directly use HTTPS without going through the redirect.

### 8.3 HTTPS Listener — Port 443

This listener handles all encrypted HTTPS traffic.

**Navigate to:** EC2 → Load Balancers → `restaurant-pos-alb` → Listeners tab → HTTPS:443 listener

**Configuration:**

| Setting | Value |
|---------|-------|
| Protocol | HTTPS |
| Port | 443 |
| Security Policy | `ELBSecurityPolicy-TLS13-1-2-2021-06` |
| Certificate | `*.parth10.me` (ACM, ap-south-1) |
| Default Action | Forward to `restaurant-pos-tg` |

**Understanding Listener Rules:**

Listeners can have multiple rules that match based on conditions:

```
HTTPS Listener (Port 443)
|
+-- Rule 1 (priority 1): IF Host = "api.parth10.me" → Forward to restaurant-pos-tg
|
+-- Default Rule (no condition): Forward to restaurant-pos-tg
```

For our single-backend setup, the default forward rule is sufficient. Rules become useful when:
- Multiple backend services share one ALB (path-based routing: `/api/` → backend, `/ws/` → websocket service)
- Different domains share one ALB (host-based routing)

**Why the Security Policy Matters:**

The security policy controls which TLS versions and cipher suites the ALB accepts.

`ELBSecurityPolicy-TLS13-1-2-2021-06` supports:
- TLS 1.2 and TLS 1.3 (modern, secure)
- Rejects TLS 1.0 and TLS 1.1 (deprecated, vulnerable)
- Uses strong cipher suites (AES-GCM, ChaCha20)

---

## 9. Target Group Configuration

Navigate to **EC2 → Target Groups → Create Target Group**

### Step 1: Target Type

| Setting | Value |
|---------|-------|
| Target Type | Instances |
| Target Group Name | `restaurant-pos-tg` |
| Protocol | HTTP |
| Port | `3000` |
| VPC | Default VPC |
| Protocol Version | HTTP1 |

### Step 2: Health Check Configuration

| Setting | Value | Why This Value? |
|---------|-------|----------------|
| Health Check Protocol | HTTP | EC2 speaks HTTP (TLS terminated at ALB) |
| Health Check Path | `/api/health` | Dedicated health endpoint |
| Health Check Port | Traffic Port | Same port as app (3000) |
| Healthy Threshold | 5 | 5 successes before marking healthy |
| Unhealthy Threshold | 2 | 2 failures to mark unhealthy (60 seconds) |
| Interval | 30 seconds | Frequency of health checks |
| Timeout | 5 seconds | Max wait time for response |
| Success Codes | 200 | Only HTTP 200 means healthy |

**Why These Values:**
- Unhealthy threshold = 2 catches problems quickly (within 60 seconds)
- Healthy threshold = 5 prevents false-positives from brief flickers
- 30-second interval balances detection speed vs. API load

### Step 3: Register Targets

1. In **Available Instances**, select your EC2 instance
2. Set port to `3000`
3. Click **Include as pending below**
4. Click **Create Target Group**

### The Health Endpoint in Express.js

Your Express.js must respond to `GET /api/health` with HTTP 200.

Looking at the backend's `src/routes/index.js`, the health route should be defined. If not, add it:

```javascript
// In src/routes/index.js or app.js
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
  });
});

// The route is mounted at /api, so full path = GET /api/health
app.use('/api', router);
```

**Verify locally:**
```bash
curl -v http://localhost:3000/api/health
# Expected: HTTP/1.1 200 OK
# Body: {"status":"ok","timestamp":"..."}
```

---

## 10. TLS / SSL — Understanding and Configuration

This section explains HTTPS encryption concepts from first principles — essential for understanding why the infrastructure is configured the way it is.

### 10.1 HTTP vs HTTPS

**HTTP (HyperText Transfer Protocol):**
- All data transmitted as **plain text**
- Anyone on the network path (ISP, router, cafe wifi) can read all data
- No identity verification — a fake server can impersonate the real one
- Port 80 by default

**HTTPS (HTTP Secure):**
- HTTP over a **TLS (Transport Layer Security)** encrypted channel
- Data is encrypted — interceptors see meaningless encrypted bytes
- Certificates prove server identity (verified by trusted Certificate Authorities)
- Port 443 by default

```
HTTP request:
  POST /api/auth/login
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9...
  Body: {"email":"admin@rasodu.com","password":"mypassword123"}
  
  Anyone on network can read: email, password, JWT token = SECURITY BREACH

HTTPS request (what the network sees):
  Ω∂π∑≈∫µ≤≥ΩπΩ∂π∑≈∫µ≤≥Ωπ∂π∑≈∫µ≤≥...
  (Completely encrypted — meaningless without the decryption key)
```

### 10.2 SSL vs TLS

| Protocol | Year | Status |
|----------|------|--------|
| SSL 2.0 | 1995 | Deprecated (multiple vulnerabilities) |
| SSL 3.0 | 1996 | Deprecated (POODLE attack, CVE-2014-3566) |
| TLS 1.0 | 1999 | Deprecated (BEAST attack) |
| TLS 1.1 | 2006 | Deprecated |
| TLS 1.2 | 2008 | Current — widely used, secure |
| TLS 1.3 | 2018 | Current standard — faster, more secure |

"SSL" and "TLS" are often used interchangeably in conversation. When someone says "SSL certificate", they mean a TLS certificate. SSL was replaced by TLS in 1999, but the marketing term "SSL" stuck.

> [!NOTE]
> There is no such thing as an "SSL certificate" technically — all modern certificates use TLS. The industry just hasn't updated the terminology. When you buy an "SSL certificate," you're buying a TLS certificate.

### 10.3 Certificates and Certificate Authorities

**What is a TLS Certificate?**

A certificate is a digital document that contains:
1. The domain name(s) it's valid for (e.g., `*.parth10.me`)
2. The certificate owner's public key
3. The certificate's expiration date
4. A digital signature from a Certificate Authority (CA)

**Asymmetric Cryptography (Public/Private Key):**

TLS uses a mathematically linked key pair:

```
Public Key:  Can be shared with anyone. Used to ENCRYPT data.
Private Key: Must be kept secret. Used to DECRYPT data encrypted with the public key.

Mathematical relationship: Data encrypted with public key can ONLY be decrypted 
                           by the matching private key.
```

**Certificate Authorities (CAs):**

A CA is a trusted organization that:
1. Verifies that you control a domain (through DNS or HTTP challenges)
2. Signs your certificate with their private key
3. Browsers have the CA's public keys pre-installed (root certificates)

When your browser receives a certificate, it:
1. Finds the CA's signature on the certificate
2. Uses the CA's pre-installed public key to verify the signature
3. Confirms the certificate is genuine (not forged)

Major CAs: DigiCert, Comodo/Sectigo, Let's Encrypt, GlobalSign, **AWS ACM**

**How the Browser Verifies a Certificate:**

```mermaid
sequenceDiagram
    actor Browser
    participant Server as api.parth10.me (ALB)
    participant CA as Certificate Authority (ACM)

    Browser->>Server: "I want to connect. I support TLS 1.2, 1.3."
    Server->>Browser: "Here is my certificate (domain, public key, expiry, CA signature)"
    
    Browser->>Browser: Check 1: Is cert domain = api.parth10.me? YES (*.parth10.me covers it)
    Browser->>Browser: Check 2: Is cert expired? NO (valid dates)
    Browser->>Browser: Check 3: Is CA signature valid using pre-installed CA public key? YES
    Browser->>Browser: Check 4: Is cert revoked? NO (OCSP check)
    
    Browser->>Server: All checks passed! Proceed with secure connection.
```

If any check fails:
```
NET::ERR_CERT_COMMON_NAME_INVALID  → Domain doesn't match certificate
NET::ERR_CERT_DATE_INVALID         → Certificate expired
NET::ERR_CERT_AUTHORITY_INVALID    → CA not trusted (self-signed)
```

### 10.4 TLS Handshake

Before any application data is exchanged, the browser and server perform a TLS handshake to establish shared encryption keys:

```
TLS 1.3 Handshake (1 Round Trip):

Client → Server: ClientHello
  - Supported TLS versions
  - Supported cipher suites (encryption algorithms)
  - Random number for key derivation
  - Key share (for ephemeral key exchange)

Server → Client: ServerHello + Certificate + Finished
  - Selected TLS version (1.3)
  - Selected cipher suite (e.g., TLS_AES_256_GCM_SHA384)
  - Server's certificate (with public key)
  - Encrypted with derived keys

Client → Server: Finished
  - Confirms handshake complete
  - Now sending encrypted application data

Both sides have derived the same session keys through the key exchange.
All subsequent HTTP requests and responses are encrypted.
```

**Performance:** TLS 1.3 requires only **1 round trip** (vs 2 in TLS 1.2) to establish the secure connection, making it faster.

### 10.5 TLS Termination at the ALB

**TLS Termination** means the ALB decrypts the HTTPS traffic and forwards the request as plain HTTP to EC2. EC2 never sees encrypted traffic.

```
Browser ─── HTTPS (encrypted) ───▶ ALB ─── HTTP (plain) ───▶ EC2 :3000
                                    ^
                                    | TLS termination happens here
                                    | ALB decrypts using the private key
                                    | (stored securely by ACM)
```

**Why Express.js Only Speaks HTTP:**

The Express.js server listens on `PORT=3000` with a plain HTTP server:

```javascript
// src/server.js
import { createServer } from 'http';
const httpServer = createServer(app);   // Plain HTTP, not HTTPS
httpServer.listen(config.port, ...);   // Port 3000
```

This is intentional. Reasons:

| Reason | Explanation |
|--------|-------------|
| **Simplicity** | No SSL certificate management on the app server |
| **Performance** | TLS encryption/decryption offloaded to ALB hardware |
| **Centralized certs** | ACM manages all certificates; no code changes on cert renewal |
| **Internal safety** | Traffic between ALB and EC2 stays within the VPC's private network |
| **Horizontal scaling** | Add more EC2 instances — none need SSL configuration |

**Is Internal HTTP Safe?**

Traffic between the ALB and EC2 travels through the **VPC's internal private network**. This traffic:
- Never leaves AWS's data center infrastructure
- Is not routable from the public internet (private IP addresses)
- Is protected by the Security Group (only ALB SG can reach EC2 on port 3000)

For most deployments, this is acceptably secure. For compliance (PCI-DSS, HIPAA), you would configure HTTPS on EC2 as well (end-to-end encryption).

---

## 11. ACM — Certificate Provisioning

### 11.1 Request a Certificate for the ALB (ap-south-1)

> [!IMPORTANT]
> Ensure your AWS Console region is set to **`ap-south-1` (Mumbai)** before proceeding.

Navigate to **AWS Console → ACM → Request a Certificate**

**Steps:**

1. Select **Request a public certificate** → Next
2. Enter domain names:
   ```
   *.parth10.me
   ```
3. Select **DNS Validation** (recommended over email validation)
4. Key Algorithm: RSA 2048
5. Click **Request**

ACM creates a certificate in **Pending validation** state.

### 11.2 Request a Certificate for CloudFront (us-east-1)

> [!IMPORTANT]
> **Switch your AWS Console region to `us-east-1` (N. Virginia)**. CloudFront is a global service managed from `us-east-1` and can only use ACM certificates from that region.

Navigate to **AWS Console → (Switch to us-east-1) → ACM → Request a Certificate**

Repeat identical steps: domain `*.parth10.me`, DNS validation.

You now have two pending certificates — one in each region.

### 11.3 DNS Validation

ACM provides a CNAME record that you must add to your DNS provider to prove domain ownership.

**Finding the Validation Record:**
1. Go to ACM (in either region)
2. Click on your pending certificate
3. Expand the domain in "Domains" section
4. Find the CNAME record provided:

```
Record Name:  _abc12345678.parth10.me
Record Type:  CNAME
Record Value: _def901234567.acm-validations.aws.
```

**Adding to Namecheap:**
1. Log in to Namecheap → Domain List → parth10.me → Manage → Advanced DNS
2. Add Host Record:
   - Type: CNAME Record
   - Host: `_abc12345678` *(just the subdomain part, without `.parth10.me`)*
   - Value: `_def901234567.acm-validations.aws.`
   - TTL: Automatic

3. Save changes

**Wait for Validation:**
- ACM checks the DNS record every few minutes
- Validation typically completes in 5-30 minutes
- Certificate status changes from **Pending validation** → **Issued**

> [!TIP]
> The ACM validation CNAME record is **permanent** — you only add it once. ACM uses the same DNS record for automatic certificate renewals. As long as this CNAME record exists in your DNS, ACM will automatically renew your certificate before expiry without any action from you.

**The same DNS validation record covers both certificates** (ap-south-1 and us-east-1), since both are for the same domain.

### 11.4 Wildcard Certificates

A wildcard certificate uses `*` as the leftmost label in the domain.

**What `*.parth10.me` covers:**

| Domain | Covered? | Reason |
|--------|----------|--------|
| `api.parth10.me` | ✅ Yes | One-level subdomain |
| `rasodu.parth10.me` | ✅ Yes | One-level subdomain |
| `www.parth10.me` | ✅ Yes | One-level subdomain |
| `staging.parth10.me` | ✅ Yes | One-level subdomain |
| `parth10.me` | ❌ No | Root domain (not covered by wildcard) |
| `app.api.parth10.me` | ❌ No | Two-level subdomain |

**Benefit of Wildcards:**
One certificate covers all current and future subdomains. Instead of requesting separate certificates for `api.parth10.me`, `rasodu.parth10.me`, etc., one `*.parth10.me` certificate handles everything.

---

## 12. Frontend Deployment — S3 + CloudFront

### 12.1 Build the React App

The React frontend must be compiled into static files before deployment.

**Configure Production Environment Variable:**

```bash
# On your local machine
cd restaurant-pos-frontend

# Create or update the production environment file
# Vite automatically uses this file when running `npm run build`
cat > .env.production << 'EOF'
VITE_API_URL=https://api.parth10.me
EOF
```

> [!IMPORTANT]
> `VITE_API_URL` must be `https://api.parth10.me` (not `http://`). If it's HTTP, the browser will block API calls from the HTTPS frontend due to Mixed Content policy (see Troubleshooting Section 17.1).

**Vite Environment File Priority:**
```
.env                  # Loaded always
.env.local            # Loaded always, git-ignored
.env.development      # Loaded when NODE_ENV=development
.env.production       # Loaded when NODE_ENV=production (npm run build)
.env.development.local
.env.production.local
```

**Build:**
```bash
npm install        # Ensure all dependencies are installed
npm run build      # Creates dist/ folder
```

**Verify the build:**
```bash
ls dist/
# Expected output:
# index.html
# assets/
#   index-XXXXXXXX.js
#   index-XXXXXXXX.css
#   ...

# Check that API URL is baked in correctly
grep -r "api.parth10.me" dist/assets/
# Should find your production API URL in the JS bundle
```

**Project Structure After Build:**
```
dist/
|-- index.html              (HTML entry point)
|-- assets/
|   |-- index-Bh3k9qpl.js  (all JavaScript, content-hashed)
|   |-- index-Ah2k8wqr.css  (all CSS, content-hashed)
|   |-- logo-Xk9mNp2l.svg  (images)
|   +-- ...
+-- favicon.ico
```

### 12.2 Create and Configure S3 Bucket

Navigate to **S3 → Create Bucket**

**Basic Configuration:**

| Setting | Value |
|---------|-------|
| Bucket Name | `rasodu-pos-frontend` *(globally unique — if taken, add a suffix)* |
| Region | `ap-south-1` *(or any region — CloudFront is global)* |
| Object Ownership | ACLs disabled |
| Block Public Access | **All checkboxes enabled** |
| Versioning | Enable *(recommended for rollback)* |

Click **Create Bucket**.

**Enable Static Website Hosting:**

1. Click on the bucket → **Properties** tab
2. Scroll to **Static website hosting** → Edit
3. Configure:

| Setting | Value |
|---------|-------|
| Static website hosting | Enable |
| Hosting type | Host a static website |
| Index document | `index.html` |
| Error document | `index.html` |

4. Click **Save changes**

Note the website endpoint URL (e.g., `http://rasodu-pos-frontend.s3-website.ap-south-1.amazonaws.com`). This is used as CloudFront's origin.

### 12.3 Upload Build Artifacts to S3

**Method 1 — AWS CLI (Recommended for CI/CD):**

```bash
# Sync entire dist folder to S3
# --delete removes files in S3 that no longer exist locally (clean up old builds)
aws s3 sync ./dist s3://rasodu-pos-frontend --delete

# Set cache headers for better performance:
# index.html → no-cache (must always be fresh)
aws s3 cp dist/index.html s3://rasodu-pos-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# JS/CSS assets → cache forever (content-hashed filenames = safe)
aws s3 sync dist/assets s3://rasodu-pos-frontend/assets \
  --cache-control "public, max-age=31536000, immutable"
```

**Method 2 — AWS Console (Manual):**

1. Open `rasodu-pos-frontend` bucket
2. Click **Upload**
3. Click **Add files** and select the contents of `dist/` (not the `dist` folder itself)
4. Click **Upload**

> [!IMPORTANT]
> Upload the **contents** of `dist/`, not the `dist/` folder itself. If you upload the folder, files will be at paths like `dist/index.html` instead of `index.html`, which won't work as a website.

**Automated Deployment Script:**

Create `deploy-frontend.sh` in the project root:

```bash
#!/bin/bash
# Rasodu POS Frontend Deployment Script
set -e  # Exit on error

BUCKET="rasodu-pos-frontend"
CLOUDFRONT_ID="E1EXAMPLE12345"  # Replace with your distribution ID

echo "==> Building React app..."
cd restaurant-pos-frontend
npm run build
cd ..

echo "==> Uploading to S3..."
aws s3 sync restaurant-pos-frontend/dist s3://$BUCKET --delete

echo "==> Setting cache headers..."
# No-cache for index.html
aws s3 cp restaurant-pos-frontend/dist/index.html \
  s3://$BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "==> Deployment complete!"
echo "    URL: https://rasodu.parth10.me"
```

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

### 12.4 Create CloudFront Distribution

Navigate to **CloudFront → Distributions → Create Distribution**

**Origin:**

| Setting | Value |
|---------|-------|
| Origin Domain | S3 website endpoint (e.g., `rasodu-pos-frontend.s3-website.ap-south-1.amazonaws.com`) |
| Name | `s3-rasodu-frontend` |
| Origin Access | Public *(when using S3 website endpoint)* |

> [!NOTE]
> Use the **S3 website endpoint** URL (shown in S3 → Properties → Static website hosting), not the S3 REST endpoint. The website endpoint (`.s3-website.ap-south-1.amazonaws.com`) correctly serves `index.html` as the root and handles error documents — critical for React Router.

**Default Cache Behavior:**

| Setting | Value |
|---------|-------|
| Viewer Protocol Policy | Redirect HTTP to HTTPS |
| Allowed HTTP Methods | GET, HEAD |
| Cache Policy | CachingOptimized |
| Compress Objects Automatically | Yes |

**Settings:**

| Setting | Value |
|---------|-------|
| Price Class | All Locations (best performance) |
| Alternate Domain Names (CNAMEs) | `rasodu.parth10.me` |
| Custom SSL Certificate | `*.parth10.me` from ACM **(us-east-1 only!)** |
| Default Root Object | `index.html` |

**Custom Error Responses (Required for React Router):**

| HTTP Error Code | Customize? | Response Code | Response Page Path |
|-----------------|------------|---------------|--------------------|
| 403 Forbidden | Yes | 200 | `/index.html` |
| 404 Not Found | Yes | 200 | `/index.html` |

> [!IMPORTANT]
> The custom error responses are **required** for React Router. When a user navigates directly to a route like `/admin/products`, S3 returns 403 or 404 (no such file). Without this configuration, the user would see an XML error. With it, CloudFront serves `index.html` and React Router renders the correct page.

**Click Create Distribution.**

After creation (takes 3-5 minutes to deploy globally):
- Note the **Distribution Domain Name** (e.g., `d1abc123def.cloudfront.net`)
- This is what you'll set as the CNAME for `rasodu.parth10.me` in Namecheap

### 12.5 CloudFront Invalidations

After every frontend deployment, create an invalidation:

```bash
# Invalidate all paths (recommended after full rebuild)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# Invalidate only index.html (if JS/CSS unchanged)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html"

# Check invalidation status
aws cloudfront list-invalidations \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --query 'InvalidationList.Items[0].[Id,Status]' \
  --output table
```

Invalidations take **1-5 minutes** to propagate globally.

---

## 13. DNS Configuration — Namecheap

### 13.1 Frontend CNAME Record

Log in to **Namecheap → Domain List → `parth10.me` → Manage → Advanced DNS**

Click **Add New Record**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | `rasodu` | `d1abc123def.cloudfront.net` | Automatic |

- **Host**: `rasodu` *(Namecheap adds `.parth10.me` automatically)*
- **Value**: Your CloudFront Distribution Domain Name *(found in CloudFront → Distributions)*

Click **Save All Changes**.

### 13.2 Backend CNAME Record

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | `api` | `restaurant-pos-alb-1234567890.ap-south-1.elb.amazonaws.com` | Automatic |

- **Host**: `api`
- **Value**: Your ALB DNS Name *(found in EC2 → Load Balancers → DNS name column)*

### 13.3 ACM DNS Validation Records

Add the CNAME record provided by ACM for certificate validation:

| Type | Host | Value |
|------|------|-------|
| CNAME Record | `_abc12345678` | `_def901234567.acm-validations.aws.` |

- **Host**: The underscore-prefixed subdomain from ACM *(without `.parth10.me`)*
- **Value**: The ACM validation target *(exactly as provided)*

> [!NOTE]
> In Namecheap, enter only the subdomain portion in the Host field. Namecheap appends the root domain automatically. If ACM shows `_abc12345678.parth10.me`, enter `_abc12345678` in the Host field.

**Your Namecheap DNS Should Look Like This:**

| Type | Host | Value |
|------|------|-------|
| CNAME | `rasodu` | `d1abc123def.cloudfront.net` |
| CNAME | `api` | `restaurant-pos-alb-xxxx.ap-south-1.elb.amazonaws.com` |
| CNAME | `_abc12345678` | `_def901234567.acm-validations.aws.` |

### 13.4 DNS Propagation

After adding DNS records, changes must propagate through the global DNS network.

**Propagation Times:**

| TTL | Expected Propagation |
|-----|---------------------|
| 300 seconds (5 min) | 5-30 minutes |
| 1800 seconds (30 min) | 30 min - 2 hours |
| 86400 seconds (24h) | Up to 48 hours |

Namecheap's default TTL is usually 1800 seconds.

**Test DNS Resolution:**

```bash
# Test frontend CNAME
nslookup rasodu.parth10.me
# Expected: CNAME → d1abc123def.cloudfront.net → 13.x.x.x

# Test backend CNAME
nslookup api.parth10.me
# Expected: CNAME → restaurant-pos-alb-xxxx.ap-south-1.elb.amazonaws.com → x.x.x.x

# Use dig for detailed information
dig rasodu.parth10.me CNAME +short
dig api.parth10.me CNAME +short

# Use online tools to check from multiple global locations
# https://www.whatsmydns.net/?name=api.parth10.me&type=CNAME
```

**Understanding the CNAME Chain:**

```
api.parth10.me
  → CNAME → restaurant-pos-alb-1234.ap-south-1.elb.amazonaws.com
              → A → 13.126.x.x (ALB IP, managed by AWS)

rasodu.parth10.me
  → CNAME → d1abc123def.cloudfront.net
              → A → 52.x.x.x (CloudFront edge IP, changes with location)
```

---

## 14. Neon PostgreSQL

### What is Neon?

Neon is a serverless PostgreSQL provider. "Serverless" means:
- You don't manage any PostgreSQL server instance
- The database **scales to zero** when idle (no charges for idle time)
- Scales up automatically on demand
- Pay per compute second, not per hour

### Creating a Neon Project

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project (choose region closest to your EC2: `ap-southeast-1` for Mumbai proximity)
3. Note the project dashboard

### Getting the Connection String

In the Neon console:
1. Select your project
2. Click **Connection Details**
3. Select **Prisma** from the connection string format dropdown
4. Copy the connection string:

```
postgresql://USER:PASSWORD@ep-cool-xxx-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

| Part | Description |
|------|-------------|
| `USER` | Database username (Neon provides this) |
| `PASSWORD` | Database password (Neon provides this) |
| `ep-cool-xxx-123456` | Your endpoint hostname |
| `ap-southeast-1.aws.neon.tech` | Neon's domain |
| `neondb` | Database name |
| `?sslmode=require` | **Required** — enforces SSL/TLS encryption |

### Setting Up the Database Schema

Run these commands on your **local machine** (or EC2 after setting DATABASE_URL):

```bash
cd restaurant-pos-backend

# Push schema to Neon (creates all tables)
npx prisma db push

# Verify: check tables were created
npx prisma studio  # Opens web UI to browse data

# Seed with initial data (optional)
npm run db:seed
```

### Connection Pooling

For production, use Neon's **pooled connection endpoint**:

```
# Direct connection (development):
postgresql://user:pass@ep-cool-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Pooled connection (production - add -pooler suffix):
postgresql://user:pass@ep-cool-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Connection pooling (via PgBouncer) is essential for production because:
- Node.js Prisma by default creates multiple database connections
- Without pooling, you may hit Neon's connection limit (10 for free tier)
- Pooling multiplexes many app connections over fewer actual DB connections

> [!TIP]
> Use the **pooled connection string** (with `-pooler` suffix) in your production `DATABASE_URL` environment variable. This is especially important if you plan to scale to multiple EC2 instances.

### Security

- `?sslmode=require` ensures all connections to Neon are encrypted
- Neon connections travel over the internet (EC2 → Neon cloud)
- SSL/TLS encrypts the database queries and results
- Neon provides IP allowlist controls (optional additional security)

---

## 15. Environment Variables Reference

### Backend Environment Variables

These are set in `restaurant-pos-backend/.env` on the EC2 instance.

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host/db?sslmode=require` | Neon PostgreSQL connection string (use pooled) |
| `JWT_SECRET` | ✅ | `a9f3d8b2...` (64+ chars) | Secret for JWT token signing. Must be long and random. |
| `PORT` | ✅ | `3000` | Port Express listens on |
| `NODE_ENV` | ✅ | `production` | Enables production optimizations, disables error stack traces |
| `AI_SERVICE_URL` | Optional | `http://localhost:8000` | URL of Python AI microservice |
| `ENABLE_AI_SCHEDULER` | Optional | `true` | Run background AI jobs (demand forecast, etc.) |

**Generate a Strong JWT Secret:**
```bash
# Run on EC2 or local machine
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855...
```

### Frontend Environment Variables

These are used at **build time** by Vite. They're baked into the JavaScript bundle.

| Variable | Development | Production | Description |
|----------|------------|------------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | `https://api.parth10.me` | Base URL for all API calls |

**How Vite Uses These:**
```javascript
// In React code:
const apiUrl = import.meta.env.VITE_API_URL;
// Compiles to:
const apiUrl = "https://api.parth10.me";  // Hardcoded in the bundle
```

> [!IMPORTANT]
> Vite environment variables are resolved at **build time**, not runtime. If you change `VITE_API_URL`, you must rebuild the application with `npm run build` and re-upload to S3. The running server on EC2 cannot see Vite environment variables.

**Managing Multiple Environments:**

```
restaurant-pos-frontend/
|-- .env                   # Shared defaults
|-- .env.local             # Local overrides (git-ignored)
|-- .env.development       # Auto-loaded in: npm run dev
|-- .env.production        # Auto-loaded in: npm run build
|-- .env.production.local  # Local production overrides (git-ignored)
```

---

## 16. Final Architecture Summary

### Complete System Architecture

```mermaid
flowchart TD
    subgraph Users["End Users"]
        Admin["Admin\nBrowser"]
        Cashier["Cashier\nBrowser"]
        Kitchen["Kitchen\nDisplay"]
    end

    subgraph DNS["DNS — Namecheap"]
        FE_DNS["rasodu.parth10.me\nCNAME → CloudFront"]
        BE_DNS["api.parth10.me\nCNAME → ALB DNS"]
    end

    subgraph Frontend["Frontend — Static (Global)"]
        CF["CloudFront\nHTTPS + Cache\nACM *.parth10.me (us-east-1)\n400+ Edge Locations"]
        S3["S3 Bucket\nrasodu-pos-frontend\nReact Build Files"]
        CF --> S3
    end

    subgraph AWS_Mumbai["AWS ap-south-1 (Mumbai)"]
        subgraph VPC_Box["VPC 172.31.0.0/16"]
            ALB["Application Load Balancer\nrestaurant-pos-alb\nPort 80 → 301 Redirect\nPort 443 → Forward\nACM *.parth10.me (ap-south-1)\nSG: restaurant-pos-alb-sg"]

            TG["Target Group\nrestaurant-pos-tg\nHTTP:3000\nHealth: /api/health"]

            subgraph EC2_Node["EC2 — Amazon Linux 2023"]
                PM2_Proc["PM2 Process Manager\nAuto-restart\nStartup on boot"]
                Express_App["Express.js App\nPort 3000\nPrisma ORM\nSocket.IO\nJWT Auth"]
                PM2_Proc --> Express_App
            end

            ALB --> TG --> EC2_Node
        end
    end

    Neon["Neon PostgreSQL\nServerless\nSSL Required\n26 Prisma Models"]

    Users -->|"Page load"| CF
    Users -->|"API calls"| ALB
    Express_App --> Neon
```

### Port Reference

| Connection | From | To | Protocol | Port | Notes |
|-----------|------|----|----------|------|-------|
| User → CloudFront | Browser | CloudFront | HTTPS | 443 | Custom domain via Namecheap CNAME |
| CloudFront → S3 | CloudFront | S3 | HTTP/S | 80/443 | S3 website endpoint |
| User → ALB | Browser | ALB | HTTPS | 443 | Custom domain via Namecheap CNAME |
| ALB → EC2 | ALB | EC2 | HTTP | 3000 | TLS terminated at ALB |
| EC2 → Neon | EC2 | Neon Cloud | PostgreSQL+SSL | 5432 | Outbound via IGW |
| You → EC2 | Your machine | EC2 | SSH | 22 | Restricted to your IP |

### Security Layers

```
Layer 1: DNS → Namecheap routes rasodu.parth10.me and api.parth10.me correctly
Layer 2: TLS → All traffic encrypted HTTPS (CloudFront and ALB)
Layer 3: ACM → Certificates managed and auto-renewed
Layer 4: CloudFront → S3 bucket stays private (no public access)
Layer 5: ALB → EC2 port 3000 never exposed to internet
Layer 6: Security Groups → ALB-SG reference ensures only ALB reaches EC2:3000
Layer 7: JWT → All API routes authenticated with signed tokens
Layer 8: RBAC → Admin/Cashier/Kitchen role enforcement in Express middleware
Layer 9: Prisma → Parameterized queries prevent SQL injection
```

---

## 17. Troubleshooting

This section documents every issue encountered during the actual deployment of Rasodu POS, with root cause analysis and solutions.

---

### 17.1 Mixed Content Error

**Error Message:**
```
Mixed Content: The page at 'https://rasodu.parth10.me' was loaded over HTTPS,
but requested an insecure resource 'http://13.206.250.23:3000/api/auth/login'.
This request has been blocked; the content must be served over HTTPS.
```

**Cause:**

The React frontend was built with a `VITE_API_URL` pointing to an HTTP URL (`http://localhost:3000` or `http://EC2_IP:3000`). Since the frontend itself is served over HTTPS (via CloudFront), browsers block API calls to HTTP endpoints as a security measure.

This is a **browser security feature** called **Mixed Content Protection**:
- A page served over HTTPS must only make HTTPS requests
- HTTP requests from an HTTPS page are blocked to prevent downgrade attacks

**Root Cause — Build Configuration:**

```bash
# Wrong: Built with local/HTTP API URL
VITE_API_URL=http://localhost:3000  # Local development URL in production build!
# OR
VITE_API_URL=http://13.206.250.23:3000  # EC2 IP directly over HTTP
```

**Solution:**

1. Ensure the ALB is configured and `api.parth10.me` resolves to it

2. Update production environment:
   ```bash
   # restaurant-pos-frontend/.env.production
   VITE_API_URL=https://api.parth10.me
   ```

3. Rebuild the React app:
   ```bash
   npm run build
   ```

4. Verify the correct URL is in the bundle:
   ```bash
   grep -r "api.parth10.me" dist/assets/*.js
   # Should find: "https://api.parth10.me" in the bundle
   ```

5. Re-upload to S3 and invalidate CloudFront:
   ```bash
   aws s3 sync ./dist s3://rasodu-pos-frontend --delete
   aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
   ```

**Prevention:**
- Always use `.env.production` for production builds
- Add a check in your deployment script: `grep "https://api" dist/assets/*.js || exit 1`

---

### 17.2 Target Group Unhealthy

**Symptom:**

AWS Console shows instances as "Unhealthy" in the Target Group. ALB returns `502 Bad Gateway` or `503 Service Unavailable` to clients.

**Systematic Diagnosis:**

```
Step 1: Is the application process running?
    SSH into EC2 → run: pm2 status
    Expected: rasodu-backend | online
    If "errored" or missing → see fix below

Step 2: Is the app responding on port 3000?
    curl -v http://localhost:3000/api/health
    Expected: HTTP/1.1 200 OK with JSON body
    If "Connection refused" → app not running or wrong port
    If 404 → health route not implemented correctly

Step 3: Is port 3000 actually open?
    sudo ss -tlnp | grep 3000
    Expected: LISTEN 0.0.0.0:3000
    If nothing → app not listening

Step 4: Is the Security Group correct?
    EC2 Console → Security Groups → launch-wizard-1 → Inbound Rules
    Expected: TCP 3000 from sg-xxxx (restaurant-pos-alb-sg)
    If 0.0.0.0/0 → Fine but insecure
    If missing completely → ALB BLOCKED — add the rule

Step 5: Is the Health Check configured correctly in the Target Group?
    EC2 → Target Groups → restaurant-pos-tg → Health checks tab
    Check: Path = /api/health, Port = Traffic port (3000), Protocol = HTTP

Step 6: Any application errors?
    pm2 logs rasodu-backend --lines 100
    Look for: Database connection errors, module not found, port in use
```

**Fix: Application Not Running:**
```bash
# Check what happened
pm2 logs rasodu-backend --err --lines 50

# Common fixes:
# 1. Missing .env file
nano .env  # Add DATABASE_URL, JWT_SECRET, PORT=3000

# 2. Prisma client not generated
npx prisma generate

# 3. Restart after fixing
pm2 restart rasodu-backend
pm2 status  # Verify online
```

---

### 17.3 ERR_CONNECTION_TIMED_OUT in Chrome

**Symptom:**
- `https://api.parth10.me` shows `ERR_CONNECTION_TIMED_OUT` in Google Chrome
- The same URL loads correctly in Microsoft Edge or Firefox
- Or works after clearing browser data

**Cause:**

This is a **Chrome-specific browser caching/networking issue**, not an infrastructure problem. Possible causes:

1. Chrome cached a stale DNS response pointing to an old IP
2. Chrome's HSTS (HTTP Strict Transport Security) database has a conflicting entry
3. Chrome's internal socket pool has a stuck connection
4. Chrome's DNS-over-HTTPS (DoH) is returning a different address than system DNS

**Solutions:**

1. **Flush Chrome DNS cache:**
   - Type in address bar: `chrome://net-internals/#dns`
   - Click "Clear host cache"

2. **Flush Chrome socket pool:**
   - Type: `chrome://net-internals/#sockets`
   - Click "Flush socket pools"

3. **Flush OS DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches
   ```

4. **Test in Chrome Incognito mode** (`Ctrl+Shift+N`) — bypasses most caches

5. **Check with other tools to confirm infrastructure is working:**
   ```bash
   curl -v https://api.parth10.me/api/health
   # If this works, infrastructure is fine — Chrome issue only
   ```

> [!NOTE]
> If `curl` and Edge work but Chrome doesn't, this is definitely a Chrome browser issue. The infrastructure is correctly configured. Proceed with cache clearing steps above.

---

### 17.4 Certificate Warning on ALB DNS

**Symptom:**

Accessing `https://restaurant-pos-alb-xxxx.ap-south-1.elb.amazonaws.com` directly in browser shows:
```
Your connection is not private
NET::ERR_CERT_COMMON_NAME_INVALID
```

**Cause:**

The TLS certificate on the ALB is issued for `*.parth10.me`. The ALB's own DNS name (`.elb.amazonaws.com`) does not match the certificate domain. The browser correctly rejects this mismatch.

**This is EXPECTED and CORRECT.**

The ALB's certificate is meant to be used when accessed through `api.parth10.me`, not through the ALB's own hostname.

```
Certificate covers: *.parth10.me
ALB DNS name:       restaurant-pos-alb-xxxx.ap-south-1.elb.amazonaws.com
                    ^
                    Does NOT match *.parth10.me → browser warning
```

**Solution:**

Always access the backend through the custom domain: `https://api.parth10.me`

Never use the `.elb.amazonaws.com` URL for production access.

**Use the ALB DNS only for DNS CNAME setup** (in Namecheap) — never for direct browser access.

---

### 17.5 Port 0 Mistake in Security Group

**Symptom:**

- Health checks consistently timeout
- Target Group instances remain "Initial" for a very long time then go "Unhealthy"
- SSH to EC2 works, app is running, but ALB cannot reach it
- `curl http://localhost:3000/api/health` on EC2 returns 200

**Cause:**

When adding the Custom TCP rule for port 3000 in the EC2 Security Group, the port was accidentally entered as `0` instead of `3000`. AWS allows port 0, but it doesn't match port 3000 traffic.

```
Intended rule:   Custom TCP | Port: 3000 | Source: restaurant-pos-alb-sg
Actual rule:     Custom TCP | Port: 0    | Source: restaurant-pos-alb-sg

ALB sends traffic to port 3000
Security Group only allows traffic to port 0
→ Port 3000 traffic is BLOCKED → Health checks timeout
```

**Solution:**

1. Go to **EC2 → Security Groups → launch-wizard-1 (EC2 SG)**
2. Select **Inbound Rules** tab
3. Click **Edit Inbound Rules**
4. Find the Custom TCP rule with the ALB SG as source
5. Change port from `0` to `3000`
6. Click **Save Rules**

**Verify Fix:**

After fixing, wait 60-90 seconds and check the Target Group. Instances should transition from "Initial"/"Unhealthy" to "Healthy" within 2.5 minutes (5 health checks × 30 second interval).

> [!CAUTION]
> Always verify Security Group port numbers visually before saving. The AWS Console accepts port 0 without any warning, even though it's almost certainly a mistake.

---

### 17.6 Health Check Timeout

**Symptom:**

Target Group health check status shows "Timeout" in the health check history. Instances are "Unhealthy."

**Cause Tree:**

```
Health Check Timeout
|
+-- Application not running
|   Check: pm2 status → if errored: fix app, pm2 restart
|
+-- Wrong Security Group rule
|   Check: EC2 SG → Inbound → port 3000 from ALB SG?
|   If missing or wrong port: add correct rule
|
+-- Wrong Health Check port in Target Group
|   Check: Target Group → Health Checks → Port = "Traffic Port"
|   If set to wrong port: edit and set to Traffic Port
|
+-- Application on wrong port
|   Check: PORT env var in .env, curl http://localhost:3000
|   Try different ports: curl http://localhost:3001
|
+-- /api/health route not implemented or returning 500
|   Check: curl -v http://localhost:3000/api/health
|   Verify response: HTTP 200
|
+-- Database connection failure on startup
|   Check: pm2 logs rasodu-backend --lines 50
|   Look for: "Failed to connect to database"
|   Fix: verify DATABASE_URL in .env
|
+-- Prisma client not generated
|   Check: pm2 logs rasodu-backend --lines 20
|   Look for: "PrismaClientInitializationError" or module error
|   Fix: npx prisma generate → pm2 restart rasodu-backend
|
+-- PM2 startup config missing
|   Symptom: App not running after EC2 reboot
|   Fix: pm2 startup (run output command) → pm2 save
```

**Complete Health Check Diagnostic:**

```bash
# 1. SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# 2. Check PM2
pm2 status
# Expected: online

# 3. Test health endpoint
curl -v http://localhost:3000/api/health
# Expected: HTTP/1.1 200 OK

# 4. Check port binding
sudo ss -tlnp | grep 3000
# Expected: LISTEN 0.0.0.0:3000

# 5. Check logs for errors
pm2 logs rasodu-backend --lines 50

# 6. Check environment variables
cat .env  # Verify DATABASE_URL, PORT=3000, JWT_SECRET set

# 7. Check Prisma client
ls node_modules/.prisma/client/
# Expected: index.js and other generated files
```

---

## 18. Resource Cleanup — Deletion Order

When decommissioning the infrastructure, delete resources in dependency order. AWS prevents deleting a resource if other resources depend on it.

> [!CAUTION]
> Resource deletion is **permanent and irreversible**. Always:
> 1. Take database backups from Neon dashboard before deleting
> 2. Download any important files from S3
> 3. Confirm you have the codebase in Git before terminating EC2

### Deletion Flowchart

```mermaid
flowchart TD
    A["1. Disable CloudFront Distribution\n(Wait 5 min for propagation)"]
    B["2. Delete CloudFront Distribution"]
    C["3. Empty S3 Bucket\n(aws s3 rm s3://bucket --recursive)"]
    D["4. Delete S3 Bucket"]
    E["5. Delete ALB\n(restaurant-pos-alb)"]
    F["6. Deregister EC2 from Target Group"]
    G["7. Delete Target Group\n(restaurant-pos-tg)"]
    H["8. Terminate EC2 Instance\n(Wait for terminated state)"]
    I["9. Delete EC2 Security Group\n(launch-wizard-1)"]
    J["10. Delete ALB Security Group\n(restaurant-pos-alb-sg)"]
    K["11. Delete ACM Certificate (ap-south-1)\n(Must not be in use by any ALB)"]
    L["12. Delete ACM Certificate (us-east-1)\n(Must not be in use by CloudFront)"]
    M["13. Remove DNS Records\n(Namecheap — CNAME records)"]

    A --> B --> C --> D
    E --> F --> G --> H --> I --> J
    B --> E
    D --> K
    B --> L
    J --> M
```

### Step-by-Step Commands

**1-2. Delete CloudFront:**
```bash
# Get distribution ID
aws cloudfront list-distributions --query 'DistributionList.Items[].{Id:Id,Domain:DomainName}' --output table

# Disable the distribution first (required before deletion)
# AWS Console: CloudFront → Distributions → Select → Disable
# Wait 3-5 minutes for "Disabled" state

# Then delete
aws cloudfront delete-distribution --id DISTRIBUTION_ID --if-match ETAG
# (ETag found in: aws cloudfront get-distribution-config --id DISTRIBUTION_ID)
```

**3-4. Empty and Delete S3:**
```bash
# Remove all objects
aws s3 rm s3://rasodu-pos-frontend --recursive

# Delete the bucket
aws s3 rb s3://rasodu-pos-frontend
```

**5. Delete ALB:**
```bash
# Get ALB ARN
aws elbv2 describe-load-balancers --names restaurant-pos-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn ALB_ARN
```

**6-7. Delete Target Group:**
```bash
# Get Target Group ARN
aws elbv2 describe-target-groups --names restaurant-pos-tg \
  --query 'TargetGroups[0].TargetGroupArn' --output text

# Delete Target Group (ALB must already be deleted)
aws elbv2 delete-target-group --target-group-arn TG_ARN
```

**8. Terminate EC2:**
```bash
# List instances
aws ec2 describe-instances \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Terminate
aws ec2 terminate-instances --instance-ids i-XXXXXXXXXXXXXXXXX
```

**9-10. Delete Security Groups:**
```bash
# Delete EC2 SG first (it references ALB SG)
aws ec2 delete-security-group --group-name launch-wizard-1

# Then delete ALB SG
aws ec2 delete-security-group --group-name restaurant-pos-alb-sg
```

**11-12. Delete ACM Certificates:**
```bash
# List certificates in ap-south-1
aws acm list-certificates --region ap-south-1 \
  --query 'CertificateSummaryList[].{Domain:DomainName,ARN:CertificateArn}'

# Delete (must not be in use)
aws acm delete-certificate --certificate-arn ARN --region ap-south-1
aws acm delete-certificate --certificate-arn ARN --region us-east-1
```

**13. Remove Namecheap DNS Records:**
1. Log in to Namecheap → Advanced DNS for `parth10.me`
2. Delete CNAME records for: `rasodu`, `api`, `_acme12345678`

---

## 19. Best Practices Summary

### Security Best Practices

| Practice | What We Did | Why Important |
|---------|-------------|--------------|
| Never expose app port publicly | EC2 port 3000 restricted to ALB SG | Prevents direct server access |
| HTTPS everywhere | HTTP redirected to HTTPS (301) at ALB | Data encryption in transit |
| Minimal SSH access | Port 22 only from specific IP | Reduces attack surface |
| Managed certificates | ACM auto-renews certificates | No expired cert outages |
| Security Group referencing | ALB SG used as source, not IP | Works with dynamic ALB IPs |
| Strong JWT secret | 64+ char random string | Prevents token forgery |
| Never commit `.env` | In `.gitignore` | Protects credentials |
| Prisma parameterized queries | Used by default | Prevents SQL injection |
| SSL on database | `?sslmode=require` | Encrypts data in transit |

### Operational Best Practices

| Practice | What We Did | Why Important |
|---------|-------------|--------------|
| Process management | PM2 with startup + save | App survives crashes and reboots |
| Health endpoint | `/api/health` returns 200 | ALB can verify app health |
| Graceful shutdown | SIGTERM/SIGINT handlers | Clean connection closing |
| Log management | PM2 log capture | Debug without SSH for every issue |
| Content hashing | Vite generates hashed filenames | Safe long-term browser caching |
| CDN invalidation | After every deploy | Users get latest version |
| Deployment scripts | Shell script for frontend | Repeatable, less error-prone |

### CloudFront Best Practices

| Practice | Recommendation |
|---------|---------------|
| Cache TTL | `index.html`: no-cache; `assets/*`: 365 days (immutable) |
| HTTPS | Always redirect HTTP to HTTPS |
| Default root object | Set to `index.html` |
| Custom error responses | 403/404 → 200 + `index.html` (for React Router) |
| Price class | Choose based on user geography vs. cost |
| Compression | Enable automatic Gzip/Brotli compression |
| Security headers | Add `Strict-Transport-Security`, `X-Content-Type-Options` via CloudFront Functions |

### Cost Optimization

| Resource | Free Tier | Paid Tier | Optimization |
|---------|-----------|-----------|-------------|
| EC2 | 750 hrs/month t2.micro | ~$15/mo t3.small | Reserved Instances for 40-60% savings |
| S3 | 5 GB storage, 20K GET | < $0.10/month | Minimal cost for static files |
| CloudFront | 1 TB data transfer | Per-GB pricing | Enable compression, optimize cache |
| ALB | 750 hrs/month (free tier) | ~$18/mo + LCU | One ALB can serve multiple services |
| ACM | Free for AWS services | Free | No optimization needed |
| Neon | Generous free tier | Usage-based | Serverless — no idle costs |

### Development vs Production Differences

| Aspect | Development | Production |
|--------|------------|------------|
| `VITE_API_URL` | `http://localhost:3000` | `https://api.parth10.me` |
| `NODE_ENV` | `development` | `production` |
| Error messages | Stack traces visible | Generic messages only |
| ALB | Not used | Required for HTTPS + health |
| PM2 | `npm run dev` (nodemon) | PM2 with startup config |
| SSL | Not configured | ACM on ALB + CloudFront |

---

## 20. Glossary

| Term | Definition |
|------|-----------|
| **ACM** | AWS Certificate Manager — managed SSL/TLS certificates |
| **ALB** | Application Load Balancer — Layer 7 load balancer (HTTP/HTTPS) |
| **AZ** | Availability Zone — physically isolated data center within a region |
| **Certificate Authority (CA)** | Trusted organization that signs and validates TLS certificates |
| **CIDR** | Classless Inter-Domain Routing — IP address range notation (e.g., `172.31.0.0/16`) |
| **CDN** | Content Delivery Network — global distributed cache (CloudFront) |
| **CNAME** | Canonical Name — DNS record mapping one domain to another |
| **DNS** | Domain Name System — translates domain names to IP addresses |
| **EC2** | Elastic Compute Cloud — AWS virtual machines |
| **IGW** | Internet Gateway — allows VPC resources to reach the internet |
| **IAM** | Identity and Access Management — AWS permissions and access control |
| **JWT** | JSON Web Token — stateless authentication token format |
| **Mixed Content** | HTTP resources requested from HTTPS page (blocked by browsers) |
| **NVM** | Node Version Manager — tool for managing Node.js versions |
| **OAC** | Origin Access Control — secure CloudFront-to-S3 authentication |
| **ORM** | Object-Relational Mapper — Prisma maps JS objects to DB tables |
| **PM2** | Process Manager 2 — Node.js production process manager |
| **Private Key** | Secret cryptographic key used for TLS decryption |
| **Public Key** | Shareable cryptographic key included in TLS certificate |
| **RBAC** | Role-Based Access Control — permission system based on user roles |
| **S3** | Simple Storage Service — AWS object/file storage |
| **Security Group** | Virtual stateful firewall for AWS resources |
| **SG Reference** | Using a Security Group ID as the source/destination in SG rules |
| **SPA** | Single Page Application — React app handling routing client-side |
| **SSL** | Secure Sockets Layer — predecessor to TLS (term still commonly used) |
| **TLS** | Transport Layer Security — encryption protocol for HTTPS |
| **TLS Handshake** | Protocol to establish shared keys before encrypted communication |
| **TLS Termination** | Decrypting HTTPS at the ALB, forwarding plain HTTP to EC2 |
| **TTL** | Time To Live — duration a DNS or cache entry is valid |
| **VPC** | Virtual Private Cloud — isolated virtual network in AWS |
| **WebSocket** | Full-duplex persistent connection (used by Socket.IO) |
| **Wildcard Certificate** | Certificate covering `*.domain.com` — all single-level subdomains |

---

## Appendix A: Quick Reference Card

### Live Production URLs

| Resource | URL |
|---------|-----|
| Frontend Application | https://rasodu.parth10.me |
| Backend API Root | https://api.parth10.me |
| Backend Health Check | https://api.parth10.me/api/health |

### AWS Resource Inventory

| Resource Type | Name | Region |
|--------------|------|--------|
| EC2 Instance | `rasodu-pos-backend` | ap-south-1 |
| ALB | `restaurant-pos-alb` | ap-south-1 |
| Target Group | `restaurant-pos-tg` | ap-south-1 |
| ALB Security Group | `restaurant-pos-alb-sg` | ap-south-1 |
| EC2 Security Group | `launch-wizard-1` | ap-south-1 |
| S3 Bucket | `rasodu-pos-frontend` | ap-south-1 |
| CloudFront Distribution | *(see console for ID)* | Global |
| ACM Certificate (ALB) | `*.parth10.me` | ap-south-1 |
| ACM Certificate (CF) | `*.parth10.me` | us-east-1 |

### Port Reference

| Port | Protocol | Service | Accessible From |
|------|----------|---------|----------------|
| 22 | SSH | EC2 SSH | Your IP only |
| 80 | HTTP | ALB | Internet (redirects → HTTPS 443) |
| 443 | HTTPS | ALB / CloudFront | Internet |
| 3000 | HTTP | Express.js | ALB only (SG reference) |
| 5432 | PostgreSQL | Neon Database | EC2 (outbound) |

### DNS Records Summary (Namecheap)

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `rasodu` | CNAME | CloudFront domain | Frontend custom domain |
| `api` | CNAME | ALB DNS name | Backend custom domain |
| `_acme12345678` | CNAME | ACM validation value | Certificate validation |

### PM2 Quick Reference

```bash
pm2 status                              # Check process status
pm2 logs rasodu-backend                 # Stream logs
pm2 logs rasodu-backend --lines 100     # Last 100 log lines
pm2 restart rasodu-backend              # Restart application
pm2 save                                # Save process list
pm2 startup                             # Configure startup script
curl http://localhost:3000/api/health   # Test health locally
```

### Frontend Deploy Checklist

```bash
# 1. Set production API URL
echo "VITE_API_URL=https://api.parth10.me" > restaurant-pos-frontend/.env.production

# 2. Build
cd restaurant-pos-frontend && npm run build

# 3. Verify API URL in bundle
grep -r "api.parth10.me" dist/assets/*.js

# 4. Upload to S3
aws s3 sync ./dist s3://rasodu-pos-frontend --delete

# 5. Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Backend Deploy Checklist (on EC2)

```bash
# 1. Pull latest code
cd /home/ec2-user/YOUR_REPO/restaurant-pos-backend
git pull origin main

# 2. Install dependencies
npm install

# 3. Regenerate Prisma client
npx prisma generate

# 4. Apply schema changes (if any)
npx prisma db push

# 5. Restart application
pm2 restart rasodu-backend

# 6. Verify
pm2 status
curl http://localhost:3000/api/health
```

---

*End of Rasodu POS — AWS Deployment Guide*

---

*Document Version: 1.0*
*Project: Rasodu POS*
*Author: Engineering Team*
*Last Updated: July 2026*
*Infrastructure Region: ap-south-1 (Mumbai)*
