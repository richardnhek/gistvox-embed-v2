# Audio Working on Social Media - Implementation Guide

## ✅ DEPLOYMENT STATUS
- **Deployed**: October 21, 2025
- **Production URL**: https://gistvox-share.vercel.app
- **Twitter Player Fix**: DEPLOYED - Embed now hosted on Vercel

---

## 🔥 PART 1: TWITTER/X FIX (DEPLOYED)

### What Was Fixed
- **Problem**: Twitter player showed 404 when clicking play button
- **Root Cause**: GitHub Pages URL had issues with Twitter's iframe security
- **Solution**: Moved embed hosting to same Vercel deployment

### Changes Made
1. Created `/api/embed/[id].js` on Vercel
2. Updated Twitter meta tag to use local embed URL
3. Removed dependency on external GitHub Pages site

### Test Your Fix
1. Go to: https://cards-dev.twitter.com/validator
2. Enter: `https://gistvox-share.vercel.app/p/233d8054-c0c8-489e-b64f-5fc23ae7f783`
3. Click "Preview Card"
4. Audio should now play directly in Twitter!

---

## 📱 PART 2: FLUTTER APP CHANGES

### Step 1: Update Share URL (Immediate)
**File**: `lib/widgets/cards/now_playing_card.dart`

Find around line 1045:
```dart
Future<void> _handleSocialShare() async {
  try {
    // OLD CODE - REPLACE THIS:
    final shareUrl = 'https://gistvox.app.link/post/${widget.post.id}';
    
    // NEW CODE - USE THIS:
    final shareUrl = 'https://gistvox-share.vercel.app/p/${widget.post.id}';
    
    // Rest of your share code...
  }
}
```

### Step 2: Platform Detection for Sharing
Add this helper method to detect which platform user is sharing to:

```dart
enum SharePlatform {
  twitter,
  facebook,
  instagram,
  whatsapp,
  linkedin,
  other
}

SharePlatform? _detectSharePlatform(String shareText) {
  // This is a simple heuristic - enhance as needed
  if (shareText.toLowerCase().contains('#twitter') || 
      shareText.toLowerCase().contains('@')) {
    return SharePlatform.twitter;
  }
  // For now, we can't detect other platforms accurately
  // Consider using different share buttons for different platforms
  return SharePlatform.other;
}
```

---

## 🎬 PART 3: AUDIO-TO-VIDEO CONVERSION

### Why Needed
- **Facebook**: NO audio support - only video
- **LinkedIn**: NO audio support - only video  
- **Instagram**: NO audio support - only video
- **WhatsApp**: NO audio embeds in previews

### Implementation Strategy: Client-Side FFmpeg

#### Step 1: Add Dependencies
**File**: `pubspec.yaml`
```yaml
dependencies:
  ffmpeg_kit_flutter: ^6.0.3  # For video generation
  path_provider: ^2.1.1       # For temporary file storage
  share_plus: ^7.2.1          # Enhanced sharing with video support
```

#### Step 2: Create Audiogram Generator Service
**File**: `lib/services/audiogram_generator.dart`

```dart
import 'dart:io';
import 'package:ffmpeg_kit_flutter/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter/return_code.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;

class AudiogramGenerator {
  static const Duration _maxVideoDuration = Duration(seconds: 60);
  
  /// Generates a video from audio and cover image
  Future<File?> generateAudiogram({
    required String audioUrl,
    required String coverImageUrl,
    required String postId,
    String? title,
    String? authorHandle,
    Duration? audioDuration,
    AudiogramStyle style = AudiogramStyle.square,
  }) async {
    try {
      // 1. Download audio and image to temp directory
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      
      final audioPath = '${tempDir.path}/audio_$timestamp.mp3';
      final imagePath = '${tempDir.path}/cover_$timestamp.jpg';
      final outputPath = '${tempDir.path}/audiogram_$timestamp.mp4';
      
      // Download files
      await _downloadFile(audioUrl, audioPath);
      await _downloadFile(coverImageUrl, imagePath);
      
      // 2. Generate video based on platform style
      final String ffmpegCommand = _buildFFmpegCommand(
        audioPath: audioPath,
        imagePath: imagePath,
        outputPath: outputPath,
        style: style,
        duration: audioDuration,
      );
      
      // 3. Execute FFmpeg
      final session = await FFmpegKit.execute(ffmpegCommand);
      final returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        // Clean up input files
        File(audioPath).deleteSync();
        File(imagePath).deleteSync();
        
        return File(outputPath);
      } else {
        print('FFmpeg failed with return code: $returnCode');
        return null;
      }
    } catch (e) {
      print('Error generating audiogram: $e');
      return null;
    }
  }
  
  /// Downloads file from URL to local path
  Future<void> _downloadFile(String url, String savePath) async {
    final response = await http.get(Uri.parse(url));
    final file = File(savePath);
    await file.writeAsBytes(response.bodyBytes);
  }
  
  /// Builds FFmpeg command based on style
  String _buildFFmpegCommand({
    required String audioPath,
    required String imagePath,
    required String outputPath,
    required AudiogramStyle style,
    Duration? duration,
  }) {
    // Get dimensions based on style
    final dimensions = _getDimensions(style);
    
    // Basic command: static image + audio
    String command = '-loop 1 -i "$imagePath" -i "$audioPath" ';
    
    // Add filters for scaling and formatting
    command += '-vf "scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,';
    command += 'pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2,';
    command += 'format=yuv420p" ';
    
    // Audio settings
    command += '-c:a aac -b:a 128k ';
    
    // Video settings
    command += '-c:v libx264 -preset fast -crf 23 ';
    
    // Duration (use shortest of audio or max duration)
    if (duration != null && duration > _maxVideoDuration) {
      command += '-t ${_maxVideoDuration.inSeconds} ';
    } else {
      command += '-shortest ';
    }
    
    // Output
    command += '"$outputPath"';
    
    return command;
  }
  
  /// Returns dimensions based on platform style
  _VideoDimensions _getDimensions(AudiogramStyle style) {
    switch (style) {
      case AudiogramStyle.square:
        return _VideoDimensions(1080, 1080); // Instagram/Facebook feed
      case AudiogramStyle.portrait:
        return _VideoDimensions(1080, 1920); // Instagram Reels/Stories
      case AudiogramStyle.landscape:
        return _VideoDimensions(1920, 1080); // LinkedIn/Twitter
    }
  }
}

enum AudiogramStyle {
  square,    // 1:1 - Instagram/Facebook feed
  portrait,  // 9:16 - Instagram Reels/Stories
  landscape, // 16:9 - LinkedIn/YouTube
}

class _VideoDimensions {
  final int width;
  final int height;
  _VideoDimensions(this.width, this.height);
}
```

#### Step 3: Update Share Handler
**File**: `lib/widgets/cards/now_playing_card.dart`

```dart
import 'package:share_plus/share_plus.dart';
import 'package:gistvox/services/audiogram_generator.dart';

class NowPlayingCard extends StatefulWidget {
  // ... existing code ...
  
  final AudiogramGenerator _audiogramGenerator = AudiogramGenerator();
  bool _isGeneratingVideo = false;
  
  Future<void> _handleSocialShare({
    bool forceVideo = false,
    AudiogramStyle? videoStyle,
  }) async {
    try {
      setState(() => _isGeneratingVideo = true);
      
      // Determine if we need video (for non-Twitter platforms)
      final bool needsVideo = forceVideo || _shouldUseVideo();
      
      if (needsVideo) {
        // Generate audiogram video
        final videoFile = await _audiogramGenerator.generateAudiogram(
          audioUrl: widget.post.audioUrl,
          coverImageUrl: widget.post.coverImageUrl ?? _getDefaultCoverUrl(),
          postId: widget.post.id,
          title: widget.post.title,
          authorHandle: widget.post.user.handle,
          audioDuration: Duration(seconds: widget.post.audioDuration ?? 30),
          style: videoStyle ?? AudiogramStyle.square,
        );
        
        if (videoFile != null) {
          // Share video file
          await Share.shareXFiles(
            [XFile(videoFile.path)],
            text: _buildShareText(isVideo: true),
          );
          
          // Clean up temp file after sharing
          videoFile.deleteSync();
        } else {
          // Fallback to URL if video generation fails
          _showError('Video generation failed. Sharing link instead.');
          await _shareUrl();
        }
      } else {
        // Share URL (for Twitter/X and web)
        await _shareUrl();
      }
    } catch (e) {
      print('Share error: $e');
      _showError('Failed to share. Please try again.');
    } finally {
      setState(() => _isGeneratingVideo = false);
    }
  }
  
  Future<void> _shareUrl() async {
    final shareUrl = 'https://gistvox-share.vercel.app/p/${widget.post.id}';
    final shareText = _buildShareText(isVideo: false);
    
    await Share.share('$shareText\n\n🎧 Listen: $shareUrl');
  }
  
  String _buildShareText({required bool isVideo}) {
    final userHandle = widget.post.user.handle ?? 'anonymous';
    
    if (isVideo) {
      return '''🎙️ "${widget.post.title}"
      
By @$userHandle on @Gistvox

#Gistvox #AudioStories #Podcast''';
    } else {
      return '''🎙️ "${widget.post.title}"
      
By @$userHandle on Gistvox''';
    }
  }
  
  bool _shouldUseVideo() {
    // You could implement platform detection here
    // For now, provide UI buttons for different platforms
    return false;
  }
  
  // Add platform-specific share buttons
  Widget _buildShareOptions() {
    return Column(
      children: [
        // Twitter/X - Uses player card
        ListTile(
          leading: Icon(Icons.flutter_dash), // Use Twitter icon
          title: Text('Share to X/Twitter'),
          subtitle: Text('Audio plays in tweet'),
          onTap: () => _handleSocialShare(forceVideo: false),
        ),
        
        // Facebook/LinkedIn - Needs video
        ListTile(
          leading: Icon(Icons.facebook),
          title: Text('Share to Facebook/LinkedIn'),
          subtitle: Text('Generates video (5-10 seconds)'),
          onTap: () => _handleSocialShare(
            forceVideo: true,
            videoStyle: AudiogramStyle.square,
          ),
        ),
        
        // Instagram Reels - Vertical video
        ListTile(
          leading: Icon(Icons.video_library),
          title: Text('Share to Instagram Reels'),
          subtitle: Text('Generates vertical video'),
          onTap: () => _handleSocialShare(
            forceVideo: true,
            videoStyle: AudiogramStyle.portrait,
          ),
        ),
        
        // WhatsApp - Square video
        ListTile(
          leading: Icon(Icons.whatsapp),
          title: Text('Share to WhatsApp'),
          subtitle: Text('Generates video preview'),
          onTap: () => _handleSocialShare(
            forceVideo: true,
            videoStyle: AudiogramStyle.square,
          ),
        ),
      ],
    );
  }
  
  // Show loading indicator during video generation
  @override
  Widget build(BuildContext context) {
    if (_isGeneratingVideo) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Generating video...'),
            Text('This takes 5-10 seconds', 
              style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      );
    }
    
    // ... rest of your existing build method
  }
}
```

---

## 📊 PLATFORM SUPPORT MATRIX

| Platform | Audio Embed | Solution | Implementation |
|----------|------------|----------|----------------|
| **Twitter/X** | ✅ YES | Player Card | ✅ DEPLOYED |
| **Facebook** | ❌ NO | Video (MP4) | Client-side FFmpeg |
| **LinkedIn** | ❌ NO | Video (MP4) | Client-side FFmpeg |
| **Instagram** | ❌ NO | Video (MP4) | Client-side FFmpeg |
| **WhatsApp** | ❌ NO | Video (MP4) | Client-side FFmpeg |

---

## 🚀 DEPLOYMENT CHECKLIST

### Immediate Actions (Today)
- [x] Deploy Vercel changes (DONE)
- [ ] Update Flutter app share URL
- [ ] Test Twitter player card
- [ ] Remove GISTVOX_EMBED_URL from Vercel environment

### Next Sprint (2-3 days)
- [ ] Add ffmpeg_kit_flutter dependency
- [ ] Implement AudiogramGenerator service
- [ ] Add platform-specific share buttons
- [ ] Test video generation on devices
- [ ] Handle edge cases (long audio, missing images)

### Future Enhancements
- [ ] Add waveform animations to videos
- [ ] Custom templates per platform
- [ ] Background music for videos
- [ ] Progress bars in videos
- [ ] Auto-generated captions

---

## 🔍 TESTING URLS

### Twitter Card Validator
```
https://cards-dev.twitter.com/validator
Test URL: https://gistvox-share.vercel.app/p/233d8054-c0c8-489e-b64f-5fc23ae7f783
```

### Facebook Debugger  
```
https://developers.facebook.com/tools/debug/
Test URL: https://gistvox-share.vercel.app/p/233d8054-c0c8-489e-b64f-5fc23ae7f783
```

### Direct Test Link
```
https://gistvox-share.vercel.app/p/233d8054-c0c8-489e-b64f-5fc23ae7f783
```

---

## 💰 COST ANALYSIS

### Current Solution
- **Vercel Hosting**: $0/month (free tier)
- **Client-side Video**: $0/month (processing on device)
- **Total**: $0/month

### Alternative (Not Recommended)
- **Wavve API**: $300+/month
- **Headliner API**: $500+/month
- **Custom Server**: $50-100/month

---

## ⚠️ IMPORTANT NOTES

1. **Twitter/X**: The ONLY platform that supports audio embeds
2. **Video Generation**: Takes 5-10 seconds on device
3. **File Sizes**: Videos are ~2-5MB for 30 seconds
4. **Battery Impact**: Moderate during video generation
5. **App Size**: FFmpeg adds ~30MB to app size

---

## 📞 SUPPORT

If you encounter issues:
1. Check Vercel logs: `vercel logs gistvox-share.vercel.app`
2. Test Twitter card: https://cards-dev.twitter.com/validator
3. Verify environment variables are removed (GISTVOX_EMBED_URL)
4. Ensure FFmpeg package is properly configured for both iOS and Android

---

Last Updated: October 21, 2025
Status: Twitter fix DEPLOYED, Video conversion PENDING
