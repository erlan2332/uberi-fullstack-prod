export default function Footer() {
  return (
    <footer className="footer">
      <div className="containerWide footer__inner">
        <div>
          <div className="footer__brand">Экотакси “Убери”</div>
          <div className="muted">Вывоз ненужных вещей на переработку</div>
        </div>

      </div>

      <div className="footer__bottom">
        <div className="containerWide muted">© {new Date().getFullYear()} • Demo</div>
      </div>
    </footer>
  );
}