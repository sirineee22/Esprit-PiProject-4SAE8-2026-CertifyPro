#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Script d'installation Argo CD sur cluster Kubeadm
# Lancer sur le master node : bash argocd/install-argocd.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "📦 1 — Création du namespace argocd..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "📦 2 — Installation Argo CD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ 3 — Attente que les pods Argo CD soient prêts..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "🔑 4 — Récupération du mot de passe admin initial..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)
echo "   Mot de passe admin: $ARGOCD_PASSWORD"

echo "🌐 5 — Exposition du dashboard Argo CD sur NodePort 30808..."
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "nodePort": 30808}]}}'

echo ""
echo "✅ Argo CD installé !"
echo "   Dashboard : https://$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}'):30808"
echo "   Login     : admin"
echo "   Password  : $ARGOCD_PASSWORD"
echo ""
echo "📦 6 — Déploiement des applications CertifyPro..."
kubectl apply -f argocd/job-careers-app.yaml
kubectl apply -f argocd/messaging-app.yaml
kubectl apply -f argocd/frontend-app.yaml

echo "✅ Applications Argo CD créées — synchronisation automatique activée"
