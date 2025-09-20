import React, { useState, useRef } from "react";
import { Camera } from "react-camera-pro";

const CameraComponent = () => {
  const camera = useRef<any>(null);
  const [image, setImage] = useState<string | null>(null);

  const handleTakePhoto = () => {
    if (camera.current) {
      try {
        const photo = camera.current.takePhoto();
        setImage(photo);
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
      <button
        onClick={handleTakePhoto}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Take Photo
      </button>
      {image && <img src={image} alt="Taken photo" className="mt-4 border" />}
    </div>
  );
};

export default CameraComponent;
