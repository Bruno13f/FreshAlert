import { Link, useLocation } from "react-router-dom";
import { ScanLine, Sparkles } from "lucide-react";

const navItems = [
	{ path: "/assistant", icon: <Sparkles className="size-5.5" />, index: 0 },
	{ path: "/scan", icon: <ScanLine className="size-5.5" />, index: 1 },
];

export function Navbar({ disabled }: { disabled: boolean }) {
	const location = useLocation();

	let activeIndex =
		navItems.find((item) => item.path === location.pathname)?.index ?? 0;

	return (  
		<div
			className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-999 w-[70%] bg-background/90 shadow-lg rounded-[3rem] p-1"
		>
			<div className="relative h-[30px] w-full">
				{/* Sliding rectangle for active icon */}
				<div
					className={`absolute top-0 h-full w-1/2 rounded-[3rem] transition-transform duration-300 ${
						location.pathname === "/assistant"
							? "animate-pulse bg-gradient-to-r from-[#E5FCF5] via-[#E4F1FB] to-[#F8E8FA]"
							: "bg-[#f7fbf2]"
					}`}
					style={{ transform: `translateX(${activeIndex * 100}%)` }}
				/>
				<div className="grid h-full grid-cols-2 font-medium relative">
					{navItems.map(({ path, icon }) => {
						const isActive = location.pathname === path;

						return (
							<Link
								key={path}
								to={disabled ? "#" : path}
								className={`flex items-center justify-center rounded-full ${disabled ? "pointer-events-none opacity-50" : ""}`}
							>
								<div
									className={`stroke-custom-thin flex items-center justify-center rounded-full transition-colors duration-300 ${
										isActive ? "text-primary" : "text-zinc-600"
									}`}
								>
									{icon}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default Navbar;
