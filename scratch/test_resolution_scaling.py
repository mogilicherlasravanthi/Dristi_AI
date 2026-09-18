import os
import glob
import cv2
import numpy as np

def assess_focus_hybrid(img_bgr, optimal_laplacian_var=150.0, optimal_tenengrad=40.0):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    _, mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    y_idx, x_idx = np.where(mask > 0)
    
    if len(y_idx) > 0:
        crop_gray = gray[np.min(y_idx):np.max(y_idx)+1, np.min(x_idx):np.max(x_idx)+1]
        crop_mask = mask[np.min(y_idx):np.max(y_idx)+1, np.min(x_idx):np.max(x_idx)+1]
    else:
        crop_gray = gray
        crop_mask = mask

    # 1. Variance of Laplacian on cropped retinal ROI
    laplacian_var = float(cv2.Laplacian(crop_gray, cv2.CV_64F).var())

    # 2. Tenengrad Gradient Magnitude on retinal pixels
    sobel_x = cv2.Sobel(crop_gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(crop_gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobel_x**2 + sobel_y**2)
    
    if np.sum(crop_mask > 0) > 0:
        tenengrad_mean = float(np.mean(sobel_mag[crop_mask > 0]))
    else:
        tenengrad_mean = float(np.mean(sobel_mag))

    # Scale scores
    score_lap = min(100.0, max(0.0, (laplacian_var / optimal_laplacian_var) * 100.0))
    score_ten = min(100.0, max(0.0, (tenengrad_mean / optimal_tenengrad) * 100.0))

    # Hybrid Focus Score takes the max of Laplacian & Tenengrad indicators
    focus_score = max(score_lap, score_ten)

    return {
        "focus_score": round(focus_score, 2),
        "laplacian_var": round(laplacian_var, 2),
        "tenengrad_mean": round(tenengrad_mean, 2)
    }

def main():
    test_paths = glob.glob("dataset/prepared/test/*/*.png")[:10]
    for p in test_paths:
        img = cv2.imread(p)
        res = assess_focus_hybrid(img)
        print(f"File: {os.path.basename(p):<15} -> Focus Score: {res['focus_score']:<6}/100 | LapVar: {res['laplacian_var']:<7} | Tenengrad: {res['tenengrad_mean']}")

if __name__ == "__main__":
    main()
