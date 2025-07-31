#!/bin/bash

# Local Chaos Engineering Platform Setup Script
# This script sets up the platform on a local Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    # Check if kind is available
    if ! command -v kind &> /dev/null; then
        error "kind is not installed. Please install kind."
        exit 1
    fi
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install kubectl."
        exit 1
    fi
    
    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        warning "Helm is not installed. Installing helm..."
        brew install helm
    fi
    
    success "Prerequisites check passed"
}

# Create local cluster
create_cluster() {
    log "Creating local Kubernetes cluster..."
    
    # Check if cluster already exists
    if kind get clusters | grep -q chaos-platform; then
        warning "Cluster chaos-platform already exists. Deleting..."
        kind delete cluster --name chaos-platform
    fi
    
    # Create cluster
    kind create cluster --name chaos-platform --config kubernetes/local/local-cluster.yaml
    
    # Wait for cluster to be ready
    kubectl wait --for=condition=ready node --all --timeout=300s
    
    success "Local cluster created successfully"
}

# Install Helm repositories
setup_helm() {
    log "Setting up Helm repositories..."
    
    # Add required Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add argo https://argoproj.github.io/argo-helm
    helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm
    helm repo update
    
    success "Helm repositories configured"
}

# Deploy base infrastructure
deploy_base() {
    log "Deploying base infrastructure..."
    
    # Create namespaces
    kubectl create namespace chaos-platform --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace chaos-engineering --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace gitops --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy base resources
    kubectl apply -f kubernetes/base/
    
    success "Base infrastructure deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Install Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.probeSelectorNilUsesHelmValues=false
    
    # Wait for monitoring to be ready
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
    kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s
    
    success "Monitoring stack deployed"
}

# Deploy chaos engineering
deploy_chaos() {
    log "Deploying chaos engineering..."
    
    # Install LitmusChaos
    helm install litmus litmuschaos/litmus \
        --namespace chaos-engineering \
        --create-namespace \
        --set litmuschaos.enabled=true
    
    # Wait for LitmusChaos to be ready
    kubectl wait --for=condition=ready pod -l app=litmus -n chaos-engineering --timeout=300s
    
    # Deploy chaos experiments
    kubectl apply -f kubernetes/chaos/
    
    success "Chaos engineering deployed"
}

# Deploy GitOps
deploy_gitops() {
    log "Deploying GitOps with ArgoCD..."
    
    # Install ArgoCD
    helm install argocd argo/argo-cd \
        --namespace gitops \
        --create-namespace \
        --set server.ingress.enabled=false \
        --set server.service.type=NodePort \
        --set server.service.nodePort=30080
    
    # Wait for ArgoCD to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n gitops --timeout=300s
    
    # Deploy ArgoCD applications
    kubectl apply -f kubernetes/gitops/
    
    success "GitOps deployed"
}

# Deploy sample applications
deploy_applications() {
    log "Deploying sample applications..."
    
    # Create sample microservices
    cat << EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-service
  namespace: chaos-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-service
  template:
    metadata:
      labels:
        app: frontend-service
    spec:
      containers:
      - name: frontend
        image: nginx:alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: chaos-platform
spec:
  selector:
    app: frontend-service
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30000
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-service
  namespace: chaos-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway-service
  template:
    metadata:
      labels:
        app: api-gateway-service
    spec:
      containers:
      - name: api-gateway
        image: nginx:alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: chaos-platform
spec:
  selector:
    app: api-gateway-service
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30001
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: chaos-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: nginx:alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: chaos-platform
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30002
  type: NodePort
EOF
    
    # Wait for applications to be ready
    kubectl wait --for=condition=ready pod -l app=frontend-service -n chaos-platform --timeout=300s
    kubectl wait --for=condition=ready pod -l app=api-gateway-service -n chaos-platform --timeout=300s
    kubectl wait --for=condition=ready pod -l app=user-service -n chaos-platform --timeout=300s
    
    success "Sample applications deployed"
}

# Deploy auto-scaling
deploy_autoscaling() {
    log "Deploying auto-scaling..."
    
    kubectl apply -f kubernetes/autoscaling/
    
    success "Auto-scaling deployed"
}

# Show access information
show_access_info() {
    log "Setting up access information..."
    
    # Get cluster IP
    CLUSTER_IP=$(docker inspect chaos-platform-control-plane --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
    
    echo ""
    echo "🎉 Chaos Engineering Platform is ready!"
    echo ""
    echo "📊 Access Information:"
    echo "  Grafana: http://localhost:3000 (admin/admin)"
    echo "  Prometheus: http://localhost:9090"
    echo "  ArgoCD: http://localhost:8080 (admin/admin)"
    echo ""
    echo "🚀 Sample Applications:"
    echo "  Frontend: http://localhost:30000"
    echo "  API Gateway: http://localhost:30001"
    echo "  User Service: http://localhost:30002"
    echo ""
    echo "🧪 Chaos Experiments:"
    echo "  kubectl get chaosexperiments -n chaos-engineering"
    echo "  kubectl apply -f kubernetes/chaos/pod-kill-experiment.yaml"
    echo ""
    echo "📈 Monitoring:"
    echo "  kubectl get pods -n monitoring"
    echo "  kubectl get pods -n chaos-platform"
    echo ""
    echo "🔧 GitOps:"
    echo "  kubectl get applications -n gitops"
    echo "  kubectl get applications -n gitops -o wide"
    echo ""
}

# Main execution
main() {
    echo "🚀 Setting up Chaos Engineering Platform locally..."
    echo ""
    
    check_prerequisites
    create_cluster
    setup_helm
    deploy_base
    deploy_monitoring
    deploy_chaos
    deploy_gitops
    deploy_applications
    deploy_autoscaling
    show_access_info
    
    echo "✅ Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run the demo scenarios: ./scripts/demo-runner.sh"
    echo "2. Check the documentation: docs/demo-scenarios.md"
    echo "3. Explore the dashboards and run chaos experiments"
}

# Run main function
main "$@" 