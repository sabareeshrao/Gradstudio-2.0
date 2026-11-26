# AWS Syllabus — Idea-Based Learning

10 phases · 59 lessons · 409 subtopic nodes

Problem → limitation → engineering idea → AWS implementation → transferable application.

Based on the supplied [AWS roadmap](https://roadmap.sh/aws) screenshots and agreed additions. This is the planned syllabus, not a completed lesson library. Core comes first; specializations are optional. Legacy nodes are retained and marked.

## 01. Cloud foundations (Core)

### Cloud Computing

- Physical servers
- capacity planning
- on-demand resources
- elasticity
- pay-as-you-go
- IaaS vs PaaS vs SaaS
- public vs private vs hybrid cloud

### Introduction to AWS

- AWS service categories
- console, CLI and SDK
- AWS accounts
- AWS global infrastructure
  - Regions
  - Availability Zones
  - edge locations
- shared responsibility model
- Well-Architected Framework
  - operational excellence
  - security
  - reliability
  - performance efficiency
  - cost optimization
  - sustainability

### Virtualization

- Physical hosts
- hypervisors
- virtual machines
- resource isolation
- images
- containers vs VMs


## 02. Essential services (Core)

### IAM

- Users and user groups
- policies
  - identity-based policies
  - resource-based policies
- roles
  - instance profiles
  - assuming roles
- MFA
- STS and temporary credentials
- least privilege
- permission evaluation

### VPC

- CIDR blocks
- subnets
  - private subnet
  - public subnet
- route tables
- security groups
- network ACLs
- internet gateway
- NAT gateway
- VPC endpoints
- VPC peering
- Transit Gateway
- VPC Flow Logs

### EC2

- Instance types
- CPU credits
- storage and volumes
- key pairs
- Elastic IP
- user data scripts
- purchasing options
  - On-Demand
  - Spot
  - Reserved Instances
  - Savings Plans
- Nitro
- instance metadata and IMDSv2

### EC2 Auto Scaling

- AMIs
- launch templates
- Auto Scaling groups
- scaling policies
- Elastic Load Balancers
  - ALB
  - NLB
- health checks
- replacement and elasticity


## 03. Storage and delivery (Core)

### S3 — [existing idea lesson](../content/simulations/sim-aws-s3-idea-driven/index.html)

- Buckets and objects
- keys and prefixes
- bucket and object lifecycle
- storage classes
  - Standard
  - Standard-IA
  - One Zone-IA
  - Intelligent-Tiering
  - Glacier storage classes
- versioning
- replication
- presigned URLs
- multipart uploads
- consistency
- durability and availability
- encryption
- Object Lock
- event notifications

### EBS

- Block storage
- volume attachment
- volume types
  - gp3
  - io2
  - st1
  - sc1
- snapshots
- IOPS and throughput
- encryption
- Availability Zone scope

### EFS

- Shared file storage
- NFS
- mount targets
- access points
- throughput and performance
- storage classes
- lifecycle

### AWS Storage Gateway

- Hybrid storage
- file gateway
- volume gateway
- tape gateway
- local cache

### AWS Backup

- Backup plans
- vaults
- retention
- recovery points
- cross-account and cross-Region copies
- restore testing

### SES

- Sandbox and sending limits
- identity verification
- DKIM setup
- feedback handling
- configuration sets
- sender reputation
- dedicated IP
- SPF and DMARC

### Route 53

- Hosted zones
- DNS records
- routing policies
- health checks
- domain registration
- private DNS

### CloudFront

- Distributions
- origins
- cache behaviors and policies
- invalidations
- edge locations
- origin access control
- signed URLs and cookies


## 04. Observability and databases (Core)

### CloudWatch

- Metrics
- events (now EventBridge for event routing)
- logs
- alarms
- dashboards
- log insights
- custom metrics

### RDS

- DB instances
- engines
- storage types
  - General Purpose SSD
  - Provisioned IOPS SSD
  - Magnetic (legacy)
- backup and restore
- Multi-AZ
- read replicas
- connection pooling
- RDS Proxy

### Aurora

- Distributed storage
- writer and reader instances
- replication
- failover
- Aurora Serverless
- global databases

### DynamoDB

- Tables, items and attributes
- primary keys and secondary indexes
- data modeling
- streams
- capacity settings
  - on-demand
  - provisioned
- limits
- backup and restore
- DynamoDB Local
- TTL
- conditional writes

### ElastiCache

- Redis OSS and Valkey
- Memcached
- quotas
- cache-aside
- TTL
- eviction
- replication
- clustering

### OpenSearch

- Indexes
- shards and replicas
- full-text search
- vector search
- ingestion
- managed domains and serverless


## 05. Containers and serverless (Core)

### ECR

- Container images
- repositories
- tags and digests
- image scanning
- lifecycle policies
- authentication

### ECS

- Clusters and ECS container agents
- task definitions
- tasks
- services
- launch configuration and Auto Scaling groups (legacy launch configurations)
- capacity providers
- service discovery
- load balancing

### EKS

- Kubernetes control plane
- worker nodes
- node groups
- pods
- services
- pod networking
- IAM integration
- autoscaling

### Lambda

- Creating and invoking functions
- layers
- custom runtimes
- versioning and aliases
- EventBridge and scheduled execution
- cold starts and limitations
- API Gateway
- Lambda@Edge
- concurrency
- retries
- execution environments
- event source mappings

### Fargate

- Serverless container compute
- ECS and EKS integration
- task/pod resource sizing
- networking
- pricing and scaling

### Elastic Beanstalk

- Application versions
- environments
- managed platforms
- deployment policies
- health
- underlying infrastructure

### API Gateway

- REST and HTTP APIs
- routes
- integrations
- authentication
- throttling
- stages
- Lambda integration


## 06. Distributed application architecture (Core)

### SQS

- Standard and FIFO queues
- producers and consumers
- visibility timeout
- long polling
- dead-letter queues
- deduplication
- retries

### SNS

- Topics
- subscriptions
- fan-out
- message filtering
- delivery retries
- SNS to SQS

### EventBridge

- Event buses
- rules
- event patterns
- targets
- Scheduler
- archive and replay

### Step Functions

- State machines
- tasks
- choice and parallel states
- retries and catches
- Standard and Express workflows

### Kinesis Data Streams

- Streams
- shards
- partition keys
- producers
- consumers
- retention
- throughput modes


## 07. Infrastructure and production engineering (Core)

### CloudFormation

- Templates
- stacks
- parameters
- outputs
- dependencies
- change sets
- drift
- rollback

### CloudTrail

- Management and data events
- trails
- event history
- audit logging
- CloudTrail Lake

### KMS

- Keys
- envelope encryption
- key policies
- grants
- rotation
- integration with storage

### Secrets Manager

- Secrets
- rotation
- IAM access
- application retrieval
- difference from Parameter Store

### WAF

- Web ACLs
- rules
- managed rule groups
- rate-based rules
- logging
- CloudFront and ALB integration

### Cost Explorer

- Cost and usage reports
- filters and grouping
- forecasts
- cost allocation tags
- rightsizing

### AWS Budgets

- Cost and usage budgets
- alerts
- budget actions
- thresholds
- billing safeguards

### Production architecture

- High availability
- disaster recovery
- RTO and RPO
- backups and restores
- secure networking
- least privilege
- observability
- cost and capacity trade-offs
- end-to-end application deployment


## 08. AWS for AI engineering (Specialization)

### Bedrock

- Foundation models
- model invocation
- embeddings
- knowledge bases and RAG
- agents
- guardrails
- evaluation

### SageMaker AI

- Training jobs
- data preparation
- model registry
- endpoints
- inference
- monitoring

### Textract

- OCR
- document analysis
- tables and forms
- extraction workflows

### Transcribe

- Speech-to-text
- batch and streaming
- vocabulary
- speaker identification

### Polly

- Text-to-speech
- voices
- SSML
- audio output

### Rekognition

- Image and video analysis
- labels
- moderation
- privacy and responsible use


## 09. AWS for data engineering (Specialization)

### Glue

- Data Catalog
- crawlers
- ETL jobs
- schema evolution
- job orchestration

### Athena

- SQL on S3
- partitions
- columnar formats
- workgroups
- cost per query

### Redshift

- Data warehouse
- columnar storage
- distribution and sort keys
- serverless
- Spectrum

### EMR

- Distributed data processing
- Spark
- clusters
- serverless
- data lake integration

### Kinesis (data engineering)

- Streaming ingestion
- partitioning
- consumers
- delivery to data lakes
- processing and replay

### Lake Formation

- Data lake permissions
- catalog integration
- fine-grained access
- governance


## 10. AWS for DevOps engineering (Specialization)

### CodeBuild

- Build projects
- buildspec
- build environments
- artifacts
- caching

### CodePipeline

- Source, build, test and deploy stages
- artifacts
- approvals
- pipeline triggers

### CodeDeploy

- Deployment groups
- in-place and blue-green deployments
- rollback

### CDK

- Infrastructure constructs
- stacks
- synthesis
- CloudFormation deployment

### Systems Manager

- Fleet management
- Session Manager
- Run Command
- Patch Manager
- Parameter Store

### X-Ray

- Distributed traces
- segments
- service maps
- sampling
- latency diagnosis
- OpenTelemetry integration

