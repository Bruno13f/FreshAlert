#!/usr/bin/env python3
"""
Quick TensorFlow Lite Model Tester
==================================

This script allows you to quickly test a TensorFlow Lite model with an image.
It handles common preprocessing steps and provides clear output interpretation.

Usage:
    python test_tflite_model.py path/to/model.tflite path/to/image.jpg

Requirements:
    pip install tensorflow pillow numpy
"""

import argparse
import numpy as np
import tensorflow as tf
from PIL import Image
import os
import sys

def load_tflite_model(model_path):
    """Load TensorFlow Lite model and return interpreter."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter

def get_model_info(interpreter):
    """Get input and output details from the model."""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("📋 Model Information:")
    print(f"   Input shape: {input_details[0]['shape']}")
    print(f"   Input dtype: {input_details[0]['dtype']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    print(f"   Output dtype: {output_details[0]['dtype']}")
    print()
    
    return input_details, output_details

def preprocess_image(image_path, input_shape, input_dtype):
    """
    Preprocess image for model input.
    
    Args:
        image_path: Path to the image file
        input_shape: Expected input shape [batch, height, width, channels]
        input_dtype: Expected input data type
    
    Returns:
        Preprocessed image as numpy array
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    # Load image
    image = Image.open(image_path)
    print(f"📸 Original image: {image.size} ({image.mode})")
    
    # Get target dimensions (remove batch dimension)
    if len(input_shape) == 4:  # [batch, height, width, channels]
        target_height, target_width = input_shape[1], input_shape[2]
        channels = input_shape[3]
    elif len(input_shape) == 3:  # [height, width, channels]
        target_height, target_width = input_shape[0], input_shape[1]
        channels = input_shape[2]
    else:
        raise ValueError(f"Unsupported input shape: {input_shape}")
    
    # Convert to RGB if needed
    if channels == 3 and image.mode != 'RGB':
        image = image.convert('RGB')
    elif channels == 1 and image.mode != 'L':
        image = image.convert('L')
    
    # Resize image
    image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
    print(f"📏 Resized to: {image.size}")
    
    # Convert to numpy array
    img_array = np.array(image, dtype=np.float32)
    
    # Add batch dimension if needed
    if len(input_shape) == 4:
        img_array = np.expand_dims(img_array, axis=0)
    
    # Normalize based on dtype and common practices
    if input_dtype == np.uint8:
        # Keep values in 0-255 range
        img_array = img_array.astype(np.uint8)
        print("🔢 Keeping values in [0, 255] range (uint8)")
    else:
        # Normalize to [0, 1] or [-1, 1] range
        if np.max(img_array) > 1.0:
            img_array = img_array / 255.0
            print("🔢 Normalized to [0, 1] range")
        
        # Some models expect [-1, 1] range, uncomment if needed:
        # img_array = (img_array - 0.5) * 2.0
        # print("🔢 Normalized to [-1, 1] range")
    
    print(f"✅ Preprocessed shape: {img_array.shape}, dtype: {img_array.dtype}")
    print(f"   Value range: [{np.min(img_array):.3f}, {np.max(img_array):.3f}]")
    print()
    
    return img_array

def run_inference(interpreter, input_data):
    """Run inference on the model."""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Set input
    interpreter.set_tensor(input_details[0]['index'], input_data)
    
    # Run inference
    print("🚀 Running inference...")
    interpreter.invoke()
    
    # Get output
    output_data = interpreter.get_tensor(output_details[0]['index'])
    print("✅ Inference completed!")
    print()
    
    return output_data

def interpret_output(output_data, classes_file=None):
    """Interpret model output."""
    print("📊 Model Output:")
    print(f"   Shape: {output_data.shape}")
    print(f"   Dtype: {output_data.dtype}")
    
    # Remove batch dimension if present
    if len(output_data.shape) > 1 and output_data.shape[0] == 1:
        output_data = output_data.squeeze(0)
    
    # Load class labels if provided
    class_labels = None
    if classes_file and os.path.exists(classes_file):
        with open(classes_file, 'r') as f:
            class_labels = [line.strip() for line in f.readlines()]
        print(f"   Loaded {len(class_labels)} class labels")
    
    # Classification output (single vector)
    if len(output_data.shape) == 1:
        print(f"   Classification scores (top 5):")
        
        # Get top 5 predictions
        top_indices = np.argsort(output_data)[-5:][::-1]
        
        for i, idx in enumerate(top_indices):
            score = output_data[idx]
            label = class_labels[idx] if class_labels and idx < len(class_labels) else f"Class {idx}"
            print(f"   {i+1}. {label}: {score:.4f} ({score*100:.1f}%)")
    
    # Multi-dimensional output (detection, segmentation, etc.)
    else:
        print(f"   Raw output shape: {output_data.shape}")
        print(f"   Value range: [{np.min(output_data):.4f}, {np.max(output_data):.4f}]")
        print(f"   Mean: {np.mean(output_data):.4f}, Std: {np.std(output_data):.4f}")
        
        # If it looks like detection output
        if len(output_data.shape) == 2 and output_data.shape[1] > 4:
            print("   Looks like object detection output (boxes + scores + classes)")
            print(f"   Detected {output_data.shape[0]} potential objects")
    
    print()
    return output_data

def main():
    parser = argparse.ArgumentParser(description='Test TensorFlow Lite model with an image')
    parser.add_argument('model_path', help='Path to the .tflite model file')
    parser.add_argument('image_path', help='Path to the input image')
    parser.add_argument('--classes', help='Path to classes.txt file (optional)')
    parser.add_argument('--save-output', help='Save raw output to numpy file')
    
    args = parser.parse_args()
    
    try:
        print("🤖 TensorFlow Lite Model Tester")
        print("=" * 40)
        print()
        
        # Load model
        print(f"📁 Loading model: {args.model_path}")
        interpreter = load_tflite_model(args.model_path)
        
        # Get model info
        input_details, output_details = get_model_info(interpreter)
        
        # Preprocess image
        print(f"🖼️  Loading image: {args.image_path}")
        input_data = preprocess_image(
            args.image_path, 
            input_details[0]['shape'], 
            input_details[0]['dtype']
        )
        
        # Run inference
        output_data = run_inference(interpreter, input_data)
        
        # Interpret results
        interpret_output(output_data, args.classes)
        
        # Save output if requested
        if args.save_output:
            np.save(args.save_output, output_data)
            print(f"💾 Raw output saved to: {args.save_output}")
        
        print("🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()