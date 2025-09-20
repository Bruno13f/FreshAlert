import React, { useState, useRef } from "react";
import { Camera } from "react-camera-pro";
import { Button } from "./ui/button";

const CameraComponent = () => {
  const camera = useRef<any>(null);
  const [image, setImage] = useState<string | null>(null);

  const handleTakePhoto = () => {
    if (camera.current) {
      try {
        const photo = camera.current.takePhoto();
        const image = new Image();
        image.src = photo;

        image.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            // Set canvas dimensions to match the visualizer (square with rounded corners)
            const visualizerSize = 256; // 64 * 4 (tailwind w-64 is 16rem, which is 256px)
            canvas.width = visualizerSize;
            canvas.height = visualizerSize;

            // Calculate cropping coordinates (centered square, accounting for mt-20)
            const cropX = (image.width - visualizerSize) / 2;
            const cropY = (image.height - visualizerSize) / 2 - 80; // mt-20 corresponds to 80px

            // Draw the cropped image onto the canvas
            context.drawImage(
              image,
              cropX,
              cropY,
              visualizerSize,
              visualizerSize,
              0,
              0,
              visualizerSize,
              visualizerSize
            );

            // Convert the canvas content to a data URL
            const croppedPhoto = canvas.toDataURL("image/jpeg");
            setImage(croppedPhoto);
          }
        };
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    } else {
      console.error("Camera is not initialized.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Camera
        ref={camera}
        errorMessages={{
          noCameraAccessible:
            "No camera device accessible. Please connect your camera or try a different browser.",
          permissionDenied: "Permission denied. Please allow camera access.",
          switchCamera:
            "It is not possible to switch the camera to a different one since there is only one video device accessible.",
          canvas: "Canvas is not supported.",
        }}
      />
      <Button
        onClick={handleTakePhoto}
        className="absolute bottom-0 mb-20 px-4 py-2 bg-primary/90 
        text-background rounded-xl z-900 font-semibold text-base"
      >
        Scan
      </Button>
      {image && 
      <div 
        className="absolute inset-0 flex items-center justify-center z-999 bg-zinc-900/80"
        onClick={() => setImage(null)}
      >
        <div className="relative w-64 h-64 rounded-lg overflow-hidden border-3 border-background"> {/* Visualizer container with gradient border */}
          <img src={image} alt="Taken photo" className="w-full h-full object-cover" />
          {/* Scanning animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6cf2ca]/50 to-transparent animate-scan"></div>
        </div>
      </div>
      }

      <style>
        {`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 2s infinite;
        }
        `}
      </style>

      <div className="absolute inset-0 flex items-center justify-center mb-30">
        <div className="relative w-64 h-64 rounded-lg">  {/* Added rounded-lg for rounded corners */}
          {/* Top-left corner */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-secondary rounded-tl-lg"></div>
          {/* Top-right corner */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-secondary rounded-tr-lg"></div>
          {/* Bottom-left corner */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-secondary rounded-bl-lg"></div>
          {/* Bottom-right corner */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-secondary rounded-br-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default CameraComponent;
