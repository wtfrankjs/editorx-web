"""
Professional Smart Crop Microservice
Deploy to Railway/Render/Vercel
"""
from flask import Flask, request, jsonify
from PIL import Image, ImageDraw
import requests
from io import BytesIO
import base64

app = Flask(__name__)

@app.route('/prepare-canvas', methods=['POST'])
def prepare_canvas():
    """Prepare image canvas with mask for AI inpainting"""
    try:
        data = request.json
        image_url = data['imageUrl']
        target_w = data['targetWidth']
        target_h = data['targetHeight']
        
        # Download image
        response = requests.get(image_url, timeout=30)
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGB
        if img.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                bg.paste(img, mask=img.split()[-1])
            else:
                bg.paste(img)
            img = bg
        
        img_w, img_h = img.size
        
        # Calculate scaling (keep 70% of target size for original)
        scale = min(target_w / img_w, target_h / img_h, 0.7)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)
        
        # Nano Banana is flexible with dimensions, no need for 64 multiple constraint
        
        # Resize
        img_resized = img.resize((new_w, new_h), Image.LANCZOS)
        
        # Create canvas
        canvas = Image.new('RGB', (target_w, target_h), (128, 128, 128))
        paste_x = (target_w - new_w) // 2
        paste_y = (target_h - new_h) // 2
        canvas.paste(img_resized, (paste_x, paste_y))
        
        # Create mask (white = fill areas)
        mask = Image.new('L', (target_w, target_h), 255)
        draw = ImageDraw.Draw(mask)
        draw.rectangle([paste_x, paste_y, paste_x + new_w, paste_y + new_h], fill=0)
        
        # Convert to base64
        img_buffer = BytesIO()
        canvas.save(img_buffer, format='PNG')
        img_b64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        mask_buffer = BytesIO()
        mask.save(mask_buffer, format='PNG')
        mask_b64 = base64.b64encode(mask_buffer.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'image_b64': f'data:image/png;base64,{img_b64}',
            'mask_b64': f'data:image/png;base64,{mask_b64}',
            'width': target_w,
            'height': target_h
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/crop-to-exact', methods=['POST'])
def crop_to_exact():
    """Crop image to exact dimensions from center"""
    try:
        data = request.json
        image_url = data['imageUrl']
        target_w = data['targetWidth']
        target_h = data['targetHeight']
        
        # Download image
        response = requests.get(image_url, timeout=30)
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                bg.paste(img, mask=img.split()[-1])
            else:
                bg.paste(img)
            img = bg
        
        current_w, current_h = img.size
        
        # Calculate center crop box
        left = (current_w - target_w) // 2
        top = (current_h - target_h) // 2
        right = left + target_w
        bottom = top + target_h
        
        # Ensure crop box is within image bounds
        left = max(0, left)
        top = max(0, top)
        right = min(current_w, right)
        bottom = min(current_h, bottom)
        
        # Crop from center
        img_cropped = img.crop((left, top, right, bottom))
        
        # If cropped size is still not exact (edge case), resize
        if img_cropped.size != (target_w, target_h):
            img_cropped = img_cropped.resize((target_w, target_h), Image.LANCZOS)
        
        # Convert to base64
        buffer = BytesIO()
        img_cropped.save(buffer, format='PNG', quality=95, optimize=True)
        img_b64 = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'image_b64': f'data:image/png;base64,{img_b64}',
            'width': target_w,
            'height': target_h,
            'cropped_from': f'{current_w}x{current_h}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

