#!/usr/bin/env python3
"""
Dristi AI — Environment & Package Verification Script
Problem Statement: SIH26038 (Explainable AI for Diabetic Retinopathy Screening)

Verifies Python installation, core machine-learning package imports,
PyTorch tensor initialization, and CUDA GPU device availability.
"""

import sys
import os

# Ensure UTF-8 output encoding for Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def print_header(title):
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)

def main():
    print_header("DRISTI AI -- PYTHON ENVIRONMENT VERIFICATION")
    
    # 1. Python Version
    python_ver = sys.version.split()[0]
    print(f"Python Version          : {python_ver}")
    print(f"Executable Path        : {sys.executable}")
    print("-" * 60)

    # 2. Package Import Checks
    packages = [
        ("PyTorch (torch)", "torch"),
        ("Torchvision", "torchvision"),
        ("NumPy", "numpy"),
        ("OpenCV (cv2)", "cv2"),
        ("Pillow (PIL)", "PIL"),
        ("pandas", "pandas"),
        ("scikit-learn", "sklearn"),
        ("Matplotlib", "matplotlib")
    ]

    all_passed = True
    imported_modules = {}

    print("Package Status Check:")
    for name, module_name in packages:
        try:
            mod = __import__(module_name)
            version = getattr(mod, '__version__', 'Installed (no __version__)')
            imported_modules[module_name] = mod
            print(f"  [OK] {name:<22}: {version}")
        except ImportError as e:
            all_passed = False
            print(f"  [MISSING] {name:<22}: NOT INSTALLED ({e})")

    print("-" * 60)

    # 3. PyTorch Initialization & Device Check
    if 'torch' in imported_modules:
        torch = imported_modules['torch']
        print("PyTorch Initialization Check:")
        try:
            # Test tensor creation
            tensor = torch.tensor([1.0, 2.0, 3.0])
            print(f"  [OK] Tensor Allocation  : {tensor}")

            # CUDA GPU Check
            cuda_available = torch.cuda.is_available()
            print(f"  [OK] CUDA Available     : {cuda_available}")
            if cuda_available:
                gpu_count = torch.cuda.device_count()
                gpu_name = torch.cuda.get_device_name(0)
                print(f"  [OK] GPU Count          : {gpu_count}")
                print(f"  [OK] GPU Model          : {gpu_name}")
            else:
                print("  [INFO] GPU Status       : CUDA not active -- running on CPU mode.")
        except Exception as ex:
            all_passed = False
            print(f"  [ERROR] PyTorch Check   : {ex}")
    else:
        print("PyTorch Check: Skipped (PyTorch not installed in system Python environment yet)")

    print("=" * 60)
    if all_passed:
        print("SUCCESS: Python AI environment foundation is fully verified!")
    else:
        print("NOTICE: Dependencies are configured in requirements.txt for virtual environment installation.")
    print("=" * 60)

if __name__ == '__main__':
    main()

