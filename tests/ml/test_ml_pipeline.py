import os
import sys
import json
import unittest
import numpy as np
import cv2
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(PROJECT_ROOT, "ml"))

from image_quality import assess_image
from gradcam import GradCAM, generate_gradcam_visualizations
from inference import run_inference, load_dr_model
import evaluate

CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, "ml", "models", "dristi_efficientnet_b0_baseline.pth")
TEST_IMAGE_PATH = os.path.join(PROJECT_ROOT, "dataset", "prepared", "test", "Mild", "0369f3efe69b.png")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "ml", "reports", "gradcam_test")
EVAL_RESULTS_PATH = os.path.join(PROJECT_ROOT, "ml", "reports", "evaluation_results.json")


class TestPythonMLPipeline(unittest.TestCase):

    def setUp(self):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    def test_A_model_loading(self):
        """A. Model Loading Test"""
        self.assertTrue(os.path.exists(CHECKPOINT_PATH), f"Checkpoint missing at {CHECKPOINT_PATH}")
        model = load_dr_model()
        self.assertIsNotNone(model, "Failed to instantiate EfficientNet-B0 model")

        # Test dummy forward pass
        dummy_input = torch.randn(1, 3, 224, 224)
        with torch.no_grad():
            output = model(dummy_input)
        self.assertEqual(output.shape, (1, 5), f"Model output shape mismatch: {output.shape}")

    def test_B_image_loading(self):
        """B. Test Image Loading & Preprocessing Test"""
        self.assertTrue(os.path.exists(TEST_IMAGE_PATH), f"Test image missing at {TEST_IMAGE_PATH}")
        
        pil_img = Image.open(TEST_IMAGE_PATH)
        self.assertIsNotNone(pil_img, "Failed to open image using PIL")
        w, h = pil_img.size
        self.assertGreater(w, 0, "Image width must be > 0")
        self.assertGreater(h, 0, "Image height must be > 0")

        preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        tensor = preprocess(pil_img.convert('RGB')).unsqueeze(0)
        self.assertEqual(tensor.shape, (1, 3, 224, 224), "Preprocessed tensor shape invalid")

    def test_C_image_quality_assessment(self):
        """C. Image Quality Assessment Test"""
        res = assess_image(TEST_IMAGE_PATH)
        self.assertIn(res["quality_status"], ["GOOD", "BORDERLINE", "UNGRADABLE"])
        self.assertIsInstance(res["quality_score"], (int, float))
        self.assertGreaterEqual(res["quality_score"], 0.0)
        self.assertLessEqual(res["quality_score"], 100.0)

        metrics = res.get("metrics", {})
        self.assertIn("laplacian_var", metrics)
        self.assertIn("tenengrad_mean", metrics)
        self.assertIn("mean_brightness", metrics)
        self.assertIn("std_contrast", metrics)
        self.assertIn("fov_area_ratio", metrics)

        # Test synthetic dark/blurry image path (expects UNGRADABLE status)
        dark_img = np.zeros((300, 300, 3), dtype=np.uint8)
        dark_res = assess_image(dark_img)
        self.assertEqual(dark_res["quality_status"], "UNGRADABLE")
        self.assertTrue(dark_res["recapture_required"])

    def test_D_dr_classification(self):
        """D. DR Classification Test"""
        res = run_inference(TEST_IMAGE_PATH, patient_id="TEST_PT_01", output_dir=OUTPUT_DIR)
        self.assertTrue(res.get("success"), f"Inference failed with error: {res.get('error')}")

        predicted_level = res.get("predictedLevel")
        self.assertIsInstance(predicted_level, int)
        self.assertIn(predicted_level, [0, 1, 2, 3, 4], "Predicted level out of bounds [0-4]")

        probs = res.get("probabilities", {})
        self.assertEqual(len(probs), 5, "Expected 5-class probability dictionary")
        expected_classes = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]
        for cls in expected_classes:
            self.assertIn(cls, probs, f"Missing class '{cls}' in probabilities")
            val = probs[cls]
            self.assertIsInstance(val, (int, float))
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 100.0)

        prob_sum = sum(probs.values())
        self.assertAlmostEqual(prob_sum, 100.0, delta=1.5, msg="Probabilities sum should be approx 100%")

        confidence = res.get("confidence")
        self.assertIsInstance(confidence, (int, float))
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 100.0)

    def test_E_gradcam(self):
        """E. Grad-CAM Explainability Test"""
        model = load_dr_model()
        cam_res = generate_gradcam_visualizations(
            model=model,
            image_path=TEST_IMAGE_PATH,
            target_class_idx=1,
            output_dir=OUTPUT_DIR
        )

        heatmap_path = cam_res.get("heatmap_path")
        overlay_path = cam_res.get("overlay_path")

        self.assertTrue(os.path.exists(heatmap_path), f"Heatmap file missing: {heatmap_path}")
        self.assertTrue(os.path.exists(overlay_path), f"Overlay file missing: {overlay_path}")

        heatmap_img = cv2.imread(heatmap_path)
        overlay_img = cv2.imread(overlay_path)
        orig_img = cv2.imread(TEST_IMAGE_PATH)

        self.assertIsNotNone(heatmap_img, "Heatmap file unreadable by OpenCV")
        self.assertIsNotNone(overlay_img, "Overlay file unreadable by OpenCV")
        self.assertEqual(overlay_img.shape, orig_img.shape, "Overlay dimensions must match original image")

    def test_F_referral_logic(self):
        """F. Referral Logic Verification Test"""
        # Test Levels 0 & 1 -> ROUTINE
        res_mild = run_inference(TEST_IMAGE_PATH, patient_id="TEST_REF")
        if res_mild.get("predictedLevel") <= 1:
            self.assertEqual(res_mild.get("referralStatus"), "ROUTINE")

        # Test Ungradable -> RECAPTURE_REQUIRED
        dark_img = np.zeros((300, 300, 3), dtype=np.uint8)
        dark_path = os.path.join(OUTPUT_DIR, "synthetic_dark.png")
        cv2.imwrite(dark_path, dark_img)
        res_ungradable = run_inference(dark_path, patient_id="TEST_UNGRAD")
        self.assertEqual(res_ungradable.get("referralStatus"), "RECAPTURE_REQUIRED")
        self.assertEqual(res_ungradable.get("processingStatus"), "UNGRADABLE")

    def test_G_evaluation_script(self):
        """G. Evaluation Script Metric Calculation Test"""
        if os.path.exists(EVAL_RESULTS_PATH):
            with open(EVAL_RESULTS_PATH, 'r') as f:
                eval_res = json.load(f)
        else:
            eval_res = evaluate.evaluate_model()

        self.assertIsNotNone(eval_res, "Evaluation script returned None")
        self.assertIn("overall_accuracy", eval_res)
        self.assertIn("macro_f1", eval_res)
        self.assertIn("per_class_metrics", eval_res)
        self.assertIn("referable_dr_evaluation", eval_res)
        
        ref_eval = eval_res["referable_dr_evaluation"]
        self.assertIn("sensitivity", ref_eval)
        self.assertIn("specificity", ref_eval)


if __name__ == "__main__":
    unittest.main()
