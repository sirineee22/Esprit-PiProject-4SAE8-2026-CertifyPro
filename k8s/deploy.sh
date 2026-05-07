#!/bin/bash

echo "=== Deploying CertifyPro to Minikube ==="

# Point Docker to Minikube's internal registry
eval $(minikube docker-env)

# Build all images inside Minikube
echo ">>> Building Docker images inside Minikube..."
docker build -t esprit-piproject-4sae8-2026-certifypro-discovery-server:latest ./backend/discovery-server
docker build -t esprit-piproject-4sae8-2026-certifypro-api-gateway:latest ./backend/api-gateway
docker build -t esprit-piproject-4sae8-2026-certifypro-user-service:latest ./backend/services/user-service
docker build -t esprit-piproject-4sae8-2026-certifypro-event-service:latest ./backend/services/event-service
docker build -t esprit-piproject-4sae8-2026-certifypro-frontend:latest ./frontend

# Apply all manifests
echo ">>> Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/discovery-server.yml
kubectl apply -f k8s/api-gateway.yml
kubectl apply -f k8s/user-service.yml
kubectl apply -f k8s/event-service.yml
kubectl apply -f k8s/frontend.yml
kubectl apply -f k8s/prometheus.yml
kubectl apply -f k8s/grafana.yml

echo ""
echo "=== Deployment done! Waiting for pods to be ready... ==="
kubectl wait --for=condition=ready pod --all -n certifypro --timeout=300s

echo ""
echo "=== Service URLs ==="
minikube service frontend    -n certifypro --url
minikube service api-gateway -n certifypro --url
minikube service prometheus  -n certifypro --url
minikube service grafana     -n certifypro --url
