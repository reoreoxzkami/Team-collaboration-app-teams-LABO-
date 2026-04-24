interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton = ({
  className = "",
  width,
  height,
  rounded = "rounded-xl",
}: SkeletonProps) => (
  <div
    className={`skeleton ${rounded} ${className}`}
    style={{ width, height }}
    aria-hidden
  />
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={12}
        rounded="rounded-full"
        className={i === lines - 1 ? "w-2/3" : "w-full"}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="glass-card p-5">
    <div className="flex items-center gap-3">
      <Skeleton width={44} height={44} rounded="rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={12} rounded="rounded-full" />
        <Skeleton width="40%" height={10} rounded="rounded-full" />
      </div>
    </div>
    <div className="mt-4">
      <SkeletonText lines={3} />
    </div>
  </div>
);
