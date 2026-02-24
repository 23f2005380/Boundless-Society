import Image from "next/image";

interface MemberAvatarProps {
    src: string;
    alt: string;
    className?: string;
    containerClassName?: string;
}

export default function MemberAvatar({ src, alt, className = "", containerClassName = "" }: MemberAvatarProps) {
    return (
        <div className={`relative aspect-square overflow-hidden flex-shrink-0 ${containerClassName}`}>
            <Image
                src={src}
                alt={alt}
                fill
                className={`object-cover object-center ${className}`}
            />
        </div>
    );
}
