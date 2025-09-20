import { RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function Header() {
	const [isRotating, setIsRotating] = useState(false);

	const handleRotateClick = () => {
		setIsRotating(true);
		setTimeout(() => setIsRotating(false), 1000); // Reset after 1 second
	};

	return (  
		<div className="absolute top-0 left-0 border-b h-14 w-full bg-background z-900">
            <div className="flex w-full h-full items-center justify-between px-4">
                <Button variant="secondary" size="icon" className="size-8 invisible">
                    <RotateCcw />
                </Button>
                <span
                    className="text-lg font-bold bg-gradient-to-r from-[#6cf2ca] via-[#96cef9] to-[#e993f5] bg-clip-text text-transparent"
                >
                    AI ASSISTANT
                </span>
                <Button
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-xl"
                    onClick={handleRotateClick}
                >
                    <RotateCcw className={isRotating ? "animate-rotate" : ""} />
                </Button>
            </div>

            <style>
                {`
                @keyframes rotate {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(-360deg);
                    }
                }
                .animate-rotate {
                    animation: rotate 0.5s linear;
                }
                `}
            </style>
        </div>
	);
}

export default Header;
