# Configure Google OAuth and URL settings for Supabase via Management API
# Requires: Supabase Personal Access Token from https://supabase.com/dashboard/account/tokens

param(
    [Parameter(Mandatory=$true)]
    [string]$SupabaseAccessToken,
    
    [Parameter(Mandatory=$true)]
    [string]$GoogleClientId,
    [Parameter(Mandatory=$true)]
    [string]$GoogleClientSecret,
    [string]$ProjectRef = "zkzudgoqehlnihzulcxc",
    [string]$SiteUrl = "http://localhost:4200",
    [string]$RedirectUrl = "http://localhost:4200/**"
)

$baseUrl = "https://api.supabase.com/v1/projects/$ProjectRef"
$headers = @{
    "Authorization" = "Bearer $SupabaseAccessToken"
    "Content-Type" = "application/json"
}

Write-Host "=== Step 1: Configuring Google OAuth Provider ===" -ForegroundColor Cyan
$googleConfig = @{
    external_google_enabled = $true
    external_google_client_id = $GoogleClientId
    external_google_secret = $GoogleClientSecret
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/config/auth" -Method Patch -Headers $headers -Body $googleConfig
    Write-Host "SUCCESS: Google OAuth provider configured" -ForegroundColor Green
} catch {
    Write-Host "ERROR configuring Google OAuth: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n=== Step 2: Configuring URL Settings (Site URL + Redirect URLs) ===" -ForegroundColor Cyan
$urlConfig = @{
    site_url = $SiteUrl
    additional_redirect_urls = @($RedirectUrl)
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/config/auth" -Method Patch -Headers $headers -Body $urlConfig
    Write-Host "SUCCESS: URL configuration updated" -ForegroundColor Green
    Write-Host "  - Site URL: $SiteUrl" -ForegroundColor Gray
    Write-Host "  - Redirect URL added: $RedirectUrl" -ForegroundColor Gray
} catch {
    Write-Host "ERROR configuring URLs: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n=== Configuration Complete ===" -ForegroundColor Green
Write-Host "Google OAuth and URL settings have been applied to project $ProjectRef" -ForegroundColor White
Write-Host "`nIMPORTANT: Add this callback URL to your Google Cloud Console OAuth client:" -ForegroundColor Yellow
Write-Host "  https://${ProjectRef}.supabase.co/auth/v1/callback" -ForegroundColor White
Write-Host "  (Google Cloud Console > APIs & Services > Credentials > Your OAuth 2.0 Client > Authorized redirect URIs)" -ForegroundColor Gray
