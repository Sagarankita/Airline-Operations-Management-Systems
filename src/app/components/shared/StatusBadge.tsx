interface StatusBadgeProps {
  status: string;
  variant?: "default" | "small";
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes("active") || normalizedStatus.includes("boarded") || normalizedStatus.includes("landed")) {
      return { bg: "#27AE60", text: "white" };
    }
    if (normalizedStatus.includes("delayed") || normalizedStatus.includes("pending") || normalizedStatus.includes("boarding")) {
      return { bg: "#F39C12", text: "white" };
    }
    if (normalizedStatus.includes("cancelled") || normalizedStatus.includes("alert")) {
      return { bg: "#E74C3C", text: "white" };
    }
    if (normalizedStatus.includes("available") || normalizedStatus.includes("departed") || normalizedStatus.includes("en route")) {
      return { bg: "#2E86DE", text: "white" };
    }
    if (normalizedStatus.includes("on leave") || normalizedStatus.includes("on duty")) {
      return { bg: "#95A5A6", text: "white" };
    }
    // Default gray
    return { bg: "#95A5A6", text: "white" };
  };

  const styles = getStatusStyles(status);
  const padding = variant === "small" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-block ${padding} rounded-full`}
      style={{ backgroundColor: styles.bg, color: styles.text, fontWeight: 500 }}
    >
      {status}
    </span>
  );
}
