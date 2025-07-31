#!/bin/bash

echo "Setting up Chaos Engineering Platform..."

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed. Aborting." >&2; exit 1; }

# Create namespaces
kubectl create namespace chaos-platform --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace chaos-engineering --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace gitops --dry-run=client -o yaml | kubectl apply -f -

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

echo "Setup complete! Access dashboards at:"
echo "- Grafana: http://localhost:3000 (admin/prom-operator)"
echo "- Prometheus: http://localhost:9090"
echo "- Custom Dashboard: http://localhost:3001"
echo ""
echo "Run: kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring &"
echo "Run: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring &"
echo "Run: kubectl port-forward svc/status-dashboard 3001:80 -n chaos-platform &" 