import "./RadiusControl.css";

const MIN_KM = 0.5;
const MAX_KM = 10;
const STEP_KM = 0.5;

export default function RadiusControl({
  active,
  radiusKm,
  onRadiusChange,
  onEnable,
  manualPickMode,
  onStartManualPick,
  onCancelManualPick,
  loading,
  error,
  matchCount,
}) {
  if (manualPickMode) {
    return (
      <div className="radius-control radius-control--picking">
        <p className="radius-control__picking-text">
          📍 Tap anywhere on the map to set your location
        </p>
        <button className="radius-control__cancel" onClick={onCancelManualPick}>
          Cancel
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="radius-control radius-control--collapsed">
        <button className="radius-control__enable" onClick={onEnable} disabled={loading}>
          {loading ? "Locating…" : "📍 Toilets near me"}
        </button>
        {error && <p className="radius-control__error">{error}</p>}
        <button className="radius-control__manual-link" onClick={onStartManualPick}>
          Set location manually
        </button>
      </div>
    );
  }

  return (
    <div className="radius-control">
      <div className="radius-control__top">
        <span className="tag radius-control__label">Search radius</span>
        <span className="radius-control__value">{radiusKm} km</span>
      </div>
      <input
        type="range"
        className="radius-control__slider"
        min={MIN_KM}
        max={MAX_KM}
        step={STEP_KM}
        value={radiusKm}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
      />
      <div className="radius-control__scale">
        <span>{MIN_KM} km</span>
        <span>{MAX_KM} km</span>
      </div>
      <p className="radius-control__count">
        {matchCount} facilit{matchCount === 1 ? "y" : "ies"} within range
      </p>
      <button type="button" className="radius-control__reposition" onClick={onStartManualPick}>
        Reposition manually
      </button>
    </div>
  );
}
