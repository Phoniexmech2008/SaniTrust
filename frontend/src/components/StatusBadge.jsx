import "./StatusBadge.css";

const STATUS_META = {
  functional: { label: "Functional", tone: "good" },
  dirty: { label: "Needs Cleaning", tone: "warn" },
  broken: { label: "Broken", tone: "bad" },
  unknown: { label: "Unreported", tone: "unknown" },
};

export default function StatusBadge({ status, size = "md" }) {
  const meta = STATUS_META[status] || STATUS_META.unknown;
  return (
    <span className={`status-badge status-badge--${meta.tone} status-badge--${size}`}>
      <span className="status-badge__dot" />
      {meta.label}
    </span>
  );
}
