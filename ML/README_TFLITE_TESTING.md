# TensorFlow Lite Model Testing Guide

This directory contains utilities to quickly test TensorFlow Lite models with images.

## Quick Start

### 1. Install Dependencies

```bash
pip install tensorflow pillow numpy opencv-python
```

### 2. Basic Usage

Test your model with a single image:

```bash
python test_tflite_model.py your_model.tflite test_image.jpg
```

### 3. Advanced Usage

```bash
# With class labels file
python test_tflite_model.py model.tflite image.jpg --classes classes.txt

# Save raw output for analysis
python test_tflite_model.py model.tflite image.jpg --save-output output.npy
```

## Example Commands

### For your meat freshness model:

```bash
# Test with a fresh meat image
python test_tflite_model.py meat_freshness_model.tflite dataset/train/FRESH-100-_JPG.rf.65e835ab6a2890785aade192d1e19549.jpg

# Test with a spoiled meat image
python test_tflite_model.py meat_freshness_model.tflite dataset/train/SPOILED-123-example.jpg

# With classes file (create classes.txt with: FRESH, SPOILED)
echo -e "FRESH\nSPOILED" > classes.txt
python test_tflite_model.py meat_freshness_model.tflite test_image.jpg --classes classes.txt
```

## What the Script Does

1. **Loads your TFLite model** and displays its input/output specifications
2. **Preprocesses the image** by:

   - Resizing to the expected input dimensions
   - Converting color format (RGB/Grayscale)
   - Normalizing pixel values (0-1 or 0-255 range)
   - Adding batch dimension

3. **Runs inference** and measures execution time
4. **Interprets results** by:
   - Showing top predictions for classification
   - Displaying confidence scores
   - Using class labels if provided

## Common Model Types

### Classification Models (e.g., MobileNet, EfficientNet)

- **Input**: [1, H, W, 3] (RGB image)
- **Output**: [1, num_classes] (class probabilities)
- **Example**: Your meat freshness classifier

### Object Detection Models (e.g., YOLOv5, SSD)

- **Input**: [1, H, W, 3] (RGB image)
- **Output**: [1, num_detections, 6] (boxes + scores + classes)

### Segmentation Models

- **Input**: [1, H, W, 3] (RGB image)
- **Output**: [1, H, W, num_classes] (pixel-wise predictions)

## Example Output

```
🤖 TensorFlow Lite Model Tester
========================================

📁 Loading model: meat_freshness_model.tflite
📋 Model Information:
   Input shape: [1, 224, 224, 3]
   Input dtype: <class 'numpy.float32'>
   Output shape: [1, 2]
   Output dtype: <class 'numpy.float32'>

🖼️  Loading image: fresh_meat.jpg
📸 Original image: (800, 600) (RGB)
📏 Resized to: (224, 224)
🔢 Normalized to [0, 1] range
✅ Preprocessed shape: (1, 224, 224, 3), dtype: float32
   Value range: [0.000, 1.000]

🚀 Running inference...
✅ Inference completed!

📊 Model Output:
   Shape: (1, 2)
   Dtype: float32
   Classification scores (top 5):
   1. FRESH: 0.8523 (85.2%)
   2. SPOILED: 0.1477 (14.8%)

🎉 Test completed successfully!
```

## Troubleshooting

### Common Issues:

1. **"Invalid input shape"**

   - Check your model's expected input dimensions
   - The script auto-detects and resizes images

2. **"ValueError: cannot reshape array"**

   - Your model might expect a different input format
   - Try different normalization methods in the script

3. **Poor predictions**
   - Ensure image preprocessing matches training preprocessing
   - Check if model expects specific normalization (ImageNet, [0,1], [-1,1])

### Custom Preprocessing

If the automatic preprocessing doesn't work, modify the `preprocess_image()` function or use `image_utils.py`:

```python
from image_utils import preprocess_for_mobilenet, preprocess_custom

# For MobileNet-style models
input_data = preprocess_for_mobilenet("image.jpg", input_size=224)

# Custom preprocessing
input_data = preprocess_custom(
    "image.jpg",
    height=224,
    width=224,
    channels=3,
    normalize=True
)
```

## Testing Multiple Images

```python
from image_utils import test_with_multiple_images, augment_image

# Create augmented test images
augment_image("test_image.jpg", "augmented/", num_augmentations=5)

# Test model robustness
image_paths = ["img1.jpg", "img2.jpg", "img3.jpg"]
results = test_with_multiple_images(interpreter, image_paths, preprocess_fn)
```

## Performance Testing

To test inference speed:

```bash
# Run multiple times to get average
for i in {1..10}; do
  python test_tflite_model.py model.tflite image.jpg
done
```

## Creating Classes File

For your meat freshness model, create `classes.txt`:

```txt
FRESH
SPOILED
```

Then use it with:

```bash
python test_tflite_model.py model.tflite image.jpg --classes classes.txt
```

This will show human-readable class names instead of numeric indices.
