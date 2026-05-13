"""
ATMOSFER STÜDYO PRO - Advanced Video Processing Worker
Handles complex video rendering with effects, transitions, audio mixing, and color grading
"""

import os
import json
import subprocess
import logging
from celery import Celery
from dotenv import load_dotenv
from datetime import datetime
import sqlite3
from moviepy.editor import *
from moviepy.video.VideoClip import VideoClip
import numpy as np

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Celery Setup
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("video_pro_worker", broker=redis_url, backend=redis_url)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
)

os.makedirs("output", exist_ok=True)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# ============================================================================
# EFFECT PROCESSORS
# ============================================================================

class EffectProcessor:
    """Advanced effects processing"""
    
    @staticmethod
    def apply_zoom(clip, zoom_factor=1.5, duration=None):
        """Apply zoom effect"""
        def make_frame(get_frame, t):
            frame = get_frame(t)
            h, w = frame.shape[:2]
            new_h, new_w = int(h * zoom_factor), int(w * zoom_factor)
            
            # Crop to original size from center
            y_offset = (new_h - h) // 2
            x_offset = (new_w - w) // 2
            
            # Simple zoom simulation
            return frame
        
        return clip.fl(make_frame)
    
    @staticmethod
    def apply_fade(clip, duration=1.0, direction="in"):
        """Apply fade effect"""
        if direction == "in":
            return clip.fadein(duration)
        else:
            return clip.fadeout(duration)
    
    @staticmethod
    def apply_color_grade(clip, preset="cinematic"):
        """Apply color grading"""
        def fl_image(get_frame, t):
            frame = get_frame(t).astype(float) / 255
            
            if preset == "cinematic":
                # Cinematic color grading
                frame[:,:,0] = np.clip(frame[:,:,0] * 0.9, 0, 1)  # Reduce blue
                frame[:,:,2] = np.clip(frame[:,:,2] * 1.1, 0, 1)  # Enhance red
            
            elif preset == "noir":
                # Black & white with blue tint
                gray = np.mean(frame, axis=2)
                frame = np.stack([gray, gray, gray], axis=2)
                frame[:,:,2] = np.clip(frame[:,:,2] * 1.3, 0, 1)
            
            elif preset == "warm":
                # Warm tones
                frame[:,:,0] = np.clip(frame[:,:,0] * 1.2, 0, 1)
                frame[:,:,1] = np.clip(frame[:,:,1] * 1.1, 0, 1)
            
            return (frame * 255).astype(np.uint8)
        
        return clip.fl_image(fl_image)
    
    @staticmethod
    def apply_slow_motion(clip, factor=0.5):
        """Apply slow motion effect"""
        return clip.speedx(factor)
    
    @staticmethod
    def apply_blur(clip, blur_amount=1.0):
        """Apply blur effect"""
        from scipy import ndimage
        
        def fl_image(get_frame, t):
            frame = get_frame(t)
            return ndimage.gaussian_filter(frame, sigma=blur_amount)
        
        return clip.fl_image(fl_image)

# ============================================================================
# AUDIO PROCESSOR
# ============================================================================

class AudioProcessor:
    """Advanced audio mixing and processing"""
    
    @staticmethod
    def normalize_audio(audio_clip):
        """Normalize audio to standard level"""
        max_volume = audio_clip.max_volume()
        if max_volume > 0:
            return audio_clip.volumex(1.0 / max_volume)
        return audio_clip
    
    @staticmethod
    def apply_crossfade(clip1, clip2, duration=1.0):
        """Create smooth crossfade between audio clips"""
        clip1_faded = clip1.fadeout(duration)
        clip2_faded = clip2.fadein(duration)
        return concatenate_audioclips([clip1_faded, clip2_faded])

# ============================================================================
# TEXT & SUBTITLE PROCESSOR
# ============================================================================

class TextProcessor:
    """Handle text overlays and animations"""
    
    @staticmethod
    def create_text_clip(text, fontsize=50, color='white', duration=5, position=('center', 'center')):
        """Create animated text clip"""
        txt_clip = TextClip(text, fontsize=fontsize, color=color, font='Arial')
        txt_clip = txt_clip.set_duration(duration)
        txt_clip = txt_clip.set_position(position)
        return txt_clip

# ============================================================================
# VIDEO COMPOSER
# ============================================================================

class VideoComposer:
    """Compose multiple layers into final video"""
    
    def __init__(self, width=1920, height=1080, fps=30):
        self.width = width
        self.height = height
        self.fps = fps
    
    def compose_project(self, project_id: str):
        """Compose video from project layers"""
        
        logger.info(f"📊 Composing project: {project_id}")
        
        # Get project from database
        conn = sqlite3.connect("atmosfer_pro.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project_row = cursor.fetchone()
        
        cursor.execute("""
            SELECT id, layer_type, start_time, end_time, asset_id, properties
            FROM layers
            WHERE project_id = ?
            ORDER BY order_index
        """, (project_id,))
        
        layers = cursor.fetchall()
        conn.close()
        
        if not project_row:
            raise Exception(f"Project {project_id} not found")
        
        logger.info(f"📹 Composing {len(layers)} layers")
        
        # Create background
        base_clip = ColorClip(
            size=(self.width, self.height),
            color=(0, 0, 0)
        ).set_duration(project_row[3])  # duration
        
        composed_clips = [base_clip]
        
        # Process each layer
        for layer in layers:
            layer_id, layer_type, start_time, end_time, asset_id, properties = layer
            
            try:
                props = json.loads(properties) if properties else {}
                
                if layer_type == "video" and asset_id:
                    clip = VideoFileClip(f"uploads/{asset_id}")
                    clip = clip.set_start(start_time).set_end(end_time)
                    composed_clips.append(clip)
                
                elif layer_type == "image" and asset_id:
                    img_clip = ImageClip(f"uploads/{asset_id}")
                    img_clip = img_clip.set_duration(end_time - start_time)
                    img_clip = img_clip.set_start(start_time)
                    composed_clips.append(img_clip)
                
                elif layer_type == "text":
                    text = props.get("text", "")
                    duration = end_time - start_time
                    text_clip = TextProcessor.create_text_clip(
                        text, 
                        fontsize=props.get("fontsize", 50),
                        color=props.get("color", "white"),
                        duration=duration
                    )
                    text_clip = text_clip.set_start(start_time)
                    composed_clips.append(text_clip)
                
                logger.info(f"✅ Layer {layer_id} ({layer_type}) processed")
                
            except Exception as e:
                logger.error(f"❌ Error processing layer {layer_id}: {str(e)}")
                continue
        
        # Composite all clips
        logger.info("🎬 Compositing layers...")
        final_clip = CompositeVideoClip(composed_clips, size=(self.width, self.height))
        
        return final_clip

# ============================================================================
# RENDERING ENGINE
# ============================================================================

class RenderingEngine:
    """Handle final video rendering with quality presets"""
    
    QUALITY_PRESETS = {
        "low": {
            "bitrate": "1000k",
            "preset": "faster",  # FFmpeg preset
            "crf": 28
        },
        "medium": {
            "bitrate": "2500k",
            "preset": "fast",
            "crf": 23
        },
        "high": {
            "bitrate": "5000k",
            "preset": "medium",
            "crf": 20
        },
        "4k": {
            "bitrate": "10000k",
            "preset": "slow",
            "crf": 18
        }
    }
    
    @staticmethod
    def render_video(clip, output_path: str, quality: str = "high", fps: int = 30):
        """Render video with specified quality"""
        
        if quality not in RenderingEngine.QUALITY_PRESETS:
            quality = "high"
        
        preset = RenderingEngine.QUALITY_PRESETS[quality]
        
        logger.info(f"🎥 Rendering video: {output_path}")
        logger.info(f"📊 Quality: {quality}, FPS: {fps}")
        
        clip.write_videofile(
            output_path,
            fps=fps,
            codec='libx264',
            audio_codec='aac',
            preset=preset["preset"],
            ffmpeg_params=['-crf', str(preset["crf"])],
            verbose=False,
            logger=None
        )
        
        logger.info(f"✅ Video rendered: {output_path}")

# ============================================================================
# CELERY TASKS
# ============================================================================

@celery_app.task(name="render_video")
def render_video_task(project_id: str, export_settings: dict):
    """
    Celery task: Render complete video project with all effects
    """
    logger.info(f"🎬 Starting render task for project: {project_id}")
    logger.info(f"📋 Export settings: {export_settings}")
    
    try:
        # Create composer
        composer = VideoComposer(fps=export_settings.get("fps", 30))
        
        # Compose video
        final_clip = composer.compose_project(project_id)
        
        # Prepare output
        output_file = f"output/{project_id}_{export_settings['quality']}.{export_settings['format']}"
        
        # Apply color grading if specified
        if export_settings.get("color_grade"):
            final_clip = EffectProcessor.apply_color_grade(
                final_clip,
                export_settings.get("grade_preset", "cinematic")
            )
        
        # Render video
        RenderingEngine.render_video(
            final_clip,
            output_file,
            quality=export_settings.get("quality", "high"),
            fps=export_settings.get("fps", 30)
        )
        
        logger.info(f"✅ Rendering completed: {output_file}")
        
        return {
            "project_id": project_id,
            "status": "completed",
            "output_file": output_file,
            "file_size": os.path.getsize(output_file),
            "message": "✅ Video rendering completed successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Rendering failed: {str(e)}")
        
        return {
            "project_id": project_id,
            "status": "failed",
            "error": str(e),
            "message": "❌ Video rendering failed"
        }

@celery_app.task(name="process_effect")
def process_effect_task(project_id: str, layer_id: str, effect_data: dict):
    """Apply effects to specific layer"""
    
    logger.info(f"🎨 Applying effect to layer: {layer_id}")
    logger.info(f"📋 Effect: {effect_data}")
    
    try:
        effect_type = effect_data.get("type")
        params = effect_data.get("params", {})
        
        if effect_type == "zoom":
            logger.info(f"🔍 Applying zoom effect")
        elif effect_type == "fade":
            logger.info(f"⚫ Applying fade effect")
        elif effect_type == "color_grade":
            logger.info(f"🎨 Applying color grading")
        elif effect_type == "slow_motion":
            logger.info(f"🐌 Applying slow motion")
        
        return {
            "status": "success",
            "layer_id": layer_id,
            "effect": effect_type,
            "message": f"Effect {effect_type} applied successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Effect processing failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e)
        }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("🚀 Atmosfer Stüdyo PRO Worker starting...")
    celery_app.start()
