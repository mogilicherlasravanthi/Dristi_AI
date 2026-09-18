# Experiment 001 — Baseline EfficientNet-B0 Diabetic Retinopathy Classifier (SIH26038)

## 1. Executive Summary
This document logs the official evaluation results of **Experiment 001**, the first baseline deep-learning model for **Dristi AI — Explainable AI for Diabetic Retinopathy Screening in Rural India (SIH26038)**. The model is an ImageNet-pretrained **EfficientNet-B0** transfer learning architecture trained on the prepared 5-class dataset to predict Diabetic Retinopathy (DR) severity (`No_DR`, `Mild`, `Moderate`, `Severe`, `Proliferate_DR`).

> [!NOTE]
> **Research / Prototype System Notice**:
> This model is an AI-assisted screening prototype intended for referral support and decision assistance. It is NOT a standalone clinical diagnostic device or medically approved software.

---

## 2. Experiment Setup & Parameters

| Hyperparameter / Setup | Value |
| :--- | :--- |
| **Model Architecture** | `EfficientNet-B0` (Pretrained ImageNet backbone + custom 5-class dropout head) |
| **Total Parameters** | `4,013,953` (~4.01 M) |
| **Stage 2 Trainable Parameters** | `2,752,581` (~2.75 M) |
| **Dataset Used** | Prepared 70/15/15 Stratified Retinal Dataset (`dataset/prepared/`) |
| **Input Resolution** | `224 x 224` pixels (RGB) |
| **Batch Size** | `32` |
| **Stage 1 (Head Training)** | 5 Epochs (Backbone Frozen, AdamW `lr=1e-3`) |
| **Stage 2 (Fine-Tuning)** | 10 Epochs (Upper Backbone `features[6:]` unfrozen, AdamW `lr=1e-4`, CosineAnnealingLR) |
| **Loss Function** | Weighted Cross-Entropy Loss (`weights = [0.406, 1.979, 0.733, 3.795, 2.483]`) |
| **Training Augmentations** | Random Horizontal Flip (50%), Random Rotation (±15°), Color Jitter (Brightness/Contrast ±10%) |
| **Validation / Test Preprocessing** | Deterministic Resize (`224x224`), ImageNet Normalization |
| **Training Time** | ~14.5 minutes (CPU Execution) |

---

## 3. Training & Validation Progression
The model was trained in two stages. Checkpoints were monitored via Validation Macro F1:

- **Stage 1 (Epochs 1–5)**: Classification head converged rapidly, reaching Val Accuracy `81.97%` and Val Macro F1 `0.7240`.
- **Stage 2 (Epochs 6–15)**: Fine-tuning upper feature blocks further boosted feature representations, achieving a peak **Best Validation Macro F1 of `0.7812`** at Epoch 14.

> [!TIP]
> Training and validation loss/accuracy curves are saved under [training_curves.png](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/reports/training_curves.png).

---

## 4. Final Evaluation Metrics (Test Set)

The test set (`550 images`) remained strictly untouched until final evaluation:

- **Overall Test Accuracy**: **89.45%** (492 / 550 correct predictions)
- **Macro F1-Score**: **0.8534**
- **Weighted F1-Score**: **0.8947**

### Per-Class Performance Breakdown

| Class Name | Precision | Recall (Sensitivity) | F1-Score | Support (Images) |
| :--- | :---: | :---: | :---: | :---: |
| **`Mild`** | `96.49%` | `98.21%` | `0.9735` | 56 |
| **`Moderate`** | `90.15%` | `79.33%` | `0.8440` | 150 |
| **`No_DR`** | `92.86%` | `95.94%` | `0.9437` | 271 |
| **`Proliferate_DR`** | `88.24%` | `68.18%` | `0.7692` | 44 |
| **`Severe`** | `59.57%` | `96.55%` | `0.7368` | 29 |

---

## 5. One-vs-Rest Sensitivity & Specificity

| Class Name | One-vs-Rest Sensitivity | One-vs-Rest Specificity |
| :--- | :---: | :---: |
| **`Mild`** | `98.21%` | `99.60%` |
| **`Moderate`** | `79.33%` | `96.75%` |
| **`No_DR`** | `95.94%` | `92.47%` |
| **`Proliferate_DR`** | `68.18%` | `99.21%` |
| **`Severe`** | `96.55%` | `96.35%` |

---

## 6. Referable DR Evaluation (SIH26038 Target Benchmark)

In clinical screening pipelines, **Referable DR** is defined as **Level 2 or above** (`Moderate`, `Severe`, `Proliferate_DR`). Patients with Level 2+ DR require referral to an ophthalmologist for specialist treatment.

### Referable DR Metrics vs SIH Target:

| Metric | Measured Baseline Value | Official SIH26038 Target Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Referable Sensitivity** | **90.13%** | **> 90.0%** | **PASS [EXCEEDED]** |
| **Referable Specificity** | **96.33%** | **> 85.0%** | **PASS [EXCEEDED]** |
| **Referable Precision** | **94.37%** | N/A | — |
| **Referable F1-Score** | **0.9220** | N/A | — |

> [!IMPORTANT]
> **SIH Target Assessment**: 
> The baseline EfficientNet-B0 model achieved **90.13% Referable Sensitivity** and **96.33% Referable Specificity**.
> **BOTH OFFICIAL SIH26038 BENCHMARKS HAVE BEEN MET SUCCESSFULLY** on the baseline test set!

---

## 7. Confusion Matrix Interpretation

The raw and normalized confusion matrix plots are saved under [confusion_matrix.png](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/reports/confusion_matrix.png).

### Key Performance Findings:
1. **High Referable Specificity (`96.33%`)**: Non-referable cases (`No_DR` and `Mild`) are correctly identified with extremely low false referral rates.
2. **High Referable Sensitivity (`90.13%`)**: Patient cases requiring referral are reliably captured for specialist attention.
3. **Primary Confusion Area**: Minor confusion occurs between adjacent severity grades (`Moderate` vs `Severe` / `Proliferate_DR`), which is clinically acceptable as both fall under referable care.

---

## 8. Saved Artifacts & Deliverables

- **Model Checkpoint**: [dristi_efficientnet_b0_baseline.pth](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/models/dristi_efficientnet_b0_baseline.pth)
- **Training Loss & Accuracy Curves**: [training_curves.png](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/reports/training_curves.png)
- **Confusion Matrix Visualization**: [confusion_matrix.png](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/reports/confusion_matrix.png)
- **Structured JSON Metrics**: [evaluation_results.json](file:///c:/Users/Sravanthi/OneDrive/Desktop/dristi-ai/ml/reports/evaluation_results.json)

---

## 9. Recommendations for Next Experiment (Experiment 002)

Having established a successful baseline meeting SIH targets:

1. **Higher Resolution Input (`384x384` or `512x512`)**:
   - Upgrade to higher resolution to boost distinction between fine adjacent grades (`Moderate` vs `Severe`).
2. **Retinal Feature Preprocessing (CLAHE)**:
   - Integrate Contrast Limited Adaptive Histogram Equalization (CLAHE) for illumination invariant feature extraction.
3. **Explainability Pipeline (Grad-CAM Integration)**:
   - Begin building the visual explanation layer (Grad-CAM heatmap overlay) to highlight retinal lesions (exudates, microaneurysms) for screening reports.
