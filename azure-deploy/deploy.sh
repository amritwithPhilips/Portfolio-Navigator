#!/bin/bash
# =============================================================================
# AOP 2027 One Portfolio Navigator — Azure Static Web App Deployment
# =============================================================================
# Prerequisites:
#   1. Azure CLI installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
#   2. Logged in: az login
#   3. A subscription selected: az account set --subscription "Your Subscription"
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# This script creates:
#   - Resource group: rg-aop2027-navigator
#   - Storage account: staop2027scenarios
#   - Static Web App: swa-aop2027-navigator
# =============================================================================

set -euo pipefail

RESOURCE_GROUP="rg-aop2027-navigator"
LOCATION="westeurope"
STORAGE_ACCOUNT="staop2027scenarios"
STATIC_WEB_APP="swa-aop2027-navigator"

echo "=== Step 1: Create Resource Group ==="
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "=== Step 2: Create Storage Account ==="
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false

echo "=== Step 3: Get Storage Connection String ==="
CONN_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

echo "=== Step 4: Create Blob Container ==="
az storage container create \
  --name scenarios \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login 2>/dev/null || \
az storage container create \
  --name scenarios \
  --connection-string "$CONN_STRING"

echo "=== Step 5: Create Static Web App ==="
az staticwebapp create \
  --name $STATIC_WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

echo "=== Step 6: Configure API Environment Variable ==="
az staticwebapp appsettings set \
  --name $STATIC_WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --setting-names "STORAGE_CONNECTION_STRING=$CONN_STRING"

echo ""
echo "=== Deployment Infrastructure Ready ==="
echo ""
echo "Next steps:"
echo "  1. Copy the modeler HTML to azure-deploy/ as index.html"
echo "  2. Install API dependencies: cd api && npm install"
echo "  3. Deploy using SWA CLI:"
echo "     npm install -g @azure/static-web-apps-cli"
echo "     swa deploy ./azure-deploy --api-location ./azure-deploy/api"
echo ""
echo "Or use the GitHub Actions workflow (.github/workflows/azure-deploy.yml)"
echo ""

HOSTNAME=$(az staticwebapp show \
  --name $STATIC_WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname -o tsv 2>/dev/null || echo "pending")

echo "Your app will be available at: https://$HOSTNAME"
