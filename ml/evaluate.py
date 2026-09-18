import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import efficientnet_b0
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_DIR = os.path.join(PROJECT_ROOT, "dataset", "prepared", "test")
MODELS_DIR = os.path.join(PROJECT_ROOT, "ml", "models")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "ml", "reports")

CHECKPOINT_PATH = os.path.join(MODELS_DIR, "dristi_efficientnet_b0_baseline.pth")
CONFUSION_MATRIX_PATH = os.path.join(REPORTS_DIR, "confusion_matrix.png")
EVAL_RESULTS_PATH = os.path.join(REPORTS_DIR, "evaluation_results.json")

IMG_SIZE = 224
BATCH_SIZE = 32

def build_model(num_classes=5):
    model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    return model

def plot_confusion_matrices(cm, classes, save_path):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    cm_norm = np.nan_to_num(cm_norm)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # Raw counts
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes, ax=ax1, cbar=False)
    ax1.set_title('Raw Confusion Matrix', fontsize=14, fontweight='bold')
    ax1.set_xlabel('Predicted Label', fontsize=12)
    ax1.set_ylabel('True Label', fontsize=12)

    # Normalized percentages
    sns.heatmap(cm_norm, annot=True, fmt='.2%', cmap='Greens', xticklabels=classes, yticklabels=classes, ax=ax2, cbar=False)
    ax2.set_title('Normalized Confusion Matrix', fontsize=14, fontweight='bold')
    ax2.set_xlabel('Predicted Label', fontsize=12)
    ax2.set_ylabel('True Label', fontsize=12)

    plt.suptitle('Dristi AI — EfficientNet-B0 Baseline Test Confusion Matrix', fontsize=16, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved confusion matrix plot to {save_path}")

def evaluate_model():
    print("=" * 60)
    print("EVALUATING DRISTI AI BASELINE MODEL ON TEST SET")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    if not os.path.exists(CHECKPOINT_PATH):
        print(f"Error: Model checkpoint not found at {CHECKPOINT_PATH}")
        sys.exit(1)

    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_dataset = datasets.ImageFolder(TEST_DIR, transform=val_transform)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    classes = test_dataset.classes  # ['Mild', 'Moderate', 'No_DR', 'Proliferate_DR', 'Severe']
    class_to_idx = test_dataset.class_to_idx

    print(f"Loaded Test Dataset: {len(test_dataset)} images")
    print(f"Class Mapping: {class_to_idx}")

    # Referable DR = Moderate (Level 2), Severe (Level 3), Proliferate_DR (Level 4)
    referable_indices = [class_to_idx[c] for c in ['Moderate', 'Severe', 'Proliferate_DR'] if c in class_to_idx]

    model = build_model(num_classes=len(classes)).to(device)
    model.load_state_dict(torch.load(CHECKPOINT_PATH, map_location=device))
    model.eval()

    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)

    # 1. Overall Metrics
    acc = accuracy_score(y_true, y_pred)
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='macro', zero_division=0)
    w_p, w_r, w_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=0)

    # 2. Per-Class Metrics
    precisions, recalls, f1s, supports = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(classes))))

    per_class_metrics = {}
    ovr_metrics = {}

    for idx, cls_name in enumerate(classes):
        tp = cm[idx, idx]
        fn = cm[idx, :].sum() - tp
        fp = cm[:, idx].sum() - tp
        tn = cm.sum() - (tp + fn + fp)

        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

        per_class_metrics[cls_name] = {
            "precision": float(precisions[idx]),
            "recall": float(recalls[idx]),
            "f1_score": float(f1s[idx]),
            "support": int(supports[idx])
        }

        ovr_metrics[cls_name] = {
            "sensitivity": float(sensitivity),
            "specificity": float(specificity),
            "tp": int(tp), "fn": int(fn), "fp": int(fp), "tn": int(tn)
        }

    # 3. Referable DR Evaluation (Level 2+ = Moderate, Severe, Proliferate_DR)
    ref_true = np.isin(y_true, referable_indices).astype(int)
    ref_pred = np.isin(y_pred, referable_indices).astype(int)

    ref_tp = int(np.sum((ref_true == 1) & (ref_pred == 1)))
    ref_fn = int(np.sum((ref_true == 1) & (ref_pred == 0)))
    ref_fp = int(np.sum((ref_true == 0) & (ref_pred == 1)))
    ref_tn = int(np.sum((ref_true == 0) & (ref_pred == 0)))

    ref_sensitivity = ref_tp / (ref_tp + ref_fn) if (ref_tp + ref_fn) > 0 else 0.0
    ref_specificity = ref_tn / (ref_tn + ref_fp) if (ref_tn + ref_fp) > 0 else 0.0
    ref_precision = ref_tp / (ref_tp + ref_fp) if (ref_tp + ref_fp) > 0 else 0.0
    ref_recall = ref_sensitivity
    ref_f1 = 2 * ref_precision * ref_recall / (ref_precision + ref_recall) if (ref_precision + ref_recall) > 0 else 0.0

    sih_target_achieved = (ref_sensitivity > 0.90) and (ref_specificity > 0.85)

    results = {
        "overall_accuracy": float(acc),
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1": float(macro_f1),
        "weighted_precision": float(w_p),
        "weighted_recall": float(w_r),
        "weighted_f1": float(w_f1),
        "per_class_metrics": per_class_metrics,
        "one_vs_rest_metrics": ovr_metrics,
        "referable_dr_evaluation": {
            "referable_definition": "Level 2 or above (Moderate, Severe, Proliferate_DR)",
            "sensitivity": float(ref_sensitivity),
            "specificity": float(ref_specificity),
            "precision": float(ref_precision),
            "recall": float(ref_recall),
            "f1_score": float(ref_f1),
            "confusion_matrix": {
                "tp": ref_tp, "fn": ref_fn, "fp": ref_fp, "tn": ref_tn
            },
            "sih_target_benchmarks": {
                "sensitivity_target": "> 90%",
                "specificity_target": "> 85%",
                "sih_target_met": sih_target_achieved
            }
        },
        "raw_confusion_matrix": cm.tolist()
    }

    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(EVAL_RESULTS_PATH, 'w') as f:
        json.dump(results, f, indent=4)
    print(f"Saved evaluation metrics JSON to {EVAL_RESULTS_PATH}")

    plot_confusion_matrices(cm, classes, CONFUSION_MATRIX_PATH)

    print("\n" + "=" * 60)
    print("FINAL EVALUATION METRICS ON TEST SET")
    print("=" * 60)
    print(f"Overall Test Accuracy: {acc * 100:.2f}%")
    print(f"Macro F1 Score:       {macro_f1:.4f}")
    print(f"Weighted F1 Score:    {w_f1:.4f}\n")

    print("Per-Class Metrics Table:")
    print(f"{'Class':<15} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 62)
    for cls_name in classes:
        m = per_class_metrics[cls_name]
        print(f"{cls_name:<15} | {m['precision']:<10.4f} | {m['recall']:<10.4f} | {m['f1_score']:<10.4f} | {m['support']:<8}")

    print("\n" + "=" * 60)
    print("REFERABLE DR EVALUATION (LEVEL 2+ MODERATE / SEVERE / PROLIFERATIVE)")
    print("=" * 60)
    print(f"Referable Sensitivity: {ref_sensitivity * 100:.2f}% (SIH Target: >90%)")
    print(f"Referable Specificity: {ref_specificity * 100:.2f}% (SIH Target: >85%)")
    print(f"Referable Precision:   {ref_precision * 100:.2f}%")
    print(f"Referable F1 Score:    {ref_f1:.4f}")
    print(f"SIH26038 Target Met:   {'YES [PASS]' if sih_target_achieved else 'NO [FAIL]'}")
    print("=" * 60)

    return results

if __name__ == "__main__":
    evaluate_model()
