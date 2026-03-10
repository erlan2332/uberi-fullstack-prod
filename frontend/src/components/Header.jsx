import Button from "./ui/Button.jsx";

const PHONE = "+7 (495) 414-11-24";

export default function Header() {
  return (
    <header className="header" id="top">
      <div className="header__inner containerWide">
        <a href="#top" className="brand">
          Убери<span className="brand__dot">•</span>
        </a>

        <nav className="nav">
          <a href="#services" className="nav__link">Услуги</a>
          <a href="#prices" className="nav__link">Цены</a>
          <a href="#about" className="nav__link">О компании</a>
          <a href="#contacts" className="nav__link">Контакты</a>
        </nav>

        <div className="header__right">
          <a className="phonePill" href={`tel:${PHONE.replace(/[^\d+]/g, "")}`}>
            {PHONE}
          </a>
          <Button
            variant="primary"
            onClick={() => document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth" })}
          >
            Заказать вывоз
          </Button>
        </div>
      </div>
    </header>
  );
}