import Image from "next/image";
import { cn } from "@/lib/utils";
import logoImg from "../../../public/logo.png";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
}

export default function BrandLogo({ className, imageClassName }: BrandLogoProps) {
  return (
    <div className={cn(
      "bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 p-2 overflow-hidden transition-transform",
      className
    )}>
      <Image 
        src={logoImg} 
        alt="PNP Logo" 
        className={cn(
          "h-full w-full object-contain brightness-0 invert scale-[1.35] [filter:brightness(0)_invert(1)_drop-shadow(0_0_0.2px_white)_drop-shadow(0_0_0.2px_white)]",
          imageClassName
        )}
      />
    </div>
  );
}
