param([ValidateSet('ambos','openai','gemini')][string]$Proveedor='ambos')
$ErrorActionPreference='Stop'
$target=Join-Path $PSScriptRoot '.env'
if (!(Test-Path -LiteralPath $target)) {Copy-Item -LiteralPath (Join-Path $PSScriptRoot '.env.example') -Destination $target}
$choices=if($Proveedor -eq 'ambos'){@('openai','gemini')}else{@($Proveedor)}
foreach($choice in $choices){
 $label=if($choice -eq 'openai'){'Rescue Rabbit 1 (OpenAI)'}else{'Rescue Rabbit 2 (Gemini)'}
 $prefix=if($choice -eq 'openai'){'OPENAI'}else{'GEMINI'}
 $model=if($choice -eq 'openai'){'gpt-5-mini'}else{'gemini-3.5-flash-lite'}
 $secret=Read-Host "Clave para $label (entrada oculta)" -AsSecureString
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
 try{
  $key=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if($key -notmatch '^[A-Za-z0-9_\-]+$'){throw 'La clave no tiene un formato válido. No se guardó.'}
  $lines=@(Get-Content -LiteralPath $target | Where-Object {$_ -notmatch "^${prefix}_(API_KEY|MODEL)="})
  $lines += "${prefix}_API_KEY=$key","${prefix}_MODEL=$model"
  [IO.File]::WriteAllLines($target,$lines,[Text.UTF8Encoding]::new($false))
 }finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$key=$null;$lines=$null}
}
Write-Host 'Claves guardadas. Reinicia el servidor. Cambiar mascota selecciona automáticamente la conexión para cada usuario. No compartas .env.'
