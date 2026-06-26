$files = Get-ChildItem -Path "$PSScriptRoot\..\src" -Recurse -Include '*.tsx','*.ts'
$map = [ordered]@{
  'bg-gray-50' = 'bg-cream'
  'bg-gray-100' = 'bg-paper'
  'bg-white' = 'bg-paper'
  'text-gray-900' = 'text-espresso'
  'text-gray-800' = 'text-espresso'
  'text-gray-700' = 'text-espresso'
  'text-gray-600' = 'text-espresso-soft'
  'text-gray-500' = 'text-espresso-soft'
  'text-gray-400' = 'text-sage-light'
  'text-gray-300' = 'text-sage-light'
  'border-gray-200' = 'border-espresso/10'
  'border-gray-100' = 'border-espresso/8'
  'border-gray-300' = 'border-espresso/15'
  'text-indigo-600' = 'text-terracotta'
  'text-indigo-700' = 'text-terracotta-deep'
  'text-indigo-800' = 'text-terracotta-deep'
  'text-indigo-400' = 'text-terracotta'
  'text-indigo-500' = 'text-terracotta'
  'bg-indigo-50' = 'bg-terracotta/10'
  'bg-indigo-100' = 'bg-terracotta/15'
  'border-indigo-400' = 'border-terracotta'
  'border-indigo-200' = 'border-terracotta/20'
  'border-indigo-300' = 'border-terracotta/25'
  'hover:bg-gray-50' = 'hover:bg-cream'
  'hover:bg-gray-100' = 'hover:bg-paper'
  'hover:text-gray-600' = 'hover:text-espresso-soft'
  'hover:text-gray-800' = 'hover:text-espresso'
  'hover:text-gray-700' = 'hover:text-espresso'
  'hover:text-gray-500' = 'hover:text-espresso-soft'
  'hover:text-indigo-600' = 'hover:text-terracotta'
  'hover:text-indigo-700' = 'hover:text-terracotta-deep'
  'hover:border-indigo-400' = 'hover:border-terracotta'
  'focus:border-indigo-400' = 'focus:border-terracotta'
  'ring-indigo-500' = 'ring-terracotta'
  'from-indigo-50' = 'from-terracotta/10'
  'to-indigo-50' = 'to-terracotta/10'
  'from-indigo-100' = 'from-terracotta/15'
  'to-indigo-100' = 'to-terracotta/15'
  'shadow-indigo' = 'shadow-terracotta'
  'divide-gray-200' = 'divide-espresso/10'
}

$count = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  $original = $content
  foreach ($key in $map.Keys) {
    $content = $content.Replace($key, $map[$key])
  }
  if ($content -ne $original) {
    Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
    $count++
  }
}
Write-Host "Updated $count files"