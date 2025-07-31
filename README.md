# Self-Healing Kubernetes Platform with Chaos Engineering

A comprehensive demonstration of resilience engineering, observability, and production-ready thinking for SRE and platform teams.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
│                    Dashboard & Monitoring                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                             │
│              Circuit Breakers & Rate Limiting              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Microservices Architecture                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ User Service│  │Order Service│  │Notification │      │
│  │  (Node.js)  │  │  (Node.js)  │  │  Service    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ PostgreSQL  │  │    Redis    │  │   EKS       │      │
│  │  Database   │  │   Cache     │  │  Cluster    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Observability Stack                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Prometheus  │  │   Grafana   │  │AlertManager │      │
│  │  Metrics    │  │  Dashboards │  │   Alerts    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Chaos Engineering                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ LitmusChaos │  │   Pod Kill  │  │   Network   │      │
│  │ Experiments │  │   Chaos     │  │   Chaos     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              GitOps with ArgoCD                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Application │  │  Repository │  │ Notification│      │
│  │ Controller  │  │   Server    │  │   Service   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Local Development Setup

### Prerequisites

Before running this project, ensure you have the following tools installed:

#### Required Tools
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **kubectl** - [Installation guide](https://kubernetes.io/docs/tasks/tools/)
- **Helm** - [Installation guide](https://helm.sh/docs/intro/install/)
- **kind** (Kubernetes in Docker) - [Installation guide](https://kind.sigs.k8s.io/docs/user/quick-start/)

#### Installation Commands

**macOS (using Homebrew):**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install kubectl
brew install helm
brew install kind
```

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm

# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

**Windows:**
```bash
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required tools
choco install kubernetes-cli
choco install kubernetes-helm
choco install kind
```

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/chaos-engineering-platform.git
cd chaos-engineering-platform
```

#### 2. Start Docker Desktop
Ensure Docker Desktop is running before proceeding.

#### 3. Create Local Kubernetes Cluster
```bash
# Create a local Kubernetes cluster using kind
kind create cluster --name chaos-platform --config kubernetes/local/local-cluster.yaml

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

#### 4. Deploy the Platform
```bash
# Run the automated setup script
./setup.sh

# Or deploy manually:
# Create namespaces
kubectl create namespace chaos-platform
kubectl create namespace monitoring
kubectl create namespace chaos-engineering
kubectl create namespace gitops

# Deploy base resources
kubectl apply -f kubernetes/base/

# Deploy monitoring stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Deploy applications
kubectl apply -f kubernetes/applications/

# Deploy autoscaling
kubectl apply -f kubernetes/autoscaling/

# Deploy GitOps
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argocd -n gitops -f kubernetes/gitops/argocd-values.yaml
```

#### 5. Access the Dashboards
```bash
# Start port forwarding for all services
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring &
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/status-dashboard 3001:80 -n chaos-platform &
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443 &
```

#### 6. Access URLs
Once port forwarding is active, access the following URLs:

- **Custom Dashboard**: http://localhost:3001 (Tron-themed monitoring dashboard)
- **Grafana**: http://localhost:3000 (Username: `admin`, Password: `prom-operator`)
- **Prometheus**: http://localhost:9090
- **Kubernetes Dashboard**: https://localhost:8443

### Verification Steps

#### Check Cluster Status
```bash
# Verify all pods are running
kubectl get pods --all-namespaces

# Check services
kubectl get services --all-namespaces

# Verify deployments
kubectl get deployments --all-namespaces
```

#### Test Applications
```bash
# Test sample applications
curl http://localhost:30000  # Frontend
curl http://localhost:30001  # API Gateway
curl http://localhost:30002  # User Service
```

#### Monitor Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query basic metrics
curl "http://localhost:9090/api/v1/query?query=up"
```

### Troubleshooting

#### Common Issues

**1. Port Forwarding Fails**
```bash
# Kill existing port forwards
pkill -f "port-forward"

# Restart port forwarding
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring &
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/status-dashboard 3001:80 -n chaos-platform &
```

**2. Pods Not Starting**
```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Restart deployments
kubectl rollout restart deployment <deployment-name> -n <namespace>
```

**3. Helm Chart Issues**
```bash
# Update Helm repositories
helm repo update

# List installed charts
helm list --all-namespaces

# Uninstall and reinstall if needed
helm uninstall prometheus -n monitoring
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

**4. Docker Issues**
```bash
# Restart Docker Desktop
# On macOS: Docker Desktop > Restart
# On Linux: sudo systemctl restart docker

# Check Docker status
docker version
docker ps
```

**5. Kind Cluster Issues**
```bash
# Delete and recreate cluster
kind delete cluster --name chaos-platform
kind create cluster --name chaos-platform --config kubernetes/local/local-cluster.yaml
```

#### Resource Requirements

**Minimum System Requirements:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB free space
- **Docker**: 4GB memory allocated

**Recommended System Requirements:**
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 50GB free space
- **Docker**: 8GB memory allocated

### Cleanup

When you're done testing, clean up the resources:

```bash
# Delete the kind cluster
kind delete cluster --name chaos-platform

# Stop port forwarding
pkill -f "port-forward"

# Remove Docker images (optional)
docker system prune -a
```

### Next Steps

After successful setup:

1. **Explore the Dashboards**: Visit http://localhost:3001 for the main monitoring dashboard
2. **Run Chaos Experiments**: Apply chaos experiments from `kubernetes/chaos/`
3. **Monitor Auto-scaling**: Watch HPA and KEDA in action
4. **Test GitOps**: Make changes and see ArgoCD sync automatically

## Quick Start

### Prerequisites
- AWS CLI configured
- kubectl installed
- Helm installed
- Docker installed

### 1. Deploy Infrastructure
```bash
# Deploy EKS cluster
cd infrastructure/terraform
terraform init
terraform apply

# Configure kubectl
aws eks update-kubeconfig --name chaos-platform --region us-west-2
```

### 2. Deploy Applications
```bash
# Deploy base resources
cd ../../kubernetes
kubectl apply -f base/

# Deploy monitoring stack
kubectl apply -f monitoring/

# Deploy chaos engineering
kubectl apply -f chaos/

# Deploy auto-scaling
kubectl apply -f autoscaling/

# Deploy GitOps with ArgoCD
kubectl apply -f gitops/
```

### 3. Access Dashboards
```bash
# Port forward services
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring &
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/status-dashboard 3001:80 -n chaos-platform &

# Access URLs
# Grafana: http://localhost:3000 (admin/prom-operator)
# Prometheus: http://localhost:9090
# Custom Dashboard: http://localhost:3001
```

## Key Features

### Auto-Recovery
- **Horizontal Pod Autoscaler (HPA)**: Automatic scaling based on CPU/memory
- **Pod Disruption Budgets**: Ensures availability during updates
- **KEDA**: Event-driven autoscaling for custom metrics
- **Circuit Breakers**: Prevents cascade failures
- **Health Checks**: Automatic pod restart on failures

### Observability
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Incident notification
- **Custom Metrics**: Application-specific monitoring
- **Distributed Tracing**: Request flow tracking

### Chaos Engineering
- **LitmusChaos**: Automated chaos experiments
- **Pod Kill Experiments**: Simulate pod failures
- **Network Chaos**: Test network resilience
- **CPU Chaos**: Resource exhaustion testing
- **SLO Validation**: Measure impact on service levels

### GitOps
- **ArgoCD**: Application deployment automation
- **Git as Source of Truth**: Infrastructure as code
- **Automated Sync**: Continuous deployment
- **Rollback Capability**: Quick recovery from issues
- **Multi-Environment**: Staging and production

### SLO/SLI Design
- **Availability**: 99.9% target
- **Latency**: P95 < 200ms
- **Error Rate**: < 0.1%
- **Throughput**: 1000 req/sec
- **Error Budget**: Monthly allocation tracking

## Demo Scenarios

### Scenario 1: Black Friday Traffic Spike
- **Objective**: Test auto-scaling under load
- **Chaos**: Simulate 10x traffic increase
- **Recovery**: HPA scales pods automatically
- **Validation**: Service remains responsive

### Scenario 2: Database Overload Crisis
- **Objective**: Test circuit breaker patterns
- **Chaos**: Database becomes unresponsive
- **Recovery**: Circuit breaker prevents cascade
- **Validation**: Graceful degradation

### Scenario 3: Network Partitioning Chaos
- **Objective**: Test network resilience
- **Chaos**: Simulate network partitions
- **Recovery**: Service mesh handles routing
- **Validation**: Partial functionality maintained

### Scenario 4: Resource Exhaustion Crisis
- **Objective**: Test resource management
- **Chaos**: CPU/memory exhaustion
- **Recovery**: Resource limits and eviction
- **Validation**: System stability maintained

### Scenario 5: Multi-Service Failure Cascade
- **Objective**: Test cascade failure prevention
- **Chaos**: Multiple services fail simultaneously
- **Recovery**: Circuit breakers and timeouts
- **Validation**: Isolated failures

### Scenario 6: SLO Violation and Error Budget Burn
- **Objective**: Test SLO compliance
- **Chaos**: Sustained performance degradation
- **Recovery**: Error budget consumption
- **Validation**: SLO tracking and alerts

### Scenario 7: GitOps Rollback and Recovery
- **Objective**: Test deployment rollback
- **Chaos**: Bad deployment causes issues
- **Recovery**: ArgoCD rollback to previous version
- **Validation**: Service restoration

### Scenario 8: Chaos Engineering Experiment Results
- **Objective**: Validate chaos experiments
- **Chaos**: Controlled failure injection
- **Recovery**: Automated recovery mechanisms
- **Validation**: Improved resilience metrics

## Technology Stack

### Infrastructure
- **AWS EKS**: Managed Kubernetes cluster
- **Terraform**: Infrastructure as code
- **Docker**: Containerization
- **Helm**: Kubernetes package manager

### Applications
- **Node.js**: Backend services
- **React**: Frontend dashboard
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **Nginx**: API gateway

### Observability
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **AlertManager**: Alerting
- **Jaeger**: Distributed tracing
- **Winston**: Application logging

### Chaos Engineering
- **LitmusChaos**: Chaos experiments
- **Gremlin**: Alternative chaos tool
- **Custom Experiments**: Application-specific tests
- **Metrics Integration**: Impact measurement

### GitOps
- **ArgoCD**: Application deployment
- **GitHub Actions**: CI/CD pipeline
- **Trivy**: Security scanning
- **Kubernetes Dashboard**: Cluster management

## Success Criteria

### Performance Metrics
- **Availability**: > 99.9%
- **Latency**: P95 < 200ms
- **Error Rate**: < 0.1%
- **Recovery Time**: < 30 seconds
- **Auto-scaling**: Responds within 60 seconds

### Resilience Metrics
- **MTTR**: < 5 minutes
- **MTBF**: > 24 hours
- **Chaos Success Rate**: > 95%
- **SLO Compliance**: > 99%
- **Error Budget**: < 10% consumed

### User Experience
- **Zero Downtime**: During deployments
- **Graceful Degradation**: During failures
- **Fast Recovery**: Automatic healing
- **Transparent Monitoring**: Real-time visibility
- **Proactive Alerts**: Before issues impact users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes<img width="1470" height="696" alt="Screenshot 2025-07-31 at 3 04 50 PM" src="https://github.com/user-attachments/assets/072d07f4-da46-4ec5-b8c3-7fb224aad49c" />

4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Kubernetes community for the excellent orchestration platform
- Prometheus and Grafana teams for observability tools
- LitmusChaos for chaos engineering framework
- ArgoCD for GitOps implementation

<img width="1470" height="696" alt="Screenshot 2025-07-31 at 3 04 50 PM" src="https://github.com/user-attachments/assets/5491a5b0-8c81-4d4c-a756-d7e8af0e6a42" />

<img width="1470" height="635" alt="Screenshot 2025-07-31 at 3 02 44 PM" src="https://github.com/user-attachments/assets/d7275af3-1437-4b71-b721-dd5e5e8926f3" />


