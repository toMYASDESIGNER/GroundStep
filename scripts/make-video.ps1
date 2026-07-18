param(
  [string]$Voice = "Microsoft Zira Desktop",
  [int]$Rate = 0
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$videoRoot = Join-Path $projectRoot "video"
$frameRoot = Join-Path $videoRoot "frames"
$audioRoot = Join-Path $videoRoot "audio"
$segmentRoot = Join-Path $videoRoot "segments"
$outputRoot = Join-Path $videoRoot "output"
$narrationPath = Join-Path $videoRoot "narration.json"
$finalVideo = Join-Path $outputRoot "GroundStep-judging-demo.mp4"
$subtitledVideo = Join-Path $outputRoot "GroundStep-judging-demo-subtitled.mp4"
$subtitlePath = Join-Path $outputRoot "GroundStep-judging-demo.srt"

New-Item -ItemType Directory -Force $audioRoot, $segmentRoot, $outputRoot | Out-Null
$scenes = Get-Content -Raw $narrationPath | ConvertFrom-Json

Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice($Voice)
$speaker.Rate = $Rate
$speaker.Volume = 100

function Format-SrtTime([double]$seconds) {
  $time = [TimeSpan]::FromSeconds($seconds)
  return "{0:00}:{1:00}:{2:00},{3:000}" -f [math]::Floor($time.TotalHours), $time.Minutes, $time.Seconds, $time.Milliseconds
}

$concatLines = New-Object System.Collections.Generic.List[string]
$subtitleBlocks = New-Object System.Collections.Generic.List[string]
$cursor = 0.0
$index = 0
$subtitleIndex = 0

foreach ($scene in $scenes) {
  $index += 1
  $name = "{0:00}" -f $index
  $frame = Join-Path $frameRoot $scene.frame
  $wav = Join-Path $audioRoot "$name.wav"
  $segment = Join-Path $segmentRoot "$name.mp4"

  if (-not (Test-Path $frame)) { throw "Missing video frame: $frame" }

  $speaker.SetOutputToWaveFile($wav)
  $speaker.Speak([string]$scene.text)
  $speaker.SetOutputToNull()

  $spokenDuration = [double]::Parse(
    (& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $wav).Trim(),
    [Globalization.CultureInfo]::InvariantCulture
  )
  $sceneDuration = $spokenDuration + 1.2
  $fadeOut = [math]::Max(0.2, $sceneDuration - 0.35).ToString("0.000", [Globalization.CultureInfo]::InvariantCulture)
  $durationText = $sceneDuration.ToString("0.000", [Globalization.CultureInfo]::InvariantCulture)

  & ffmpeg -y -loglevel error `
    -loop 1 -framerate 30 -i $frame -i $wav `
    -filter_complex "[0:v]scale=1500:1000:force_original_aspect_ratio=decrease,pad=1500:1000:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.35,format=yuv420p[v];[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=1.2[a]" `
    -map "[v]" -map "[a]" -t $durationText -r 30 `
    -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k -ar 48000 -ac 2 $segment

  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed for scene $index" }

  $escapedSegment = $segment.Replace("'", "''")
  $concatLines.Add("file '$escapedSegment'")
  $sentences = [regex]::Split(([string]$scene.text).Trim(), "(?<=[.!?])\s+") | Where-Object { $_ }
  $totalWords = ($sentences | ForEach-Object { ($_ -split "\s+").Count } | Measure-Object -Sum).Sum
  $sentenceCursor = $cursor
  foreach ($sentence in $sentences) {
    $subtitleIndex += 1
    $wordCount = ($sentence -split "\s+").Count
    $sentenceDuration = $spokenDuration * ($wordCount / $totalWords)
    $subtitleBlocks.Add("$subtitleIndex`r`n$(Format-SrtTime $sentenceCursor) --> $(Format-SrtTime ($sentenceCursor + $sentenceDuration))`r`n$sentence`r`n")
    $sentenceCursor += $sentenceDuration
  }
  $cursor += $sceneDuration
}

$speaker.Dispose()
$concatPath = Join-Path $videoRoot "segments.txt"
[IO.File]::WriteAllLines($concatPath, $concatLines)
[IO.File]::WriteAllLines($subtitlePath, $subtitleBlocks)

& ffmpeg -y -loglevel error -f concat -safe 0 -i $concatPath -c copy -movflags +faststart $finalVideo
if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed while joining the final video" }

Push-Location $projectRoot
try {
  & ffmpeg -y -loglevel error -i "video/output/GroundStep-judging-demo.mp4" `
    -vf "subtitles='video/output/GroundStep-judging-demo.srt':force_style='FontName=Arial,FontSize=10,PrimaryColour=&H00FFFFFF,BackColour=&H90000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Alignment=2'" `
    -c:v libx264 -preset medium -crf 20 -c:a copy -movflags +faststart "video/output/GroundStep-judging-demo-subtitled.mp4"
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed while burning subtitles" }
} finally {
  Pop-Location
}

$duration = (& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo).Trim()
Write-Output "Video: $finalVideo"
Write-Output "Subtitled video: $subtitledVideo"
Write-Output "Subtitles: $subtitlePath"
Write-Output "Duration: $duration seconds"
