import CameraComponent from "@/components/camera-component";
import * as tf from "@tensorflow/tfjs";

function ScanPage({ model }: { model: tf.GraphModel }) {
  return (
    <main className="max-w-lg mx-auto w-full">
      <CameraComponent model={model} />
    </main>
  );
}

export default ScanPage;