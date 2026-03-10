export default function Button({ variant = "default", className = "", ...props }) {
  const map = {
    primary: "btn--primary",
    default: "btn--default",
    ghost: "btn--ghost",
  };

  const v = map[variant] || map.default;
  return <button className={`btn ${v} ${className}`} {...props} />;
}