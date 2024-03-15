try {
    Write-Output 'Watching TypeScript file changes...';

    $projectDirs = Get-ChildItem . -Recurse -Filter tsconfig.json -Depth 1 | Select-Object DirectoryName;

    $projectJobs = $projectDirs | ForEach-Object -AsJob -Parallel { 
        $name = Split-Path -Path  $_.DirectoryName -Leaf -Resolve;
        Set-Location $_.DirectoryName;
        Invoke-Command -ScriptBlock { npm run start:dev };
    }

    $projectJobs.ChildJobs;
    $projectJobs | Receive-Job -Wait;
} 
catch {
    Write-Error $_;
} 
finally {
    Write-Output 'Finished';
}
