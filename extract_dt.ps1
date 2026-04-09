$json = Get-Content -Raw .\farm_sheet.txt
$json = $json.Replace("google.visualization.Query.setResponse(", "")
$json = $json.Substring(0, $json.Length - 2) # remove ");"
$obj = ConvertFrom-Json $json

$loaiDT = $obj.table.rows | ForEach-Object {
    if ($_.c.Count -gt 12 -and $_.c[12] -ne $null) {
        $_.c[12].v
    }
} | Sort-Object -Unique
$loaiDT | Out-File types.txt
