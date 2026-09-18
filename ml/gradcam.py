import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image

class GradCAM:
    """
    Grad-CAM (Gradient-weighted Class Activation Mapping) for PyTorch EfficientNet-B0.
    Calculates neural activation heatmaps explaining model focus for a target predicted class.
    """
    def __init__(self, model, target_layer=None):
        self.model = model
        self.model.eval()

        # Target last convolutional block in EfficientNet-B0 (model.features[-1])
        if target_layer is None:
            self.target_layer = self.model.features[-1]
        else:
            self.target_layer = target_layer

        self.gradients = None
        self.activations = None

        # Register forward and backward hooks
        self.target_layer.register_forward_hook(self._save_activations)
        self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_heatmap(self, input_tensor, target_class_idx=None):
        """Generate normalized [0, 1] 2D Grad-CAM heatmap array."""
        self.model.zero_grad()
        output = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = torch.argmax(output, dim=1).item()

        one_hot = torch.zeros_like(output)
        one_hot[0][target_class_idx] = 1.0

        # Backward pass to compute feature gradients
        output.backward(gradient=one_hot, retain_graph=True)

        gradients = self.gradients[0].cpu().numpy()  # Shape: (C, H, W)
        activations = self.activations[0].cpu().numpy()  # Shape: (C, H, W)

        # Global average pooling of gradients per channel (weights alpha_k)
        weights = np.mean(gradients, axis=(1, 2))  # Shape: (C,)

        # Weighted combination of forward activation maps
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        # Apply ReLU activation (only positive contributions)
        cam = np.maximum(cam, 0)

        # Normalize to [0, 1]
        if np.max(cam) > 0:
            cam = cam / np.max(cam)
        else:
            cam = np.zeros_like(cam)

        return cam, target_class_idx


def generate_gradcam_visualizations(model, image_path, target_class_idx=None, output_dir=None, img_size=224):
    """
    Generate and save Grad-CAM heatmap and blended overlay images.
    
    Returns:
    dict: { "heatmap_path": str, "overlay_path": str }
    """
    if output_dir is None:
        PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(PROJECT_ROOT, "ml", "reports", "gradcam")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load Original Image (BGR & RGB)
    orig_bgr = cv2.imread(image_path)
    if orig_bgr is None:
        raise FileNotFoundError(f"Image not found for Grad-CAM at path: {image_path}")

    orig_h, orig_w = orig_bgr.shape[:2]
    orig_rgb = cv2.cvtColor(orig_bgr, cv2.COLOR_BGR2RGB)

    # 2. Preprocess Tensor
    preprocess = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    pil_img = Image.open(image_path).convert('RGB')
    input_tensor = preprocess(pil_img).unsqueeze(0)

    # 3. Generate Heatmap Matrix
    grad_cam = GradCAM(model)
    cam, predicted_idx = grad_cam.generate_heatmap(input_tensor, target_class_idx=target_class_idx)

    # 4. Upsample Heatmap to Original Resolution
    cam_resized = cv2.resize(cam, (orig_w, orig_h))
    cam_uint8 = np.uint8(255 * cam_resized)

    # 5. Apply Jet Color Mapping
    heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    # 6. Create Blended Overlay (50% Original + 50% Heatmap)
    overlay_bgr = cv2.addWeighted(orig_bgr, 0.55, heatmap_bgr, 0.45, 0)

    # Save Output Images
    filename = os.path.splitext(os.path.basename(image_path))[0]
    heatmap_file = os.path.join(output_dir, f"{filename}_heatmap.png")
    overlay_file = os.path.join(output_dir, f"{filename}_overlay.png")

    cv2.imwrite(heatmap_file, heatmap_bgr)
    cv2.imwrite(overlay_file, overlay_bgr)

    return {
        "heatmap_path": heatmap_file,
        "overlay_path": overlay_file,
        "predicted_class_idx": predicted_idx
    }

if __name__ == "__main__":
    from torchvision.models import efficientnet_b0
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, "ml", "models", "dristi_efficientnet_b0_baseline.pth")
    TEST_IMAGE_PATH = os.path.join(PROJECT_ROOT, "dataset", "prepared", "test", "Mild", "0369f3efe69b.png")

    print("Testing Grad-CAM Module...")
    model = efficientnet_b0(weights=None)
    model.classifier = nn.Sequential(nn.Dropout(p=0.3), nn.Linear(1280, 5))
    if os.path.exists(CHECKPOINT_PATH):
        model.load_state_dict(torch.load(CHECKPOINT_PATH, map_location="cpu"))
        print(f"Loaded checkpoint from {CHECKPOINT_PATH}")

    res = generate_gradcam_visualizations(model, TEST_IMAGE_PATH)
    print(f"Grad-CAM execution successful! Output files:")
    print(f"  Heatmap: {res['heatmap_path']}")
    print(f"  Overlay: {res['overlay_path']}")
