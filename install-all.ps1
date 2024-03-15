$projects = Get-ChildItem . -Recurse -Filter package.json -Depth 1 | Select-Object DirectoryName;

$projects | ForEach-Object -Process {
    $location = $_.DirectoryName;

    try {
        $name = Split-Path -Path $location -Leaf -Resolve;    
        Write-Host "Installing '$($name)'...";
        Push-Location $location;
        npm install;
    } finally {
        Pop-Location;
    }
};