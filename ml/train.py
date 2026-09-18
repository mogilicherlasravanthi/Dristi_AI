import os
import sys
import time
import json
import random
import copy
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

# 1. Configuration & Constants
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_DIR = os.path.join(PROJECT_ROOT, "dataset", "prepared", "train")
VAL_DIR = os.path.join(PROJECT_ROOT, "dataset", "prepared", "validation")
MODELS_DIR = os.path.join(PROJECT_ROOT, "ml", "models")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "ml", "reports")

CHECKPOINT_PATH = os.path.join(MODELS_DIR, "dristi_efficientnet_b0_baseline.pth")
CURVES_PLOT_PATH = os.path.join(REPORTS_DIR, "training_curves.png")

RANDOM_SEED = 42
IMG_SIZE = 224
BATCH_SIZE = 32
NUM_CLASSES = 5
STAGE1_EPOCHS = 5
STAGE2_EPOCHS = 10

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform

def build_model(num_classes=5):
    weights = EfficientNet_B0_Weights.DEFAULT
    model = efficientnet_b0(weights=weights)
    
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    return model

def freeze_backbone(model):
    for param in model.features.parameters():
        param.requires_grad = False

def unfreeze_upper_layers(model):
    # Freeze initial feature blocks, unfreeze upper blocks (features[6:]) and classifier
    for param in model.features[:6].parameters():
        param.requires_grad = False
    for param in model.features[6:].parameters():
        param.requires_grad = True
    for param in model.classifier.parameters():
        param.requires_grad = True

def compute_class_weights(train_dataset, device):
    class_counts = np.bincount(train_dataset.targets)
    total_samples = len(train_dataset)
    num_classes = len(class_counts)
    
    weights = total_samples / (num_classes * class_counts.astype(np.float32))
    weights = weights / weights.sum() * num_classes  # Normalize so mean=1
    print("Computed Training Class Weights:", {cls: round(w, 4) for cls, w in zip(train_dataset.classes, weights)})
    return torch.tensor(weights, dtype=torch.float32).to(device)

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []

    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_acc = accuracy_score(all_labels, all_preds)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    return epoch_loss, epoch_acc, epoch_f1

@torch.no_grad()
def evaluate_epoch(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []

    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)

        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_acc = accuracy_score(all_labels, all_preds)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    return epoch_loss, epoch_acc, epoch_f1

def plot_training_curves(history, save_path):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    epochs = range(1, len(history['train_loss']) + 1)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Loss curve
    ax1.plot(epochs, history['train_loss'], 'b-o', label='Train Loss')
    ax1.plot(epochs, history['val_loss'], 'r-s', label='Val Loss')
    ax1.axvline(x=STAGE1_EPOCHS, color='gray', linestyle='--', label='Stage 2 Unfreeze')
    ax1.set_title('Training & Validation Loss', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Epochs')
    ax1.set_ylabel('Loss')
    ax1.legend()
    ax1.grid(True, linestyle='--', alpha=0.5)

    # Accuracy curve
    ax2.plot(epochs, history['train_acc'], 'b-o', label='Train Acc')
    ax2.plot(epochs, history['val_acc'], 'r-s', label='Val Acc')
    ax2.axvline(x=STAGE1_EPOCHS, color='gray', linestyle='--', label='Stage 2 Unfreeze')
    ax2.set_title('Training & Validation Accuracy', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Epochs')
    ax2.set_ylabel('Accuracy')
    ax2.legend()
    ax2.grid(True, linestyle='--', alpha=0.5)

    plt.suptitle('Dristi AI — Baseline EfficientNet-B0 Training Curves', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved training curves plot to {save_path}")

def main():
    set_seed(RANDOM_SEED)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    train_transform, val_transform = get_transforms()

    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_transform)

    print(f"Loaded Train dataset: {len(train_dataset)} images across classes: {train_dataset.classes}")
    print(f"Loaded Val dataset: {len(val_dataset)} images")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    class_weights = compute_class_weights(train_dataset, device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    model = build_model(num_classes=NUM_CLASSES).to(device)

    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total Model Parameters: {total_params:,} | Trainable: {trainable_params:,}")

    history = {
        'train_loss': [], 'val_loss': [],
        'train_acc': [], 'val_acc': [],
        'val_macro_f1': []
    }

    best_val_f1 = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())
    start_time = time.time()

    # ==========================================
    # STAGE 1: Train Classification Head Only
    # ==========================================
    print("\n" + "="*60)
    print("STAGE 1: TRAINING CLASSIFICATION HEAD (BACKBONE FROZEN)")
    print("="*60)
    freeze_backbone(model)
    optimizer = optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-2)

    for epoch in range(1, STAGE1_EPOCHS + 1):
        t0 = time.time()
        tr_loss, tr_acc, tr_f1 = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_f1 = evaluate_epoch(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        history['train_loss'].append(tr_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(tr_acc)
        history['val_acc'].append(val_acc)
        history['val_macro_f1'].append(val_f1)

        print(f"Epoch {epoch:02d}/{STAGE1_EPOCHS:02d} [{elapsed:.1f}s] - "
              f"Train Loss: {tr_loss:.4f} | Acc: {tr_acc:.4f} | "
              f"Val Loss: {val_loss:.4f} | Acc: {val_acc:.4f} | Macro F1: {val_f1:.4f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_model_weights = copy.deepcopy(model.state_dict())
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            print(f"  --> Checkpoint saved! New Best Val Macro F1: {val_f1:.4f}")

    # ==========================================
    # STAGE 2: Controlled Fine-Tuning of Upper Layers
    # ==========================================
    print("\n" + "="*60)
    print("STAGE 2: CONTROLLED FINE-TUNING (UPPER BACKBONE LAYERS UNFROZEN)")
    print("="*60)
    unfreeze_upper_layers(model)
    
    # Trainable parameters after unfreezing
    trainable_params_stage2 = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Stage 2 Trainable Parameters: {trainable_params_stage2:,}")

    optimizer_ft = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-2)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer_ft, T_max=STAGE2_EPOCHS, eta_min=1e-6)

    for epoch in range(1, STAGE2_EPOCHS + 1):
        t0 = time.time()
        tr_loss, tr_acc, tr_f1 = train_one_epoch(model, train_loader, criterion, optimizer_ft, device)
        val_loss, val_acc, val_f1 = evaluate_epoch(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0

        total_epoch_num = STAGE1_EPOCHS + epoch
        history['train_loss'].append(tr_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(tr_acc)
        history['val_acc'].append(val_acc)
        history['val_macro_f1'].append(val_f1)

        print(f"Epoch {total_epoch_num:02d}/{STAGE1_EPOCHS + STAGE2_EPOCHS:02d} (FT {epoch:02d}) [{elapsed:.1f}s] - "
              f"Train Loss: {tr_loss:.4f} | Acc: {tr_acc:.4f} | "
              f"Val Loss: {val_loss:.4f} | Acc: {val_acc:.4f} | Macro F1: {val_f1:.4f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_model_weights = copy.deepcopy(model.state_dict())
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            print(f"  --> Checkpoint saved! New Best Val Macro F1: {val_f1:.4f}")

    total_training_time = time.time() - start_time
    print("\n" + "="*60)
    print(f"TRAINING COMPLETE in {total_training_time/60:.2f} minutes")
    print(f"Best Validation Macro F1: {best_val_f1:.4f}")
    print(f"Best model checkpoint saved to: {CHECKPOINT_PATH}")
    print("="*60)

    plot_training_curves(history, CURVES_PLOT_PATH)

    # Return summary dict for evaluation script usage
    summary = {
        "total_training_time_sec": total_training_time,
        "total_parameters": total_params,
        "trainable_parameters_stage2": trainable_params_stage2,
        "best_val_macro_f1": best_val_f1,
        "checkpoint_path": CHECKPOINT_PATH
    }
    with open(os.path.join(REPORTS_DIR, "training_summary.json"), 'w') as f:
        json.dump(summary, f, indent=4)

if __name__ == "__main__":
    main()
