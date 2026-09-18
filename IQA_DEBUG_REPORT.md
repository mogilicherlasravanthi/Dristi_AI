# Dristi AI — Image Quality Assessment (IQA) Debug & Verification Report

**Date**: 2026-09-17  
**Problem Statement**: SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India  

---

## 1. Executive Summary & Root Cause Diagnosis

During testing of the **Dristi AI** Image Quality Assessment (IQA) module, usable fundus photographs were receiving `UNGRADABLE` status (composite score `67.62/100`, Focus Score `19.1/100`), while the UI displayed `N/A` for all three raw metrics (`Laplacian Var`, `Mean Luminance`, `Retinal Area`).

Two distinct root causes were identified through empirical code tracing and diagnostic scripting:

### Root Cause 1: Property Key Naming Mismatch (`N/A` Metrics in React UI)
- **Python Output**: `ml/image_quality.py` returned metrics dictionary with **snake_case** keys (`laplacian_var`, `mean_brightness`, `fov_area_ratio`).
- **React UI Expectation**: `QualityResult.jsx` dereferenced **camelCase** keys (`metrics?.laplacianVar`, `metrics?.meanBrightness`, `metrics?.fovAreaRatio`).
- **Impact**: React evaluated these properties as `undefined`, displaying `'N/A'` across all three metric indicators.

### Root Cause 2: Un-normalized Spatial Scale Derivative Collapse
- **Mathematical Cause**: OpenCV `cv2.Laplacian` measures second-order pixel intensity differences ($\frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}$). On high-resolution fundus images (512x512, 1024x1024, 2048x2048), pixel intensity transitions across blood vessel edges are distributed over larger spatial pixel distances, causing un-normalized raw Laplacian variance to collapse from `~135.0` (at 64x64) down to `~0.9 - 1.7` (at 1024x1024).
- **Background Padding Distortion**: Calculating variance and mean luminance across the entire un-masked image included 40-50% pitch-black background padding pixels (`0` intensity value), which diluted focus variance and pulled down mean brightness.

---

## 2. Before vs After Empirical Comparison

| Metric / Dimension | Before Fix (High-Res Image) | After Fix (Scale-Invariant & Masked ROI) |
| :--- | :---: | :---: |
| **Laplacian Var Display** | `N/A` | `275.46` (Numeric Value Displayed) |
| **Mean Luminance Display** | `N/A` | `88.20` (Numeric Value Displayed) |
| **Retinal FOV Area Display** | `N/A` | `74.1%` (Numeric Percentage Displayed) |
| **Sharpness / Focus Score** | `19.10 / 100` (`UNGRADABLE`) | **`85.50 / 100`** (`GOOD`) |
| **Illumination Score** | `68.20 / 100` | **`100.0 / 100`** (`GOOD`) |
| **Composite Quality Score** | `67.62 / 100` (`UNGRADABLE`) | **`91.80 / 100`** (**`GOOD`**) |
| **Enhancement Status** | Failed Re-check (`Enhanced: 67.62`) | `Not Required` (Meets Quality Gate) |

---

## 3. Code Modifications Made

1. **`ml/image_quality.py`**:
   - Updated `assess_focus`: Standardizes feature extraction scale to `512x512` and computes Laplacian variance and Tenengrad Sobel gradient specifically on the cropped fundus ROI bounding box.
   - Updated `assess_illumination`: Computes mean brightness and contrast standard deviation strictly on pixels inside the retinal FOV mask (`gray[mask > 0]`).
   - Updated `metrics` payload in `assess_image`: Provides dual camelCase and snake_case properties (`laplacianVar` & `laplacian_var`, `meanBrightness` & `mean_brightness`, `fovAreaRatio` & `fov_area_ratio`).

2. **`frontend/src/components/QualityResult.jsx`**:
   - Added dual property key dereferencing (`metrics?.laplacianVar ?? metrics?.laplacian_var ?? 'N/A'`) so historical or live records with either casing format render numeric values cleanly.

3. **`frontend/src/services/api.js`**:
   - Verified quality object mapping extracts `laplacianVar`, `meanBrightness`, and `fovAreaRatio` into the React component state.

---

## 4. Verification & Regression Test Results

- **Scale Invariance Test**: Executed `scratch/test_resolution_scaling.py` across synthetic resolutions (64x64, 224x224, 512x512, 1024x1024, 2048x2048). Focus score remained stable ($\sim 85-91/100$) regardless of image resolution.
- **Discriminative Quality Test**: Verified that lower-quality / blurred test images (`09935d72892b.png`) receive lower scores (`26.1/100` Focus) and trigger CLAHE enhancement or recapture alerts, while sharp fundus photos pass cleanly.
- **Full Automated System Test Suite**: Executed `python run_tests.py`:
  - **TOTAL TESTS**: `17`
  - **PASS**: `17` (**100% PASS Rate**)
  - **FAIL**: `0`
  - **BLOCKED**: `0`

---

## 5. Clinical Threshold Statement

> [!IMPORTANT]
> **Clinical Quality Thresholds Unchanged**:
> Clinical quality thresholds were **NOT** lowered to force images to pass (`GOOD >= 70.0`, `BORDERLINE >= 45.0`). The issue was resolved by fixing spatial scale derivative standardization, fundus ROI background masking, and frontend property key alignment.
