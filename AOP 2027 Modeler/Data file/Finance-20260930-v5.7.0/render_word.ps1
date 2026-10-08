$ErrorActionPreference = 'Stop'
$taskDirectory = $PSScriptRoot
$wordInstance = New-Object -ComObject Word.Application
$wordInstance.Visible = $false
$wordInstance.DisplayAlerts = 0
$wordInstance.AutomationSecurity = 3
try {
    foreach ($stem in @('AOP2027-Modeler-PRD-v5.7.0', 'AOP2027-Modeler-Detailed-Requirements-v5.7.0')) {
        $inputPath = Join-Path $taskDirectory ($stem + '.docx')
        $pdfPath = Join-Path $taskDirectory ('audit\' + $stem + '.pdf')
        $document = $wordInstance.Documents.Open($inputPath, $false, $true, $false)
        try {
            $document.ExportAsFixedFormat($pdfPath, 17)
            Write-Output $pdfPath
        } finally {
            $document.Close(0)
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document)
        }
    }
} finally {
    $wordInstance.Quit(0)
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordInstance)
}
