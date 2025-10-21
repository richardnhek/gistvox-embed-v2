# Audio to Video Conversion Strategy for Social Platforms

## The Problem
- **Facebook**: Does NOT support audio embeds, only video
- **LinkedIn**: No audio support, only video
- **Instagram**: No audio support, only video (Feed/Stories/Reels)
- **WhatsApp**: No audio embeds in link previews

## The Solution: Audiograms (Audio as Video)

### Option 1: Client-Side Generation (Recommended)
Generate MP4 videos directly in Flutter app using FFmpeg.

**Pros:**
- Zero server costs
- No API limits
- Full control over output
- Works offline

**Cons:**
- Increases app size (~30MB for FFmpeg)
- Processing time on device (5-10 seconds)
- Battery usage

**Implementation:**
```dart
// Use flutter_ffmpeg package
final FlutterFFmpeg _flutterFFmpeg = FlutterFFmpeg();

Future<String> generateAudiogramVideo(String audioPath, String imagePath) async {
  final outputPath = '${Directory.systemTemp.path}/audiogram_${DateTime.now().millisecondsSinceEpoch}.mp4';
  
  // Create video with static image + audio
  final command = '-loop 1 -i $imagePath -i $audioPath -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p $outputPath';
  
  await _flutterFFmpeg.execute(command);
  return outputPath;
}
```

### Option 2: Server-Side Generation
Use cloud service to generate videos.

**Services & Costs (as of 2025):**

| Service | Cost | API | Features |
|---------|------|-----|----------|
| **Wavve** | $15-32/mo | REST API | Waveform animations, custom branding |
| **Headliner** | $19-48/mo | REST API | Transcriptions, animations |
| **Bannerbear** | $49/mo | REST API | Template-based, batch processing |
| **Custom (FFmpeg)** | ~$0.02/video | Your API | Full control, cheapest |

### Option 3: Hybrid Approach (Best)
1. Generate simple MP4 on device for immediate sharing
2. Optional: Upload to server for enhanced version

```dart
class AudiogramGenerator {
  // Quick local generation for immediate sharing
  Future<String> generateQuickLocal(Post post) async {
    // Create simple video with cover image + audio
    // Takes 3-5 seconds
  }
  
  // Premium server generation (optional)
  Future<String> generatePremiumServer(Post post) async {
    // Call your server API
    // Add waveforms, captions, animations
    // Takes 10-20 seconds
  }
}
```

## Technical Implementation

### Video Specifications for Social Platforms

| Platform | Aspect Ratio | Resolution | Max Duration | Format |
|----------|--------------|------------|--------------|--------|
| Facebook | 1:1 or 16:9 | 1080x1080 | 240 min | MP4 |
| Instagram Feed | 1:1 or 4:5 | 1080x1080 | 60 sec | MP4 |
| Instagram Reels | 9:16 | 1080x1920 | 90 sec | MP4 |
| LinkedIn | 16:9 or 1:1 | 1920x1080 | 10 min | MP4 |
| WhatsApp | Any | 720p max | 16 MB | MP4 |

### Basic FFmpeg Command Structure
```bash
# Simple audiogram with static image
ffmpeg -loop 1 -i cover.jpg -i audio.mp3 \
  -c:v libx264 -c:a aac -shortest \
  -pix_fmt yuv420p output.mp4

# With waveform visualization
ffmpeg -i audio.mp3 -filter_complex \
  "[0:a]showwaves=s=1920x1080:mode=cline:colors=white[v]" \
  -map "[v]" -map 0:a -c:v libx264 -c:a copy output.mp4

# With progress bar
ffmpeg -loop 1 -i background.jpg -i audio.mp3 \
  -filter_complex "[0:v]drawbox=y=ih-50:height=50:color=gray@0.5:t=fill[bg]; \
  [bg]drawbox=y=ih-50:height=50:color=green@0.8:t=fill:width='iw*t/duration'[v]" \
  -map "[v]" -map 1:a -c:v libx264 -c:a aac -shortest output.mp4
```

## Cost Analysis

### For 10,000 videos/month:

| Method | Cost | Pros | Cons |
|--------|------|------|------|
| Client-side | $0 | Free, instant | Device processing |
| Wavve API | $320 | Professional | Expensive |
| Custom Server | $20-50 | Scalable | Maintenance |
| Hybrid | $0-20 | Best UX | Complex |

## Recommended Implementation

1. **Phase 1**: Client-side generation with flutter_ffmpeg
   - Simple static image + audio
   - 1:1 aspect ratio for all platforms
   - Generate on-demand when user shares

2. **Phase 2**: Add server-side enhancement
   - Waveform animations
   - Progress bars
   - Captions from transcription

3. **Phase 3**: Platform-specific optimization
   - Instagram Reels (9:16)
   - Facebook (16:9)
   - LinkedIn (professional templates)

## Code Example for Flutter

```dart
class ShareService {
  final FFmpeg _ffmpeg = FFmpeg();
  
  Future<void> shareToSocialPlatform(Post post, Platform platform) async {
    // Check if platform needs video
    if (_needsVideoConversion(platform)) {
      final videoPath = await _generateAudiogram(post);
      await _shareVideo(videoPath, platform);
    } else {
      // Twitter/X - use existing player card
      await _shareLink(post.shareUrl);
    }
  }
  
  bool _needsVideoConversion(Platform platform) {
    return [
      Platform.facebook,
      Platform.instagram,
      Platform.linkedin,
      Platform.whatsapp
    ].contains(platform);
  }
  
  Future<String> _generateAudiogram(Post post) async {
    // Download cover image
    final coverPath = await _downloadCoverImage(post.coverUrl);
    
    // Generate video
    final outputPath = '${Directory.systemTemp.path}/${post.id}.mp4';
    
    await _ffmpeg.execute([
      '-loop', '1',
      '-i', coverPath,
      '-i', post.audioUrl,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-shortest',
      '-pix_fmt', 'yuv420p',
      outputPath
    ]);
    
    return outputPath;
  }
}
```

## Summary

**Immediate Solution**: Implement client-side FFmpeg generation in Flutter
**Cost**: $0 (just app size increase)
**Time to implement**: 2-3 days
**User experience**: 5-10 second generation time

This solves the problem of sharing audio on Facebook, LinkedIn, Instagram, and WhatsApp without recurring costs or API dependencies.
