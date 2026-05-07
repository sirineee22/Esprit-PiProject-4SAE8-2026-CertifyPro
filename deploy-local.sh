#!/bin/bash
set -e

echo "Connecting to Minikube Docker environment..."
eval $(minikube docker-env)

echo "Building Docker images... (This might take a few minutes)"
docker build -t certifypro-discovery:latest backend/discovery-server
docker build -t certifypro-gateway:latest backend/api-gateway
docker build -t certifypro-user:latest backend/services/user-service
docker build -t certifypro-training:latest backend/services/training-service
docker build -t certifypro-event:latest backend/services/event-service
docker build -t certifypro-ecommerce:latest backend/services/ecommerce
docker build -t certifypro-forum:latest backend/services/forum_service
docker build -t certifypro-collab:latest backend/services/collaboration-service
docker build -t certifypro-planned:latest backend/services/planned-session-service
docker build -t certifypro-frontend:latest frontend

echo "Creating Kubernetes Namespace..."
kubectl create namespace certifypro --dry-run=client -o yaml | kubectl apply -f -

echo "Creating ConfigMaps..."
kubectl -n certifypro create configmap postgres-init-sql \
    --from-file=init.sql=backend/db/init.sql \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl -n certifypro create configmap prometheus-config \
    --from-file=prometheus.yml=backend/prometheus.yml \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl -n certifypro create configmap grafana-datasource-config \
    --from-file=prometheus-datasource.yml=backend/grafana/provisioning/datasources/prometheus-datasource.yml \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl -n certifypro create configmap grafana-dashboards-provider-config \
    --from-file=dashboards.yml=backend/grafana/provisioning/dashboards/dashboards.yml \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl -n certifypro create configmap grafana-dashboards-json \
    --from-file=system-metrics.json=backend/grafana/dashboards/system-metrics.json \
    --from-file=microservices-health.json=backend/grafana/dashboards/microservices-health.json \
    --dry-run=client -o yaml | kubectl apply -f -

echo "Applying Kubernetes Manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/infrastructure
kubectl apply -f k8s/app
kubectl apply -f k8s/monitoring

echo "Deployment complete! Pods are spinning up."
kubectl -n certifypro get pods
