/**
 * The Welcome screen's mark: the FloodWay wave fills with water, holds and drains on an 8 s loop, with sonar rings for
 * "early warning" behind it. Pure CSS (styles in index.css, `.fw-logo*`). Decorative: the name is written beside it.
 * Reduced motion shows the mark full and still.
 */
export function LogoLoop({ className = '' }: { className?: string }) {
  return (
    <div className={`fw-logo ${className}`} aria-hidden="true">
      <span className="fw-logo-ring" />
      <span className="fw-logo-ring" />
      <span className="fw-logo-ring" />
      <div className="fw-logo-glass">
        <div className="fw-logo-water">
          <span className="fw-logo-crest fw-logo-crest--back" />
          <span className="fw-logo-crest" />
          <span className="fw-logo-body" />
        </div>
      </div>
    </div>
  );
}
