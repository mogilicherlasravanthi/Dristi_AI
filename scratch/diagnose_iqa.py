import os
import glob
import json
import cv2
import numpy as np

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from ml.image_quality import assess_image, assess_focus, assess_illumination, assess_field_of_view

def run_diagnostics():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_dir = os.path.join(project_root, "dataset", "prepared", "test")
    
    images = glob.glob(os.path.join(test_dir, "*", "*.png"))[:15]
    print(f"Found {len(images)} images in test set. Diagnosing IQA pipeline...\n")
    
    for idx, fpath in enumerate(images):
        img_bgr = cv2.imread(fpath)
        if img_bgr is None:
            continue
            
        h, w, c = img_bgr.shape
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Raw metrics
        raw_laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Masked metrics (only inside fundus region)
        _, mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
        mask_bool = mask > 0
        
        if np.sum(mask_bool) > 0:
            retinal_pixels = gray[mask_bool]
            fov_mean_bright = float(np.mean(retinal_pixels))
            fov_std_contrast = float(np.std(retinal_pixels))
            
            # Laplacian on bounding box of fundus mask
            y_indices, x_indices = np.where(mask_bool)
            ymin, ymax = np.min(y_indices), np.max(y_indices)
            xmin, xmax = np.min(x_indices), np.max(x_indices)
            crop_gray = gray[ymin:ymax+1, xmin:xmax+1]
            crop_laplacian_var = float(cv2.Laplacian(crop_gray, cv2.CV_64F).var())
        else:
            fov_mean_bright = 0.0
            fov_std_contrast = 0.0
            crop_laplacian_var = raw_laplacian_var
            
        res = assess_image(fpath)
        
        print(f"[{idx+1}] File: {os.path.basename(fpath)} (Dims: {w}x{h})")
        print(f"    Raw Laplacian Var (Whole Image): {raw_laplacian_var:.2f}")
        print(f"    Crop Laplacian Var (Fundus Box): {crop_laplacian_var:.2f}")
        print(f"    Whole Image Mean Brightness:    {res['metrics']['mean_brightness']}")
        print(f"    FOV Only Mean Brightness:        {fov_mean_bright:.2f}")
        print(f"    Focus Score:        {res['focus_score']}/100")
        print(f"    Illumination Score: {res['illumination_score']}/100")
        print(f"    FOV Score:          {res['field_of_view_score']}/100")
        print(f"    Overall Quality:    {res['quality_status']} ({res['quality_score']}/100)")
        print(f"    Enhancement:        Applied={res['enhancement_applied']}")
        print(f"    Reason:             {res['status_reason']}")
        print("-" * 65)

if __name__ == "__main__":
    run_diagnostics()
