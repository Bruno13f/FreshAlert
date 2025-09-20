#!/usr/bin/env python3
"""
Quick Image Preprocessor for TensorFlow Lite Models
==================================================

Utility functions for common image preprocessing tasks when testing TFLite models.
"""

import numpy as np
from PIL import Image, ImageEnhance, ImageOps
import cv2

def load_and_preprocess_image(image_path, target_size=(224, 224), normalization='imagenet'):
    """
    Load and preprocess an image with common preprocessing options.
    
    Args:
        image_path: Path to image file
        target_size: Tuple (width, height) for resizing
        normalization: 'imagenet', 'zero_one', 'minus_one_one', or 'none'
    
    Returns:
        Preprocessed image as numpy array with shape [1, H, W, C]
    """
    # Load image
    image = Image.open(image_path).convert('RGB')
    
    # Resize
    image = image.resize(target_size, Image.Resampling.LANCZOS)
    
    # Convert to numpy
    img_array = np.array(image, dtype=np.float32)
    
    # Apply normalization
    if normalization == 'imagenet':
        # ImageNet normalization
        img_array = img_array / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
    elif normalization == 'zero_one':
        img_array = img_array / 255.0
    elif normalization == 'minus_one_one':
        img_array = (img_array / 255.0 - 0.5) * 2.0
    # 'none' keeps original values
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

def preprocess_for_mobilenet(image_path, input_size=224):
    """Preprocess image for MobileNet models."""
    return load_and_preprocess_image(
        image_path, 
        target_size=(input_size, input_size),
        normalization='minus_one_one'
    )

def preprocess_for_efficientnet(image_path, input_size=224):
    """Preprocess image for EfficientNet models."""
    return load_and_preprocess_image(
        image_path,
        target_size=(input_size, input_size),
        normalization='imagenet'
    )

def preprocess_for_resnet(image_path, input_size=224):
    """Preprocess image for ResNet models."""
    return load_and_preprocess_image(
        image_path,
        target_size=(input_size, input_size),
        normalization='imagenet'
    )

def preprocess_custom(image_path, height, width, channels=3, dtype=np.float32, normalize=True):
    """
    Custom preprocessing for specific model requirements.
    
    Args:
        image_path: Path to image
        height, width: Target dimensions
        channels: Number of channels (1 for grayscale, 3 for RGB)
        dtype: Target data type
        normalize: Whether to normalize to [0,1] range
    
    Returns:
        Preprocessed image array
    """
    # Load image
    image = Image.open(image_path)
    
    # Convert color space
    if channels == 1:
        image = image.convert('L')
    elif channels == 3:
        image = image.convert('RGB')
    
    # Resize
    image = image.resize((width, height), Image.Resampling.LANCZOS)
    
    # Convert to numpy
    img_array = np.array(image, dtype=dtype)
    
    # Normalize if requested
    if normalize and dtype in [np.float32, np.float64]:
        if np.max(img_array) > 1.0:
            img_array = img_array / 255.0
    
    # Add batch dimension
    if len(img_array.shape) == 2:  # Grayscale
        img_array = np.expand_dims(img_array, axis=-1)  # Add channel dim
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dim
    
    return img_array

def augment_image(image_path, output_dir, num_augmentations=5):
    """
    Create augmented versions of an image for testing robustness.
    
    Args:
        image_path: Path to original image
        output_dir: Directory to save augmented images
        num_augmentations: Number of augmented versions to create
    """
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    image = Image.open(image_path)
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    augmentations = []
    
    # Original
    augmentations.append(("original", image))
    
    # Brightness variations
    enhancer = ImageEnhance.Brightness(image)
    augmentations.append(("bright", enhancer.enhance(1.3)))
    augmentations.append(("dark", enhancer.enhance(0.7)))
    
    # Contrast variations
    enhancer = ImageEnhance.Contrast(image)
    augmentations.append(("high_contrast", enhancer.enhance(1.3)))
    augmentations.append(("low_contrast", enhancer.enhance(0.7)))
    
    # Rotation
    augmentations.append(("rotated_10", image.rotate(10, expand=True, fillcolor='white')))
    
    # Horizontal flip
    augmentations.append(("flipped", ImageOps.mirror(image)))
    
    # Save augmented images
    saved_paths = []
    for i, (name, aug_image) in enumerate(augmentations[:num_augmentations]):
        output_path = os.path.join(output_dir, f"{base_name}_{name}.jpg")
        aug_image.save(output_path)
        saved_paths.append(output_path)
        print(f"Saved: {output_path}")
    
    return saved_paths

def test_with_multiple_images(model_interpreter, image_paths, preprocess_fn):
    """
    Test a model with multiple images and compare results.
    
    Args:
        model_interpreter: TensorFlow Lite interpreter
        image_paths: List of image paths
        preprocess_fn: Function to preprocess images
    
    Returns:
        Dictionary with results for each image
    """
    results = {}
    
    input_details = model_interpreter.get_input_details()
    output_details = model_interpreter.get_output_details()
    
    for img_path in image_paths:
        print(f"\nTesting: {img_path}")
        
        # Preprocess
        input_data = preprocess_fn(img_path)
        
        # Run inference
        model_interpreter.set_tensor(input_details[0]['index'], input_data)
        model_interpreter.invoke()
        output_data = model_interpreter.get_tensor(output_details[0]['index'])
        
        # Store results
        results[img_path] = {
            'output': output_data.copy(),
            'top_prediction': np.argmax(output_data),
            'confidence': np.max(output_data),
            'top5_indices': np.argsort(output_data.flatten())[-5:][::-1]
        }
        
        print(f"Top prediction: {results[img_path]['top_prediction']} "
              f"(confidence: {results[img_path]['confidence']:.4f})")
    
    return results

if __name__ == "__main__":
    # Example usage
    print("Image preprocessing utilities loaded!")
    print("Available functions:")
    print("- load_and_preprocess_image()")
    print("- preprocess_for_mobilenet()")
    print("- preprocess_for_efficientnet()")
    print("- preprocess_for_resnet()")
    print("- preprocess_custom()")
    print("- augment_image()")
    print("- test_with_multiple_images()")