import os
import sys
import json
import cv2
import numpy as np
import torch
from PIL import Image

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(PROJECT_ROOT, "ml"))

from inference import load_dr_model, IDX_TO_CLASS
from image_quality import assess_image, enhance_borderline_image
from gradcam import GradCAM
from torchvision import transforms

def diagnose(image_path):
    print(f"\n==================================================")
    print(f"DIAGNOSING EXTERNAL IMAGE: {os.path.basename(image_path)}")
    print(f"==================================================")

    model = load_dr_model()
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 1. Image metadata
    img_bgr = cv2.imread(image_path)
    h, w, c = img_bgr.shape
    print(f"Image Resolution: {w}x{h} ({c} channels)")
    print(f"Mean BGR: B={img_bgr[:,:,0].mean():.1f}, G={img_bgr[:,:,1].mean():.1f}, R={img_bgr[:,:,2].mean():.1f}")
    
    # Check black border percentage
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    black_pixels = np.sum(gray < 15)
    total_pixels = gray.size
    border_pct = (black_pixels / total_pixels) * 100
    print(f"Black Background Percentage: {border_pct:.2f}%")

    # 2. IQA assessment
    iqa_res = assess_image(image_path)
    print(f"IQA Status: {iqa_res['quality_status']} | Score: {iqa_res['quality_score']} | Enhancement Applied: {iqa_res['enhancement_applied']}")

    # 3. Prediction A: Raw Original Image (no CLAHE, direct)
    pil_raw = Image.open(image_path).convert('RGB')
    tensor_raw = preprocess(pil_raw).unsqueeze(0)
    with torch.no_grad():
        out_raw = model(tensor_raw)
        prob_raw = torch.softmax(out_raw, dim=1)[0].numpy()

    idx_raw = int(np.argmax(prob_raw))
    print("\n--- A. RAW ORIGINAL IMAGE INFERENCE ---")
    print(f"Predicted Class: {IDX_TO_CLASS[idx_raw]['name']} (Level {IDX_TO_CLASS[idx_raw]['level']})")
    print(f"Confidence: {prob_raw[idx_raw]*100:.2f}%")
    for idx, name_info in IDX_TO_CLASS.items():
        print(f"  {name_info['name']} (Level {name_info['level']}): {prob_raw[idx]*100:.2f}%")

    # 4. Prediction B: CLAHE Enhanced Image (if IQA applies it)
    enhanced_bgr = enhance_borderline_image(img_bgr)
    pil_enh = Image.fromarray(cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB))
    tensor_enh = preprocess(pil_enh).unsqueeze(0)
    with torch.no_grad():
        out_enh = model(tensor_enh)
        prob_enh = torch.softmax(out_enh, dim=1)[0].numpy()

    idx_enh = int(np.argmax(prob_enh))
    print("\n--- B. CLAHE ENHANCED IMAGE INFERENCE ---")
    print(f"Predicted Class: {IDX_TO_CLASS[idx_enh]['name']} (Level {IDX_TO_CLASS[idx_enh]['level']})")
    print(f"Confidence: {prob_enh[idx_enh]*100:.2f}%")
    for idx, name_info in IDX_TO_CLASS.items():
        print(f"  {name_info['name']} (Level {name_info['level']}): {prob_enh[idx]*100:.2f}%")

    # 5. Prediction C: Tight Retinal Crop (remove outer black border)
    y_indices, x_indices = np.where(gray >= 15)
    if len(y_indices) > 0:
        ymin, ymax = y_indices.min(), y_indices.max()
        xmin, xmax = x_indices.min(), x_indices.max()
        crop_bgr = img_bgr[ymin:ymax+1, xmin:xmax+1]
    else:
        crop_bgr = img_bgr

    pil_crop = Image.fromarray(cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB))
    tensor_crop = preprocess(pil_crop).unsqueeze(0)
    with torch.no_grad():
        out_crop = model(tensor_crop)
        prob_crop = torch.softmax(out_crop, dim=1)[0].numpy()

    idx_crop = int(np.argmax(prob_crop))
    print("\n--- C. CROPPED RETINAL REGION INFERENCE ---")
    print(f"Crop Size: {crop_bgr.shape[1]}x{crop_bgr.shape[0]}")
    print(f"Predicted Class: {IDX_TO_CLASS[idx_crop]['name']} (Level {IDX_TO_CLASS[idx_crop]['level']})")
    print(f"Confidence: {prob_crop[idx_crop]*100:.2f}%")
    for idx, name_info in IDX_TO_CLASS.items():
        print(f"  {name_info['name']} (Level {name_info['level']}): {prob_crop[idx]*100:.2f}%")

    # 6. Grad-CAM Analysis on Raw & Enhanced
    grad_cam = GradCAM(model)
    cam_raw, _ = grad_cam.generate_heatmap(tensor_raw, target_class_idx=3) # Target Proliferative DR (index 3)
    
    # Check max activation location on Grad-CAM grid (7x7 in EfficientNet-B0)
    max_h, max_w = np.unravel_index(np.argmax(cam_raw), cam_raw.shape)
    print(f"\n--- GRAD-CAM ANALYSIS (Target: Proliferative DR) ---")
    print(f"Heatmap Peak Coordinates (7x7 feature map): row={max_h}, col={max_w}")
    print(f"Heatmap Intensity Min: {cam_raw.min():.4f}, Max: {cam_raw.max():.4f}, Mean: {cam_raw.mean():.4f}")

    # Check activation on border vs center tissue
    # Rescale cam_raw to orig image shape
    cam_resized = cv2.resize(cam_raw, (w, h))
    bg_mask = (gray < 15)
    tissue_mask = (gray >= 15)
    
    bg_activation = cam_resized[bg_mask].mean() if np.sum(bg_mask) > 0 else 0
    tissue_activation = cam_resized[tissue_mask].mean() if np.sum(tissue_mask) > 0 else 0
    print(f"Mean Grad-CAM Activation on Black Background: {bg_activation:.4f}")
    print(f"Mean Grad-CAM Activation on Retinal Tissue:     {tissue_activation:.4f}")

if __name__ == "__main__":
    ext_1 = os.path.join(PROJECT_ROOT, "backend", "uploads", "fundus-1789582339392-428603557.jpg")
    ext_2 = os.path.join(PROJECT_ROOT, "backend", "uploads", "fundus-1789612807371-139349260.jpeg")
    diagnose(ext_1)
    if os.path.exists(ext_2):
        diagnose(ext_2)
