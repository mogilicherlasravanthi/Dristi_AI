import os
import sys
import json
import argparse
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0
from PIL import Image

# Import existing IQA & Grad-CAM modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from image_quality import assess_image
from gradcam import generate_gradcam_visualizations

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, "ml", "models", "dristi_efficientnet_b0_baseline.pth")

# Class mapping definitions
# PyTorch ImageFolder sorted folders alphabetically:
# 0: Mild, 1: Moderate, 2: No_DR, 3: Proliferate_DR, 4: Severe
IDX_TO_CLASS = {
    0: {"name": "Mild DR", "level": 1},
    1: {"name": "Moderate DR", "level": 2},
    2: {"name": "No DR", "level": 0},
    3: {"name": "Proliferative DR", "level": 4},
    4: {"name": "Severe DR", "level": 3}
}

def load_dr_model():
    model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, 5)
    )
    if os.path.exists(CHECKPOINT_PATH):
        model.load_state_dict(torch.load(CHECKPOINT_PATH, map_location="cpu"))
    else:
        raise FileNotFoundError(f"Checkpoint not found at: {CHECKPOINT_PATH}")
    model.eval()
    return model

def run_inference(image_path, patient_id="P-UNSPECIFIED", output_dir=None):
    if output_dir is None:
        output_dir = os.path.join(PROJECT_ROOT, "ml", "reports", "gradcam")
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image file not found: {image_path}"
        }

    # 1. Run Image Quality Assessment
    enhanced_path = os.path.join(output_dir, f"enhanced_{os.path.basename(image_path)}")
    iqa_result = assess_image(image_path, save_enhanced_path=enhanced_path)

    image_quality_data = {
        "status": iqa_result["quality_status"],
        "score": iqa_result["quality_score"],
        "focusScore": iqa_result["focus_score"],
        "illuminationScore": iqa_result["illumination_score"],
        "fovScore": iqa_result["field_of_view_score"],
        "metrics": iqa_result["metrics"],
        "reason": iqa_result["status_reason"],
        "enhancementApplied": iqa_result["enhancement_applied"],
        "recaptureRequired": iqa_result["recapture_required"]
    }

    # If UNGRADABLE, stop early and request recapture
    if iqa_result["quality_status"] == "UNGRADABLE":
        return {
            "success": True,
            "patientId": patient_id,
            "processingStatus": "UNGRADABLE",
            "imageQuality": image_quality_data,
            "predictedLevel": 0,
            "predictedClass": "Ungradable Quality",
            "confidence": 0.0,
            "probabilities": {
                "No DR": 0.0,
                "Mild DR": 0.0,
                "Moderate DR": 0.0,
                "Severe DR": 0.0,
                "Proliferative DR": 0.0
            },
            "referralStatus": "RECAPTURE_REQUIRED",
            "referralReason": iqa_result["status_reason"],
            "imagePath": image_path,
            "heatmapPath": None,
            "overlayPath": None
        }

    # Use enhanced image for classification if enhancement was applied
    target_img_path = iqa_result["enhanced_image_path"] if iqa_result["enhancement_applied"] and iqa_result["enhanced_image_path"] else image_path

    # 2. Run EfficientNet-B0 DR Classifier
    model = load_dr_model()

    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    pil_img = Image.open(target_img_path).convert('RGB')
    input_tensor = preprocess(pil_img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0].numpy()

    predicted_idx = int(np.argmax(probabilities))
    confidence_val = float(probabilities[predicted_idx] * 100.0)

    pred_info = IDX_TO_CLASS[predicted_idx]
    predicted_class = pred_info["name"]
    predicted_level = pred_info["level"]

    # Map raw indices to named probabilities dict
    prob_dict = {
        "No DR": round(float(probabilities[2] * 100.0), 2),
        "Mild DR": round(float(probabilities[0] * 100.0), 2),
        "Moderate DR": round(float(probabilities[1] * 100.0), 2),
        "Severe DR": round(float(probabilities[4] * 100.0), 2),
        "Proliferative DR": round(float(probabilities[3] * 100.0), 2)
    }

    # 3. Generate Grad-CAM Visualizations
    cam_result = generate_gradcam_visualizations(
        model=model,
        image_path=target_img_path,
        target_class_idx=predicted_idx,
        output_dir=output_dir
    )

    # 4. Compute Referral Support Logic
    # Referable DR = Moderate (2), Severe (3), Proliferative (4)
    if predicted_level >= 3:
        referral_status = "SPECIALIST_REVIEW"
        referral_reason = f"High Risk: Detected {predicted_class} (Level {predicted_level}). Urgent ophthalmology referral required."
    elif predicted_level == 2:
        referral_status = "REFERRAL_RECOMMENDED"
        referral_reason = f"Moderate Risk: Detected {predicted_class} (Level {predicted_level}). Routine ophthalmology referral recommended within 1 month."
    else:
        referral_status = "ROUTINE"
        referral_reason = f"Low Risk: Detected {predicted_class} (Level {predicted_level}). Routine annual follow-up screening recommended."

    return {
        "success": True,
        "patientId": patient_id,
        "processingStatus": "COMPLETED",
        "imageQuality": image_quality_data,
        "predictedLevel": predicted_level,
        "predictedClass": predicted_class,
        "confidence": round(confidence_val, 2),
        "probabilities": prob_dict,
        "referralStatus": referral_status,
        "referralReason": referral_reason,
        "imagePath": target_img_path,
        "heatmapPath": cam_result["heatmap_path"],
        "overlayPath": cam_result["overlay_path"]
    }

def main():
    parser = argparse.ArgumentParser(description="Dristi AI — End-to-End AI Inference Pipeline (SIH26038)")
    parser.add_argument("--image", type=str, required=True, help="Path to fundus image file")
    parser.add_argument("--patient-id", type=str, default="P-UNSPECIFIED", help="Patient ID")
    parser.add_argument("--output-dir", type=str, default=None, help="Output directory for Grad-CAM overlays")

    args = parser.parse_args()

    try:
        res = run_inference(args.image, patient_id=args.patient_id, output_dir=args.output_dir)
        # Output clean JSON to stdout
        print(json.dumps(res, indent=2))
    except Exception as e:
        err_res = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(err_res, indent=2), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
