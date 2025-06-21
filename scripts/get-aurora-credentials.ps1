# Script to retrieve Aurora PostgreSQL credentials from AWS Secrets Manager
# Usage: .\scripts\get-aurora-credentials.ps1 -SecretName "your-secret-name" -Region "your-region"

param(
    [Parameter(Mandatory=$true)]
    [string]$SecretName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🔐 Retrieving Aurora credentials from AWS Secrets Manager..." -ForegroundColor Cyan
Write-Host "Secret: $SecretName" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host ""

try {
    # Import AWS module if available
    if (-not (Get-Module -ListAvailable -Name AWS.Tools.SecretsManager)) {
        Write-Host "⚠️  AWS Tools for PowerShell not found. Please install it first:" -ForegroundColor Yellow
        Write-Host "Install-Module -Name AWS.Tools.SecretsManager" -ForegroundColor White
        Write-Host ""
        Write-Host "Alternative: Use AWS CLI instead:" -ForegroundColor Yellow
        Write-Host "aws secretsmanager get-secret-value --secret-id $SecretName --region $Region" -ForegroundColor White
        exit 1
    }

    # Get the secret value
    $secret = Get-SECSecretValue -SecretId $SecretName -Region $Region
    $secretData = $secret.SecretString | ConvertFrom-Json

    Write-Host "✅ Successfully retrieved credentials!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== DBeaver Connection Settings ===" -ForegroundColor Cyan
    Write-Host "Host:     $($secretData.host)" -ForegroundColor White
    Write-Host "Port:     $($secretData.port)" -ForegroundColor White  
    Write-Host "Database: $($secretData.dbname)" -ForegroundColor White
    Write-Host "Username: $($secretData.username)" -ForegroundColor White
    Write-Host "Password: $($secretData.password)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "=== Environment Variables for .env.local ===" -ForegroundColor Cyan
    Write-Host "AURORA_POSTGRES_HOST=$($secretData.host)"
    Write-Host "AURORA_POSTGRES_PORT=$($secretData.port)"
    Write-Host "AURORA_POSTGRES_DATABASE=$($secretData.dbname)"
    Write-Host "AURORA_POSTGRES_USER=$($secretData.username)"
    Write-Host "AURORA_POSTGRES_PASSWORD=$($secretData.password)"
    Write-Host ""
    
    Write-Host "📋 Copy the above values into DBeaver connection settings" -ForegroundColor Green
    Write-Host "🔒 Remember to enable SSL in DBeaver (SSL tab → Use SSL → require mode)" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error retrieving secret: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Check if AWS credentials are configured (aws configure)" -ForegroundColor White
    Write-Host "- Verify the secret name and region are correct" -ForegroundColor White
    Write-Host "- Ensure you have SecretsManager permissions" -ForegroundColor White
    exit 1
} 